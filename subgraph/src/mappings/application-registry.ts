import { BigInt } from "@graphprotocol/graph-ts"
import {
  ApplicationSubmitted,
  ApplicationAccepted,
  ApplicationRejected
} from "../../generated/ApplicationRegistry/ApplicationRegistry"
import { Application, Job } from "../../generated/schema"
import { getOrCreateUser } from "./helpers"

export function handleApplicationSubmitted(event: ApplicationSubmitted): void {
  let jobId = event.params.jobId.toString()
  let freelancerAddress = event.params.freelancer.toHexString()
  let applicationId = event.params.applicationId.toString()

  let application = new Application(applicationId)

  let job = Job.load(jobId)
  if (job == null) return

  let freelancer = getOrCreateUser(freelancerAddress)
  freelancer.save()

  application.job = job.id
  application.freelancer = freelancer.id
  application.proposalURI = event.params.proposalURI
  application.status = "Pending"
  application.createdAt = event.params.timestamp
  application.save()
}

export function handleApplicationAccepted(event: ApplicationAccepted): void {
  let applicationId = event.params.applicationId.toString()

  let application = Application.load(applicationId)
  if (application == null) return

  application.status = "Accepted"
  application.save()
}

export function handleApplicationRejected(event: ApplicationRejected): void {
  let applicationId = event.params.applicationId.toString()

  let application = Application.load(applicationId)
  if (application == null) return

  application.status = "Rejected"
  application.save()
}
