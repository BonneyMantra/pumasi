import { BigInt } from "@graphprotocol/graph-ts"
import { ProfileCreated, ProfileUpdated } from "../../generated/ProfileRegistry/ProfileRegistry"
import { User } from "../../generated/schema"
import { getOrCreateUser } from "./helpers"

export function handleProfileCreated(event: ProfileCreated): void {
  let userAddress = event.params.user.toHexString()
  let user = getOrCreateUser(userAddress)

  user.profileURI = event.params.profileURI
  user.profileCreatedAt = event.params.timestamp
  user.profileUpdatedAt = event.params.timestamp
  user.save()
}

export function handleProfileUpdated(event: ProfileUpdated): void {
  let userAddress = event.params.user.toHexString()
  let user = getOrCreateUser(userAddress)

  user.profileURI = event.params.profileURI
  user.profileUpdatedAt = event.params.timestamp
  user.save()
}
