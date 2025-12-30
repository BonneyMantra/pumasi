// Pumasi GraphQL Queries

// ============ Response Types ============

export interface JobResult {
  id: string
  client: { id: string }
  freelancer: { id: string } | null
  budget: string
  deadline: string
  status: string
  metadataURI: string
  createdAt: string
  completedAt: string | null
  applications?: { id: string; status?: string }[]
}

export interface UserResult {
  id: string
  profileURI: string | null
  profileCreatedAt: string | null
  profileUpdatedAt: string | null
  averageRating: string | null
  totalJobsCompleted: number
  totalEarnings: string
  isArbitrator: boolean
  arbitratorStake: string | null
}

export interface ApplicationResult {
  id: string
  job: { id: string }
  freelancer: { id: string }
  status: string
  proposalURI: string
  createdAt: string
}

export interface MilestoneResult {
  id: string
  job: { id: string }
  index: number
  amount: string
  deadline: string
  status: string
  metadataURI: string
}

export interface ReviewResult {
  id: string
  job: { id: string }
  reviewer: { id: string }
  reviewee: { id: string }
  rating: number
  commentURI: string
  createdAt: string
}

export interface DisputeResult {
  id: string
  job: { id: string }
  status: string
  clientEvidenceURI: string | null
  freelancerEvidenceURI: string | null
  resolvedAt: string | null
  resolution: string | null
}

// ============ Response Wrappers ============

export interface JobsResponse {
  jobs: JobResult[]
}

export interface JobResponse {
  job: JobResult | null
}

export interface UserResponse {
  user: UserResult | null
}

export interface ApplicationsResponse {
  applications: ApplicationResult[]
}

export interface MilestonesResponse {
  milestones: MilestoneResult[]
}

export interface ReviewsResponse {
  reviews: ReviewResult[]
}

export interface DisputeResponse {
  dispute: DisputeResult | null
}

// ============ Job Queries ============

export const JOBS_QUERY = `
  query GetJobs($first: Int!, $skip: Int!) {
    jobs(
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      client { id }
      freelancer { id }
      budget
      deadline
      status
      metadataURI
      createdAt
      completedAt
      applications { id status }
    }
  }
`

export const JOBS_BY_STATUS_QUERY = `
  query GetJobsByStatus($first: Int!, $skip: Int!, $status: String!) {
    jobs(
      first: $first
      skip: $skip
      where: { status: $status }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      client { id }
      freelancer { id }
      budget
      deadline
      status
      metadataURI
      createdAt
      completedAt
      applications { id status }
    }
  }
`

export const OPEN_JOBS_QUERY = `
  query GetOpenJobs($first: Int!, $skip: Int!) {
    jobs(
      first: $first
      skip: $skip
      where: { status: "Open" }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      client { id }
      freelancer { id }
      budget
      deadline
      status
      metadataURI
      createdAt
      applications { id status }
    }
  }
`

export const JOB_BY_ID_QUERY = `
  query GetJob($id: ID!) {
    job(id: $id) {
      id
      client { id }
      freelancer { id }
      budget
      deadline
      status
      metadataURI
      createdAt
      completedAt
      applications {
        id
        freelancer { id }
        status
        proposalURI
        createdAt
      }
      milestones {
        id
        index
        amount
        deadline
        status
        metadataURI
      }
      reviews {
        id
        reviewer { id }
        reviewee { id }
        rating
        commentURI
        createdAt
      }
    }
  }
`

export const JOBS_BY_CLIENT_QUERY = `
  query GetJobsByClient($client: String!, $first: Int!, $skip: Int!) {
    jobs(
      first: $first
      skip: $skip
      where: { client: $client }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      freelancer { id }
      budget
      deadline
      status
      metadataURI
      createdAt
      completedAt
    }
  }
`

export const JOBS_BY_FREELANCER_QUERY = `
  query GetJobsByFreelancer($freelancer: String!, $first: Int!, $skip: Int!) {
    jobs(
      first: $first
      skip: $skip
      where: { freelancer: $freelancer }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      client { id }
      budget
      deadline
      status
      metadataURI
      createdAt
      completedAt
    }
  }
`

// ============ User Queries ============

export const USER_BY_ADDRESS_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      averageRating
      totalJobsCompleted
      totalEarnings
      isArbitrator
      arbitratorStake
    }
  }
`

export const USER_PROFILE_QUERY = `
  query GetUserProfile($id: ID!, $jobsFirst: Int!, $reviewsFirst: Int!) {
    user(id: $id) {
      id
      profileURI
      profileCreatedAt
      profileUpdatedAt
      averageRating
      totalJobsCompleted
      totalEarnings
      isArbitrator
      arbitratorStake
      jobsAsClient(first: $jobsFirst, orderBy: createdAt, orderDirection: desc) {
        id
        status
        budget
        createdAt
      }
      jobsAsFreelancer(first: $jobsFirst, orderBy: createdAt, orderDirection: desc) {
        id
        status
        budget
        createdAt
      }
      reviewsReceived(first: $reviewsFirst, orderBy: createdAt, orderDirection: desc) {
        id
        rating
        commentURI
        reviewer { id }
        createdAt
      }
    }
  }
`

// ============ Application Queries ============

export const APPLICATIONS_BY_JOB_QUERY = `
  query GetApplicationsByJob($jobId: String!, $first: Int!, $skip: Int!) {
    applications(
      first: $first
      skip: $skip
      where: { job: $jobId }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      job { id }
      freelancer { id }
      status
      proposalURI
      createdAt
    }
  }
`

export const APPLICATIONS_BY_FREELANCER_QUERY = `
  query GetApplicationsByFreelancer($freelancer: String!, $first: Int!, $skip: Int!) {
    applications(
      first: $first
      skip: $skip
      where: { freelancer: $freelancer }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      job { id }
      status
      proposalURI
      createdAt
    }
  }
`

export const APPLICATION_BY_ID_QUERY = `
  query GetApplicationById($id: ID!) {
    application(id: $id) {
      id
      job {
        id
        client { id }
        freelancer { id }
        budget
        deadline
        status
        metadataURI
        createdAt
        applications { id status }
      }
      freelancer { id }
      status
      proposalURI
      createdAt
    }
  }
`

// ============ Milestone Queries ============

export const MILESTONES_BY_JOB_QUERY = `
  query GetMilestonesByJob($jobId: String!) {
    milestones(
      where: { job: $jobId }
      orderBy: index
      orderDirection: asc
    ) {
      id
      job { id }
      index
      amount
      deadline
      status
      metadataURI
    }
  }
`

// ============ Review Queries ============

export const REVIEWS_BY_REVIEWEE_QUERY = `
  query GetReviewsByReviewee($reviewee: String!, $first: Int!, $skip: Int!) {
    reviews(
      first: $first
      skip: $skip
      where: { reviewee: $reviewee }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      job { id }
      reviewer { id }
      rating
      commentURI
      createdAt
    }
  }
`

// ============ Dispute Queries ============

export const DISPUTE_BY_JOB_QUERY = `
  query GetDisputeByJob($jobId: ID!) {
    dispute(id: $jobId) {
      id
      job { id }
      status
      clientEvidenceURI
      freelancerEvidenceURI
      resolvedAt
      resolution
      votes {
        id
        arbitrator { id }
        decision
        rationaleURI
      }
    }
  }
`

export const ACTIVE_DISPUTES_QUERY = `
  query GetActiveDisputes($first: Int!, $skip: Int!) {
    disputes(
      first: $first
      skip: $skip
      where: { status_in: ["EvidencePhase", "VotingPhase"] }
      orderBy: id
      orderDirection: desc
    ) {
      id
      job { id }
      status
      clientEvidenceURI
      freelancerEvidenceURI
    }
  }
`

export const USER_DISPUTES_QUERY = `
  query GetUserDisputes($userAddress: String!, $first: Int!, $skip: Int!) {
    disputes(
      first: $first
      skip: $skip
      where: {
        or: [
          { job_: { client: $userAddress } }
          { job_: { freelancer: $userAddress } }
        ]
      }
      orderBy: id
      orderDirection: desc
    ) {
      id
      job {
        id
        client { id }
        freelancer { id }
        budget
        metadataURI
      }
      status
      clientEvidenceURI
      freelancerEvidenceURI
      resolvedAt
      resolution
    }
  }
`

// ============ Arbitrator Queries ============

export const ARBITRATORS_QUERY = `
  query GetArbitrators($first: Int!, $skip: Int!) {
    users(
      first: $first
      skip: $skip
      where: { isArbitrator: true }
      orderBy: arbitratorStake
      orderDirection: desc
    ) {
      id
      arbitratorStake
    }
  }
`
