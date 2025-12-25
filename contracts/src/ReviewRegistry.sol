// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IReviewRegistry} from "./interfaces/IReviewRegistry.sol";
import {IJobEscrow} from "./interfaces/IJobEscrow.sol";

/// @title ReviewRegistry
/// @notice Manages reviews between clients and freelancers after job completion
/// @dev Reviews are linked to completed jobs to prevent fake reviews
contract ReviewRegistry is IReviewRegistry {
    // ============ Storage ============

    /// @notice Next review ID
    uint256 private _nextReviewId;

    /// @notice Job escrow contract reference
    IJobEscrow public jobEscrow;

    /// @notice Mapping of review ID to review data
    mapping(uint256 => Review) private _reviews;

    /// @notice Mapping of user to their received review IDs
    mapping(address => uint256[]) private _userReviews;

    /// @notice Mapping of user to their rating stats
    mapping(address => RatingStats) private _userRatings;

    /// @notice Mapping of (jobId, reviewer) => reviewId (0 if not reviewed)
    mapping(uint256 => mapping(address => uint256)) private _jobReviews;

    // ============ Constructor ============

    /// @notice Initialize the contract
    /// @param _jobEscrow The JobEscrow contract address
    constructor(address _jobEscrow) {
        jobEscrow = IJobEscrow(_jobEscrow);
        _nextReviewId = 1; // Start at 1 so 0 means not reviewed
    }

    // ============ External Functions ============

    /// @inheritdoc IReviewRegistry
    function submitReview(
        uint256 jobId,
        uint8 rating,
        string calldata commentURI
    ) external returns (uint256 reviewId) {
        if (rating < 1 || rating > 5) revert InvalidRating();

        IJobEscrow.Job memory job = jobEscrow.getJob(jobId);

        // Verify job is completed
        if (job.status != IJobEscrow.JobStatus.Completed) revert JobNotCompleted();

        // Verify caller is participant
        bool isClient = job.client == msg.sender;
        bool isFreelancer = job.freelancer == msg.sender;
        if (!isClient && !isFreelancer) revert NotJobParticipant();

        // Check not already reviewed
        if (_jobReviews[jobId][msg.sender] != 0) revert AlreadyReviewed();

        // Determine reviewee
        address reviewee = isClient ? job.freelancer : job.client;
        if (reviewee == msg.sender) revert CannotReviewSelf();

        // Create review
        reviewId = _nextReviewId++;

        Review memory newReview = Review({
            reviewId: reviewId,
            jobId: jobId,
            reviewer: msg.sender,
            reviewee: reviewee,
            rating: rating,
            commentURI: commentURI,
            createdAt: block.timestamp
        });

        _reviews[reviewId] = newReview;
        _userReviews[reviewee].push(reviewId);
        _jobReviews[jobId][msg.sender] = reviewId;

        // Update rating stats
        RatingStats storage stats = _userRatings[reviewee];
        stats.totalReviews++;
        stats.totalRating += rating;

        emit ReviewSubmitted(reviewId, jobId, msg.sender, reviewee, rating, commentURI);
    }

    // ============ View Functions ============

    /// @inheritdoc IReviewRegistry
    function getReview(uint256 reviewId) external view returns (Review memory) {
        return _reviews[reviewId];
    }

    /// @inheritdoc IReviewRegistry
    function getUserReviews(address user) external view returns (Review[] memory) {
        uint256[] storage ids = _userReviews[user];
        Review[] memory result = new Review[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _reviews[ids[i]];
        }

        return result;
    }

    /// @inheritdoc IReviewRegistry
    function getAverageRating(address user) external view returns (uint256) {
        RatingStats storage stats = _userRatings[user];
        if (stats.totalReviews == 0) return 0;

        // Return average * 100 (e.g., 450 = 4.5 stars)
        return (stats.totalRating * 100) / stats.totalReviews;
    }

    /// @inheritdoc IReviewRegistry
    function hasReviewed(uint256 jobId, address reviewer) external view returns (bool) {
        return _jobReviews[jobId][reviewer] != 0;
    }

    /// @notice Get rating stats for a user
    /// @param user The user address
    /// @return RatingStats struct
    function getRatingStats(address user) external view returns (RatingStats memory) {
        return _userRatings[user];
    }

    /// @notice Get next review ID
    /// @return Next review ID
    function nextReviewId() external view returns (uint256) {
        return _nextReviewId;
    }

    /// @notice Get review ID for a specific job and reviewer
    /// @param jobId The job ID
    /// @param reviewer The reviewer address
    /// @return Review ID (0 if not reviewed)
    function getJobReviewId(uint256 jobId, address reviewer) external view returns (uint256) {
        return _jobReviews[jobId][reviewer];
    }
}
