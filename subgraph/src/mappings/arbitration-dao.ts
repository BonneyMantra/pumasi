import { BigInt } from "@graphprotocol/graph-ts"
import {
  ArbitratorRegistered,
  ArbitratorWithdrawn,
  DisputeRaised,
  EvidenceSubmitted,
  VoteCast,
  DisputeResolved
} from "../../generated/ArbitrationDAO/ArbitrationDAO"
import { Dispute, Vote, Job, User } from "../../generated/schema"
import { getOrCreateUser } from "./helpers"

export function handleArbitratorRegistered(event: ArbitratorRegistered): void {
  let arbitrator = getOrCreateUser(event.params.arbitrator.toHexString())
  arbitrator.isArbitrator = true
  arbitrator.arbitratorStake = event.params.stakeAmount
  arbitrator.save()
}

export function handleArbitratorUnregistered(event: ArbitratorWithdrawn): void {
  let arbitrator = User.load(event.params.arbitrator.toHexString())
  if (arbitrator == null) return

  arbitrator.isArbitrator = false
  arbitrator.arbitratorStake = null
  arbitrator.save()
}

export function handleDisputeRaised(event: DisputeRaised): void {
  let disputeId = event.params.disputeId.toString()
  let jobId = event.params.jobId.toString()

  let job = Job.load(jobId)
  if (job == null) return

  let dispute = new Dispute(disputeId)
  dispute.job = job.id
  dispute.status = "EvidencePhase"
  dispute.save()
}

export function handleEvidenceSubmitted(event: EvidenceSubmitted): void {
  let disputeId = event.params.disputeId.toString()
  let submitter = event.params.submitter.toHexString()

  let dispute = Dispute.load(disputeId)
  if (dispute == null) return

  let job = Job.load(dispute.job)
  if (job == null) return

  // Determine if submitter is client or freelancer
  if (job.client == submitter) {
    dispute.clientEvidenceURI = event.params.evidenceURI
  } else if (job.freelancer == submitter) {
    dispute.freelancerEvidenceURI = event.params.evidenceURI
  }
  dispute.save()
}

export function handleVoteCast(event: VoteCast): void {
  let disputeId = event.params.disputeId.toString()
  let arbitratorAddress = event.params.arbitrator.toHexString()
  let voteId = disputeId + "-" + arbitratorAddress

  let dispute = Dispute.load(disputeId)
  if (dispute == null) return

  // Move dispute to voting phase if not already
  if (dispute.status == "EvidencePhase") {
    dispute.status = "VotingPhase"
    dispute.save()
  }

  let arbitrator = getOrCreateUser(arbitratorAddress)
  arbitrator.save()

  let vote = new Vote(voteId)
  vote.dispute = dispute.id
  vote.arbitrator = arbitrator.id

  // Map decision enum
  let decision = event.params.decision
  if (decision == 0) {
    vote.decision = "FullToClient"
  } else if (decision == 1) {
    vote.decision = "FullToFreelancer"
  } else {
    vote.decision = "Split"
  }

  vote.rationaleURI = ""
  vote.save()
}

export function handleDisputeResolved(event: DisputeResolved): void {
  let disputeId = event.params.disputeId.toString()

  let dispute = Dispute.load(disputeId)
  if (dispute == null) return

  dispute.status = "Resolved"
  dispute.resolvedAt = event.block.timestamp

  // Map resolution enum
  let resolution = event.params.decision
  if (resolution == 0) {
    dispute.resolution = "FullToClient"
  } else if (resolution == 1) {
    dispute.resolution = "FullToFreelancer"
  } else {
    dispute.resolution = "Split"
  }

  dispute.save()
}
