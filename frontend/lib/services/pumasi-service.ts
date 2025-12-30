// Pumasi Subgraph Service
import { getSubgraphEndpoint } from '@/constants/subgraphs'
import { VERYCHAIN_CHAIN_ID } from '@/constants/chains/verychain'
import {
  JOBS_QUERY,
  OPEN_JOBS_QUERY,
  JOB_BY_ID_QUERY,
  JOBS_BY_CLIENT_QUERY,
  JOBS_BY_FREELANCER_QUERY,
  USER_BY_ADDRESS_QUERY,
  USER_PROFILE_QUERY,
  APPLICATIONS_BY_JOB_QUERY,
  APPLICATIONS_BY_FREELANCER_QUERY,
  MILESTONES_BY_JOB_QUERY,
  REVIEWS_BY_REVIEWEE_QUERY,
  DISPUTE_BY_JOB_QUERY,
  ARBITRATORS_QUERY,
  type JobResult,
  type UserResult,
  type ApplicationResult,
  type MilestoneResult,
  type ReviewResult,
  type DisputeResult,
} from '@/lib/graphql/queries/pumasi-queries'

// VeryChain Mainnet (Chain ID: 74)

class PumasiService {
  private endpoint: string

  constructor() {
    this.endpoint = getSubgraphEndpoint(VERYCHAIN_CHAIN_ID, 'pumasi')
  }

  private async query<T>(gqlQuery: string, variables?: Record<string, unknown>): Promise<T | null> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: gqlQuery, variables }),
      })

      if (!response.ok) return null

      const { data, errors } = await response.json()
      if (errors?.length) {
        console.error('GraphQL errors:', errors)
        return null
      }
      return data as T
    } catch (error) {
      console.error('Subgraph query error:', error)
      return null
    }
  }

  // ============ Job Methods ============

  async getOpenJobs(first = 20, skip = 0): Promise<JobResult[]> {
    const data = await this.query<{ jobs: JobResult[] }>(OPEN_JOBS_QUERY, { first, skip })
    return data?.jobs ?? []
  }

  async getJobs(first = 20, skip = 0, status?: string): Promise<JobResult[]> {
    const data = await this.query<{ jobs: JobResult[] }>(JOBS_QUERY, { first, skip, status })
    return data?.jobs ?? []
  }

  async getJobById(id: string): Promise<JobResult | null> {
    const data = await this.query<{ job: JobResult | null }>(JOB_BY_ID_QUERY, { id })
    return data?.job ?? null
  }

  async getJobsByClient(client: string, first = 20, skip = 0): Promise<JobResult[]> {
    const data = await this.query<{ jobs: JobResult[] }>(JOBS_BY_CLIENT_QUERY, {
      client: client.toLowerCase(),
      first,
      skip,
    })
    return data?.jobs ?? []
  }

  async getJobsByFreelancer(freelancer: string, first = 20, skip = 0): Promise<JobResult[]> {
    const data = await this.query<{ jobs: JobResult[] }>(JOBS_BY_FREELANCER_QUERY, {
      freelancer: freelancer.toLowerCase(),
      first,
      skip,
    })
    return data?.jobs ?? []
  }

  // ============ User Methods ============

  async getUser(address: string): Promise<UserResult | null> {
    const data = await this.query<{ user: UserResult | null }>(USER_BY_ADDRESS_QUERY, {
      id: address.toLowerCase(),
    })
    return data?.user ?? null
  }

  async getUserProfile(
    address: string,
    jobsFirst = 10,
    reviewsFirst = 10
  ): Promise<UserResult | null> {
    const data = await this.query<{ user: UserResult | null }>(USER_PROFILE_QUERY, {
      id: address.toLowerCase(),
      jobsFirst,
      reviewsFirst,
    })
    return data?.user ?? null
  }

  // ============ Application Methods ============

  async getApplicationsByJob(jobId: string, first = 50, skip = 0): Promise<ApplicationResult[]> {
    const data = await this.query<{ applications: ApplicationResult[] }>(APPLICATIONS_BY_JOB_QUERY, {
      jobId,
      first,
      skip,
    })
    return data?.applications ?? []
  }

  async getApplicationsByFreelancer(
    freelancer: string,
    first = 20,
    skip = 0
  ): Promise<ApplicationResult[]> {
    const data = await this.query<{ applications: ApplicationResult[] }>(
      APPLICATIONS_BY_FREELANCER_QUERY,
      {
        freelancer: freelancer.toLowerCase(),
        first,
        skip,
      }
    )
    return data?.applications ?? []
  }

  // ============ Milestone Methods ============

  async getMilestonesByJob(jobId: string): Promise<MilestoneResult[]> {
    const data = await this.query<{ milestones: MilestoneResult[] }>(MILESTONES_BY_JOB_QUERY, {
      jobId,
    })
    return data?.milestones ?? []
  }

  // ============ Review Methods ============

  async getReviewsByReviewee(reviewee: string, first = 20, skip = 0): Promise<ReviewResult[]> {
    const data = await this.query<{ reviews: ReviewResult[] }>(REVIEWS_BY_REVIEWEE_QUERY, {
      reviewee: reviewee.toLowerCase(),
      first,
      skip,
    })
    return data?.reviews ?? []
  }

  // ============ Dispute Methods ============

  async getDisputeByJob(jobId: string): Promise<DisputeResult | null> {
    const data = await this.query<{ dispute: DisputeResult | null }>(DISPUTE_BY_JOB_QUERY, {
      jobId,
    })
    return data?.dispute ?? null
  }

  // ============ Arbitrator Methods ============

  async getArbitrators(first = 50, skip = 0): Promise<UserResult[]> {
    const data = await this.query<{ users: UserResult[] }>(ARBITRATORS_QUERY, { first, skip })
    return data?.users ?? []
  }
}

export const pumasiService = new PumasiService()
