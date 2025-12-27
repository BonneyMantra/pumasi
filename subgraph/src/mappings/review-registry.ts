import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { ReviewSubmitted } from "../../generated/ReviewRegistry/ReviewRegistry"
import { Review, Job, User } from "../../generated/schema"
import { getOrCreateUser, calculateAverageRating } from "./helpers"

export function handleReviewSubmitted(event: ReviewSubmitted): void {
  let reviewId = event.params.reviewId.toString()
  let jobId = event.params.jobId.toString()
  let reviewerAddress = event.params.reviewer.toHexString()
  let revieweeAddress = event.params.reviewee.toHexString()

  let job = Job.load(jobId)
  if (job == null) return

  let reviewer = getOrCreateUser(reviewerAddress)
  reviewer.save()

  let reviewee = getOrCreateUser(revieweeAddress)

  let review = new Review(reviewId)
  review.job = job.id
  review.reviewer = reviewer.id
  review.reviewee = reviewee.id
  review.rating = event.params.rating
  review.commentURI = event.params.commentURI
  review.createdAt = event.block.timestamp
  review.save()

  // Update reviewee average rating
  let reviewCount = 0
  reviewee.averageRating = calculateAverageRating(
    reviewee.averageRating,
    reviewCount,
    event.params.rating
  )
  reviewee.save()
}
