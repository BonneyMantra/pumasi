import { BigInt } from "@graphprotocol/graph-ts"
import {
  MilestoneCreated,
  MilestoneStarted,
  MilestoneDelivered,
  MilestoneApproved,
  MilestoneDisputed
} from "../../generated/MilestoneManager/MilestoneManager"
import { Milestone, Job } from "../../generated/schema"

export function handleMilestoneCreated(event: MilestoneCreated): void {
  let milestoneId = event.params.milestoneId.toString()
  let jobId = event.params.jobId.toString()

  let job = Job.load(jobId)
  if (job == null) return

  let milestone = new Milestone(milestoneId)
  milestone.job = job.id
  milestone.index = event.params.milestoneId.toI32()
  milestone.amount = event.params.amount
  milestone.deadline = event.params.deadline
  milestone.metadataURI = event.params.metadataURI
  milestone.status = "Pending"
  milestone.save()
}

export function handleMilestoneStarted(event: MilestoneStarted): void {
  let milestoneId = event.params.milestoneId.toString()

  let milestone = Milestone.load(milestoneId)
  if (milestone == null) return

  milestone.status = "InProgress"
  milestone.save()
}

export function handleMilestoneDelivered(event: MilestoneDelivered): void {
  let milestoneId = event.params.milestoneId.toString()

  let milestone = Milestone.load(milestoneId)
  if (milestone == null) return

  milestone.status = "Delivered"
  milestone.save()
}

export function handleMilestoneApproved(event: MilestoneApproved): void {
  let milestoneId = event.params.milestoneId.toString()

  let milestone = Milestone.load(milestoneId)
  if (milestone == null) return

  milestone.status = "Approved"
  milestone.save()
}

export function handleMilestoneDisputed(event: MilestoneDisputed): void {
  let milestoneId = event.params.milestoneId.toString()

  let milestone = Milestone.load(milestoneId)
  if (milestone == null) return

  milestone.status = "Disputed"
  milestone.save()
}
