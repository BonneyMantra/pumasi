// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/utils/ReentrancyGuard.sol";
import {IJobFactory} from "./interfaces/IJobFactory.sol";
import {IJobEscrow} from "./interfaces/IJobEscrow.sol";

/// @title JobFactory
/// @notice Factory for creating and managing job escrows with platform fee collection
contract JobFactory is IJobFactory, IJobEscrow, Ownable, ReentrancyGuard {
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1000;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DELIVERY_TIMEOUT = 7 days;
    uint256 public constant OPEN_JOB_TIMEOUT = 30 days;

    uint256 private _platformFeeBps = 300;
    uint256 private _minBudget = 0.0001 ether;
    address private _treasury;
    uint256 private _accumulatedFees;
    bool private _paused;
    uint256 private _nextJobId;

    mapping(uint256 => Job) private _jobs;
    mapping(address => uint256[]) private _clientJobs;
    mapping(address => uint256[]) private _freelancerJobs;
    mapping(address => UserStats) private _userStats;

    modifier whenNotPaused() {
        if (_paused) revert ContractPaused();
        _;
    }

    constructor(address treasuryAddr) Ownable(msg.sender) {
        if (treasuryAddr == address(0)) revert InvalidTreasury();
        _treasury = treasuryAddr;
    }

    function createJob(
        uint256 deadline, string calldata metadataURI
    ) external payable whenNotPaused nonReentrant returns (uint256 jobId) {
        if (msg.value < _minBudget) revert BudgetTooLow();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        jobId = _nextJobId++;
        _jobs[jobId] = Job({
            jobId: jobId, client: msg.sender, freelancer: address(0),
            budget: msg.value, deadline: deadline, status: JobStatus.Open,
            metadataURI: metadataURI, createdAt: block.timestamp,
            deliveredAt: 0, deliverableURI: ""
        });
        _clientJobs[msg.sender].push(jobId);
        _userStats[msg.sender].jobsPosted++;
        emit JobCreated(jobId, msg.sender, msg.value, deadline, metadataURI);
    }

    function assignFreelancer(uint256 jobId, address freelancer) external whenNotPaused nonReentrant {
        Job storage job = _jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Open) revert InvalidJobStatus();
        if (freelancer == msg.sender) revert CannotApplyToOwnJob();
        if (job.freelancer != address(0)) revert FreelancerAlreadyAssigned();
        job.freelancer = freelancer;
        job.status = JobStatus.InProgress;
        _freelancerJobs[freelancer].push(jobId);
        emit FreelancerAssigned(jobId, freelancer, block.timestamp);
    }

    function submitDeliverable(uint256 jobId, string calldata deliverableURI) external whenNotPaused nonReentrant {
        Job storage job = _jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.freelancer != msg.sender) revert NotFreelancer();
        if (job.status != JobStatus.InProgress) revert InvalidJobStatus();
        job.status = JobStatus.Delivered;
        job.deliveredAt = block.timestamp;
        job.deliverableURI = deliverableURI;
        emit DeliverableSubmitted(jobId, msg.sender, deliverableURI, block.timestamp);
    }

    function approveDelivery(uint256 jobId) external whenNotPaused nonReentrant {
        Job storage job = _jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Delivered) revert InvalidJobStatus();
        job.status = JobStatus.Completed;
        _releaseFunds(jobId, job);
        emit JobApproved(jobId, msg.sender, job.freelancer, block.timestamp);
    }

    function requestRevision(uint256 jobId, string calldata reason) external whenNotPaused nonReentrant {
        Job storage job = _jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Delivered) revert InvalidJobStatus();
        job.status = JobStatus.InProgress;
        job.deliveredAt = 0;
        emit RevisionRequested(jobId, msg.sender, reason, block.timestamp);
    }

    function raiseDispute(uint256 jobId) external whenNotPaused nonReentrant {
        Job storage job = _jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (msg.sender != job.client && msg.sender != job.freelancer) revert InvalidJobStatus();
        if (job.status != JobStatus.InProgress && job.status != JobStatus.Delivered) revert InvalidJobStatus();
        job.status = JobStatus.Disputed;
        emit JobDisputed(jobId, msg.sender, block.timestamp);
    }

    function cancelJob(uint256 jobId) external whenNotPaused nonReentrant {
        Job storage job = _jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.client != msg.sender) revert NotClient();
        if (job.status != JobStatus.Open) revert InvalidJobStatus();
        job.status = JobStatus.Cancelled;
        _userStats[msg.sender].jobsCancelled++;
        (bool success,) = msg.sender.call{value: job.budget}("");
        if (!success) revert TransferFailed();
        emit JobCancelled(jobId, msg.sender, block.timestamp);
    }

    function handleTimeout(uint256 jobId) external whenNotPaused nonReentrant {
        Job storage job = _jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.status == JobStatus.Open) {
            if (block.timestamp < job.createdAt + OPEN_JOB_TIMEOUT) revert InvalidJobStatus();
            job.status = JobStatus.Cancelled;
            _userStats[job.client].jobsCancelled++;
            (bool success,) = job.client.call{value: job.budget}("");
            if (!success) revert TransferFailed();
            emit JobCancelled(jobId, address(this), block.timestamp);
        } else if (job.status == JobStatus.Delivered) {
            if (block.timestamp < job.deliveredAt + DELIVERY_TIMEOUT) revert InvalidJobStatus();
            job.status = JobStatus.Completed;
            _releaseFunds(jobId, job);
            emit JobApproved(jobId, address(this), job.freelancer, block.timestamp);
        } else {
            revert InvalidJobStatus();
        }
    }

    // View functions
    function getJob(uint256 jobId) external view returns (Job memory) { return _jobs[jobId]; }
    function getJobForValidation(uint256 jobId) external view returns (address client, JobStatus status) {
        Job storage job = _jobs[jobId];
        return (job.client, job.status);
    }
    function getClientJobs(address client) external view returns (uint256[] memory) { return _clientJobs[client]; }
    function getFreelancerJobs(address freelancer) external view returns (uint256[] memory) { return _freelancerJobs[freelancer]; }
    function minBudget() external view returns (uint256) { return _minBudget; }
    function platformFeeBps() external view returns (uint256) { return _platformFeeBps; }
    function totalJobs() external view returns (uint256) { return _nextJobId; }
    function getUserStats(address user) external view returns (UserStats memory) { return _userStats[user]; }
    function isPaused() external view returns (bool) { return _paused; }
    function treasury() external view returns (address) { return _treasury; }
    function accumulatedFees() external view returns (uint256) { return _accumulatedFees; }

    // Admin functions
    function pause() external onlyOwner {
        _paused = true;
        emit Paused(msg.sender, block.timestamp);
    }

    function unpause() external onlyOwner {
        _paused = false;
        emit Unpaused(msg.sender, block.timestamp);
    }

    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_PLATFORM_FEE_BPS) revert FeeTooHigh();
        emit PlatformFeeUpdated(_platformFeeBps, newFeeBps);
        _platformFeeBps = newFeeBps;
    }

    function setMinBudget(uint256 newMinBudget) external onlyOwner {
        if (newMinBudget == 0) revert MinBudgetTooLow();
        emit MinBudgetUpdated(_minBudget, newMinBudget);
        _minBudget = newMinBudget;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidTreasury();
        emit TreasuryUpdated(_treasury, newTreasury);
        _treasury = newTreasury;
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 fees = _accumulatedFees;
        _accumulatedFees = 0;
        (bool success,) = _treasury.call{value: fees}("");
        if (!success) revert TransferFailed();
        emit FeesCollected(_treasury, fees);
    }

    function _releaseFunds(uint256 jobId, Job storage job) internal {
        uint256 fee = (job.budget * _platformFeeBps) / BASIS_POINTS;
        uint256 payout = job.budget - fee;
        _accumulatedFees += fee;
        _userStats[job.client].totalSpent += job.budget;
        _userStats[job.freelancer].totalEarned += payout;
        _userStats[job.client].jobsCompleted++;
        _userStats[job.freelancer].jobsCompleted++;
        (bool success,) = job.freelancer.call{value: payout}("");
        if (!success) revert TransferFailed();
        emit FundsReleased(jobId, job.freelancer, payout, fee);
    }
}
