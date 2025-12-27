import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { User } from "../../generated/schema"

export function getOrCreateUser(address: string): User {
  let user = User.load(address)
  if (user == null) {
    user = new User(address)
    user.totalJobsCompleted = 0
    user.totalEarnings = BigInt.fromI32(0)
    user.isArbitrator = false
  }
  return user
}

export function calculateAverageRating(
  currentAverage: BigDecimal | null,
  totalReviews: i32,
  newRating: i32
): BigDecimal {
  let current = currentAverage
    ? currentAverage as BigDecimal
    : BigDecimal.fromString("0")
  let total = BigInt.fromI32(totalReviews)
  let rating = BigDecimal.fromString(newRating.toString())

  if (totalReviews == 0) {
    return rating
  }

  let sum = current.times(BigDecimal.fromString(total.toString()))
  let newSum = sum.plus(rating)
  let newTotal = BigDecimal.fromString((totalReviews + 1).toString())

  return newSum.div(newTotal)
}
