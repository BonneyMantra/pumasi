// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/utils/ReentrancyGuard.sol";
import {IMilestoneManager} from "./interfaces/IMilestoneManager.sol";
import {IJobEscrow} from "./interfaces/IJobEscrow.sol";

/// @title MilestoneManager
/// @notice Manages milestone-based payments for jobs
/// @dev Integrates with JobEscrow for fund management
contract MilestoneManager is IMilestoneManager, ReentrancyGuard {
    // ============ Constants ============

    uint256 public constant PLATFORM_FEE_BPS = 300;
    uint256 public constant BASIS_POINTS = 10000;

    // ============ Storage ============

    IJobEscrow public immutable jobEscrow;
    address public treasury;

    uint256 private _nextMilestoneId;

    mapping(uint256 => Milestone) private _milestones;
    mapping(uint256 => uint256[]) private _jobMilestones;
    mapping(uint256 => uint256) private _jobMilestoneAmounts;

    // ============ Constructor ============

    constructor(address _jobEscrow, address _treasury) {
        jobEscrow = IJobEscrow(_jobEscrow);
        treasury = _treasury;
    }

    // ============ External Functions ============

    /// @inheritdoc IMilestoneManager
    function createMilestones(
        uint256 jobId,
        uint256[] calldata amounts,
        uint256[] calldata deadlines,
        string[] calldata metadataURIs
    ) external nonReentrant returns (uint256[] memory milestoneIds) {
        if (amounts.length == 0) revert NoMilestonesProvided();
        if (amounts.length != deadlines.length || amounts.length != metadataURIs.length) {
            revert InvalidMilestoneAmounts();
        }
        if (_jobMilestones[jobId].length > 0) revert MilestonesAlreadyExist();

        IJobEscrow.Job memory job = jobEscrow.getJob(jobId);
        if (job.client == address(0)) revert InvalidJob();
        if (job.client != msg.sender) revert NotClient();
        if (job.status != IJobEscrow.JobStatus.Open) revert InvalidJob();

        uint256 totalAmount;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        if (totalAmount != job.budget) revert InvalidMilestoneAmounts();

        milestoneIds = new uint256[](amounts.length);
        uint256 prevDeadline = block.timestamp;

        for (uint256 i = 0; i < amounts.length; i++) {
            if (deadlines[i] <= prevDeadline) revert InvalidDeadline();
            if (deadlines[i] > job.deadline) revert InvalidDeadline();

            uint256 milestoneId = _nextMilestoneId++;
            milestoneIds[i] = milestoneId;

            _milestones[milestoneId] = Milestone({
                milestoneId: milestoneId,
                jobId: jobId,
                amount: amounts[i],
                deadline: deadlines[i],
                status: MilestoneStatus.Pending,
                metadataURI: metadataURIs[i],
                deliverableURI: "",
                createdAt: block.timestamp,
                deliveredAt: 0
            });

            _jobMilestones[jobId].push(milestoneId);
            prevDeadline = deadlines[i];

            emit MilestoneCreated(milestoneId, jobId, amounts[i], deadlines[i], metadataURIs[i]);
        }

        _jobMilestoneAmounts[jobId] = totalAmount;
    }

    /// @inheritdoc IMilestoneManager
    function startMilestone(uint256 milestoneId) external nonReentrant {
        Milestone storage milestone = _milestones[milestoneId];
        if (milestone.createdAt == 0) revert MilestoneNotFound();

        IJobEscrow.Job memory job = jobEscrow.getJob(milestone.jobId);
        if (job.freelancer != msg.sender) revert NotFreelancer();
        if (milestone.status != MilestoneStatus.Pending) revert InvalidMilestoneStatus();

        milestone.status = MilestoneStatus.InProgress;

        emit MilestoneStarted(milestoneId, milestone.jobId, block.timestamp);
    }

    /// @inheritdoc IMilestoneManager
    function deliverMilestone(uint256 milestoneId, string calldata deliverableURI) external nonReentrant {
        Milestone storage milestone = _milestones[milestoneId];
        if (milestone.createdAt == 0) revert MilestoneNotFound();

        IJobEscrow.Job memory job = jobEscrow.getJob(milestone.jobId);
        if (job.freelancer != msg.sender) revert NotFreelancer();
        if (milestone.status != MilestoneStatus.InProgress) revert InvalidMilestoneStatus();

        milestone.status = MilestoneStatus.Delivered;
        milestone.deliverableURI = deliverableURI;
        milestone.deliveredAt = block.timestamp;

        emit MilestoneDelivered(milestoneId, milestone.jobId, deliverableURI, block.timestamp);
    }

    /// @inheritdoc IMilestoneManager
    function approveMilestone(uint256 milestoneId) external nonReentrant {
        Milestone storage milestone = _milestones[milestoneId];
        if (milestone.createdAt == 0) revert MilestoneNotFound();

        IJobEscrow.Job memory job = jobEscrow.getJob(milestone.jobId);
        if (job.client != msg.sender) revert NotClient();
        if (milestone.status != MilestoneStatus.Delivered) revert InvalidMilestoneStatus();

        milestone.status = MilestoneStatus.Approved;

        uint256 fee = (milestone.amount * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 payout = milestone.amount - fee;

        (bool feeSuccess,) = treasury.call{value: fee}("");
        if (!feeSuccess) revert TransferFailed();

        (bool payoutSuccess,) = job.freelancer.call{value: payout}("");
        if (!payoutSuccess) revert TransferFailed();

        emit MilestoneApproved(milestoneId, milestone.jobId, payout, block.timestamp);
    }

    /// @inheritdoc IMilestoneManager
    function disputeMilestone(uint256 milestoneId) external nonReentrant {
        Milestone storage milestone = _milestones[milestoneId];
        if (milestone.createdAt == 0) revert MilestoneNotFound();

        IJobEscrow.Job memory job = jobEscrow.getJob(milestone.jobId);
        if (msg.sender != job.client && msg.sender != job.freelancer) revert NotClient();
        if (milestone.status != MilestoneStatus.InProgress && milestone.status != MilestoneStatus.Delivered) {
            revert InvalidMilestoneStatus();
        }

        milestone.status = MilestoneStatus.Disputed;

        emit MilestoneDisputed(milestoneId, milestone.jobId, msg.sender, block.timestamp);
    }

    // ============ View Functions ============

    /// @inheritdoc IMilestoneManager
    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        return _milestones[milestoneId];
    }

    /// @inheritdoc IMilestoneManager
    function getJobMilestones(uint256 jobId) external view returns (uint256[] memory) {
        return _jobMilestones[jobId];
    }

    /// @inheritdoc IMilestoneManager
    function hasMilestones(uint256 jobId) external view returns (bool) {
        return _jobMilestones[jobId].length > 0;
    }

    /// @notice Get total milestone amount for a job
    function getJobMilestoneTotal(uint256 jobId) external view returns (uint256) {
        return _jobMilestoneAmounts[jobId];
    }

    /// @notice Get the next milestone ID
    function nextMilestoneId() external view returns (uint256) {
        return _nextMilestoneId;
    }

    // ============ Receive Function ============

    /// @notice Receive funds for milestone payments
    receive() external payable {}
}
