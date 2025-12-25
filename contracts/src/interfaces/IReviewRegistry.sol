// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IReviewRegistry
/// @notice Interface for the Pumasi Review Registry contract
/// @dev Manages reviews between clients and freelancers after job completion
interface IReviewRegistry {
    // ============ Structs ============

    /// @notice Represents a review
    struct Review {
        uint256 reviewId;
        uint256 jobId;
        address reviewer;
        address reviewee;
        uint8 rating;          // 1-5 stars
        string commentURI;     // IPFS hash
        uint256 createdAt;
    }

    /// @notice Aggregated rating stats for a user
    struct RatingStats {
        uint256 totalReviews;
        uint256 totalRating;   // Sum of all ratings
    }

    // ============ Events ============

    /// @notice Emitted when a review is submitted
    event ReviewSubmitted(
        uint256 indexed reviewId,
        uint256 indexed jobId,
        address indexed reviewer,
        address reviewee,
        uint8 rating,
        string commentURI
    );

    // ============ Errors ============

    /// @notice Thrown when job is not completed
    error JobNotCompleted();

    /// @notice Thrown when reviewer is not part of job
    error NotJobParticipant();

    /// @notice Thrown when review already submitted
    error AlreadyReviewed();

    /// @notice Thrown when invalid rating (not 1-5)
    error InvalidRating();

    /// @notice Thrown when reviewing self
    error CannotReviewSelf();

    // ============ Functions ============

    /// @notice Submit a review for a completed job
    /// @param jobId The completed job ID
    /// @param rating Rating 1-5
    /// @param commentURI IPFS URI with review text
    /// @return reviewId The created review ID
    function submitReview(
        uint256 jobId,
        uint8 rating,
        string calldata commentURI
    ) external returns (uint256 reviewId);

    /// @notice Get a review by ID
    /// @param reviewId The review ID
    /// @return Review struct
    function getReview(uint256 reviewId) external view returns (Review memory);

    /// @notice Get all reviews for a user
    /// @param user The user address
    /// @return Array of reviews
    function getUserReviews(address user) external view returns (Review[] memory);

    /// @notice Get average rating for a user
    /// @param user The user address
    /// @return Average rating * 100 (e.g., 450 = 4.5 stars)
    function getAverageRating(address user) external view returns (uint256);

    /// @notice Check if a user has reviewed a job
    /// @param jobId The job ID
    /// @param reviewer The reviewer address
    /// @return True if reviewed
    function hasReviewed(uint256 jobId, address reviewer) external view returns (bool);
}
