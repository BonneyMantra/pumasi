import { BigInt } from "@graphprotocol/graph-ts"
import {
  JobCreated,
  FreelancerAssigned,
  DeliverableSubmitted,
  JobApproved,
  JobCancelled,
  JobDisputed,
  FundsReleased
} from "../../generated/JobEscrow/JobEscrow"
import { Job, User } from "../../generated/schema"
import { getOrCreateUser } from "./helpers"

export function handleJobCreated(event: JobCreated): void {
  let jobId = event.params.jobId.toString()
  let job = new Job(jobId)

  let client = getOrCreateUser(event.params.client.toHexString())
  client.save()

  job.client = client.id
  job.budget = event.params.budget
  job.deadline = event.params.deadline
  job.metadataURI = event.params.metadataURI
  job.status = "Open"
  job.createdAt = event.block.timestamp
  job.save()
}

export function handleFreelancerAssigned(event: FreelancerAssigned): void {
  let jobId = event.params.jobId.toString()
  let job = Job.load(jobId)
  if (job == null) return

  let freelancer = getOrCreateUser(event.params.freelancer.toHexString())
  freelancer.save()

  job.freelancer = freelancer.id
  job.status = "InProgress"
  job.save()
}

export function handleDeliverableSubmitted(event: DeliverableSubmitted): void {
  let jobId = event.params.jobId.toString()
  let job = Job.load(jobId)
  if (job == null) return

  job.status = "Delivered"
  job.save()
}

export function handleJobApproved(event: JobApproved): void {
  let jobId = event.params.jobId.toString()
  let job = Job.load(jobId)
  if (job == null) return

  job.status = "Completed"
  job.completedAt = event.block.timestamp
  job.save()

  let freelancerId = event.params.freelancer.toHexString()
  let freelancer = User.load(freelancerId)
  if (freelancer != null) {
    freelancer.totalJobsCompleted = freelancer.totalJobsCompleted + 1
    freelancer.save()
  }
}

export function handleJobCancelled(event: JobCancelled): void {
  let jobId = event.params.jobId.toString()
  let job = Job.load(jobId)
  if (job == null) return

  job.status = "Cancelled"
  job.save()
}

export function handleJobDisputed(event: JobDisputed): void {
  let jobId = event.params.jobId.toString()
  let job = Job.load(jobId)
  if (job == null) return

  job.status = "Disputed"
  job.save()
}

export function handleFundsReleased(event: FundsReleased): void {
  let jobId = event.params.jobId.toString()
  let job = Job.load(jobId)
  if (job == null) return

  let freelancerId = event.params.recipient.toHexString()
  let freelancer = User.load(freelancerId)
  if (freelancer != null) {
    freelancer.totalEarnings = freelancer.totalEarnings.plus(event.params.amount)
    freelancer.save()
  }
}
