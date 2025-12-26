// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseTest} from "../utils/BaseTest.sol";
import {ReviewRegistry} from "../../src/ReviewRegistry.sol";
import {IReviewRegistry} from "../../src/interfaces/IReviewRegistry.sol";
import {JobEscrow} from "../../src/JobEscrow.sol";
import {IJobEscrow} from "../../src/interfaces/IJobEscrow.sol";

/// @title ReviewRegistryTest
/// @notice Unit tests for the ReviewRegistry contract
contract ReviewRegistryTest is BaseTest {
    ReviewRegistry public registry;
    JobEscrow public escrow;

    uint256 public constant JOB_BUDGET = 1 ether;
    uint256 public constant JOB_DEADLINE = 7 days;
    string public constant METADATA_URI = "ipfs://QmJobMetadata";
    string public constant DELIVERABLE_URI = "ipfs://QmDeliverable";
    string public constant COMMENT_URI = "ipfs://QmReviewComment";

    function setUp() public override {
        super.setUp();
        vm.startPrank(DEPLOYER);
        escrow = new JobEscrow(TREASURY);
        registry = new ReviewRegistry(address(escrow));
        vm.stopPrank();
    }

    // ============ Submit Review Tests ============

    function test_SubmitReview_ClientReviewsFreelancer() public {
        uint256 jobId = _createCompletedJob();

        vm.prank(ALICE);
        uint256 reviewId = registry.submitReview(jobId, 5, COMMENT_URI);

        IReviewRegistry.Review memory review = registry.getReview(reviewId);
        assertEq(review.reviewId, 1);
        assertEq(review.jobId, jobId);
        assertEq(review.reviewer, ALICE);
        assertEq(review.reviewee, BOB);
        assertEq(review.rating, 5);
        assertEq(review.commentURI, COMMENT_URI);
    }

    function test_SubmitReview_FreelancerReviewsClient() public {
        uint256 jobId = _createCompletedJob();

        vm.prank(BOB);
        uint256 reviewId = registry.submitReview(jobId, 4, COMMENT_URI);

        IReviewRegistry.Review memory review = registry.getReview(reviewId);
        assertEq(review.reviewer, BOB);
        assertEq(review.reviewee, ALICE);
        assertEq(review.rating, 4);
    }

    function test_SubmitReview_BothPartiesReview() public {
        uint256 jobId = _createCompletedJob();

        vm.prank(ALICE);
        registry.submitReview(jobId, 5, COMMENT_URI);

        vm.prank(BOB);
        registry.submitReview(jobId, 4, COMMENT_URI);

        // Verify both reviews exist
        IReviewRegistry.Review[] memory aliceReviews = registry.getUserReviews(ALICE);
        IReviewRegistry.Review[] memory bobReviews = registry.getUserReviews(BOB);

        assertEq(aliceReviews.length, 1);
        assertEq(bobReviews.length, 1);
        assertEq(aliceReviews[0].rating, 4); // Bob reviewed Alice
        assertEq(bobReviews[0].rating, 5);   // Alice reviewed Bob
    }

    function test_SubmitReview_RevertsJobNotCompleted() public {
        // Create job but don't complete it
        uint256 deadline = block.timestamp + JOB_DEADLINE;
        vm.prank(ALICE);
        uint256 jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(ALICE);
        escrow.assignFreelancer(jobId, BOB);

        vm.prank(ALICE);
        vm.expectRevert(IReviewRegistry.JobNotCompleted.selector);
        registry.submitReview(jobId, 5, COMMENT_URI);
    }

    function test_SubmitReview_RevertsNotJobParticipant() public {
        uint256 jobId = _createCompletedJob();

        vm.prank(CHARLIE);
        vm.expectRevert(IReviewRegistry.NotJobParticipant.selector);
        registry.submitReview(jobId, 5, COMMENT_URI);
    }

    function test_SubmitReview_RevertsAlreadyReviewed() public {
        uint256 jobId = _createCompletedJob();

        vm.prank(ALICE);
        registry.submitReview(jobId, 5, COMMENT_URI);

        vm.prank(ALICE);
        vm.expectRevert(IReviewRegistry.AlreadyReviewed.selector);
        registry.submitReview(jobId, 4, COMMENT_URI);
    }

    function test_SubmitReview_RevertsInvalidRating_TooLow() public {
        uint256 jobId = _createCompletedJob();

        vm.prank(ALICE);
        vm.expectRevert(IReviewRegistry.InvalidRating.selector);
        registry.submitReview(jobId, 0, COMMENT_URI);
    }

    function test_SubmitReview_RevertsInvalidRating_TooHigh() public {
        uint256 jobId = _createCompletedJob();

        vm.prank(ALICE);
        vm.expectRevert(IReviewRegistry.InvalidRating.selector);
        registry.submitReview(jobId, 6, COMMENT_URI);
    }

    // ============ Get User Reviews Tests ============

    function test_GetUserReviews_MultipleReviews() public {
        // Create 3 completed jobs
        uint256 job1 = _createCompletedJob();
        uint256 job2 = _createCompletedJobWithParties(CHARLIE, BOB);
        uint256 job3 = _createCompletedJobWithParties(DEPLOYER, BOB);

        // Submit reviews for Bob
        vm.prank(ALICE);
        registry.submitReview(job1, 5, COMMENT_URI);

        vm.prank(CHARLIE);
        registry.submitReview(job2, 4, COMMENT_URI);

        vm.prank(DEPLOYER);
        registry.submitReview(job3, 3, COMMENT_URI);

        IReviewRegistry.Review[] memory bobReviews = registry.getUserReviews(BOB);
        assertEq(bobReviews.length, 3);
    }

    // ============ Average Rating Tests ============

    function test_GetAverageRating_SingleReview() public {
        uint256 jobId = _createCompletedJob();

        vm.prank(ALICE);
        registry.submitReview(jobId, 4, COMMENT_URI);

        uint256 avgRating = registry.getAverageRating(BOB);
        assertEq(avgRating, 400); // 4.0 stars * 100
    }

    function test_GetAverageRating_MultipleReviews() public {
        uint256 job1 = _createCompletedJob();
        uint256 job2 = _createCompletedJobWithParties(CHARLIE, BOB);

        vm.prank(ALICE);
        registry.submitReview(job1, 5, COMMENT_URI);

        vm.prank(CHARLIE);
        registry.submitReview(job2, 3, COMMENT_URI);

        uint256 avgRating = registry.getAverageRating(BOB);
        assertEq(avgRating, 400); // (5 + 3) / 2 = 4.0 * 100 = 400
    }

    function test_GetAverageRating_NoReviews() public {
        uint256 avgRating = registry.getAverageRating(BOB);
        assertEq(avgRating, 0);
    }

    // ============ Has Reviewed Tests ============

    function test_HasReviewed_True() public {
        uint256 jobId = _createCompletedJob();

        vm.prank(ALICE);
        registry.submitReview(jobId, 5, COMMENT_URI);

        assertTrue(registry.hasReviewed(jobId, ALICE));
    }

    function test_HasReviewed_False() public {
        uint256 jobId = _createCompletedJob();

        assertFalse(registry.hasReviewed(jobId, ALICE));
    }

    // ============ Helpers ============

    function _createCompletedJob() internal returns (uint256 jobId) {
        return _createCompletedJobWithParties(ALICE, BOB);
    }

    function _createCompletedJobWithParties(
        address client,
        address freelancer
    ) internal returns (uint256 jobId) {
        uint256 deadline = block.timestamp + JOB_DEADLINE;

        vm.prank(client);
        jobId = escrow.createJob{value: JOB_BUDGET}(deadline, METADATA_URI);

        vm.prank(client);
        escrow.assignFreelancer(jobId, freelancer);

        vm.prank(freelancer);
        escrow.submitDeliverable(jobId, DELIVERABLE_URI);

        vm.prank(client);
        escrow.approveDelivery(jobId);
    }
}
