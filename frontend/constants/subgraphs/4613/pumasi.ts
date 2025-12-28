import type { SubgraphConfig } from '../index'

// Build endpoint from NEXT_PUBLIC_INDEXER_URL
function getPumasiEndpoint(): string {
  const baseUrl = process.env.NEXT_PUBLIC_INDEXER_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_INDEXER_URL is required');
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}/subgraphs/name/pumasi`;
}

export const pumasiSubgraph: SubgraphConfig = {
  name: 'pumasi',
  description: 'Pumasi Freelance Marketplace on VeryChain Mainnet',
  thegraph: {
    endpoint: getPumasiEndpoint(),
  },
  goldsky: {
    endpoint: '',
    versionEndpoint: '',
  },
  activeProvider: 'thegraph',
  contracts: [
    {
      name: 'JobFactory',
      address: '0x4aafcb744e5a9923640838c4788455b2cc1ebd48',
      chainId: 4613,
      chainName: 'VeryChain',
      explorerUrl: 'https://www.veryscan.io/address/0x4aafcb744e5a9923640838c4788455b2cc1ebd48',
      startBlock: 4151694,
    },
    {
      name: 'ApplicationRegistry',
      address: '0x625ab5ca543cde5dea9f9f53137162b30ce39af5',
      chainId: 4613,
      chainName: 'VeryChain',
      explorerUrl: 'https://www.veryscan.io/address/0x625ab5ca543cde5dea9f9f53137162b30ce39af5',
      startBlock: 4151694,
    },
    {
      name: 'MilestoneManager',
      address: '0xb7f3d139128d54e6f994bcf0de88d5da8d1c71d2',
      chainId: 4613,
      chainName: 'VeryChain',
      explorerUrl: 'https://www.veryscan.io/address/0xb7f3d139128d54e6f994bcf0de88d5da8d1c71d2',
      startBlock: 4151694,
    },
    {
      name: 'ReviewRegistry',
      address: '0x2927b1f7c76aa9302621fc3dee30b024ab11d677',
      chainId: 4613,
      chainName: 'VeryChain',
      explorerUrl: 'https://www.veryscan.io/address/0x2927b1f7c76aa9302621fc3dee30b024ab11d677',
      startBlock: 4151694,
    },
    {
      name: 'ArbitrationDAO',
      address: '0xa846e4d57cdb3077ed67e5d792949f7a6ef2a75d',
      chainId: 4613,
      chainName: 'VeryChain',
      explorerUrl: 'https://www.veryscan.io/address/0xa846e4d57cdb3077ed67e5d792949f7a6ef2a75d',
      startBlock: 4151694,
    },
    {
      name: 'ProfileRegistry',
      address: '0x0c3ff18373d7683b34df2ef956f0e2205d232cc2',
      chainId: 4613,
      chainName: 'VeryChain',
      explorerUrl: 'https://www.veryscan.io/address/0x0c3ff18373d7683b34df2ef956f0e2205d232cc2',
      startBlock: 4151694,
    },
  ],
  schemaContent: `
type Job @entity {
  id: ID!
  client: User!
  freelancer: User
  budget: BigInt!
  deadline: BigInt!
  status: JobStatus!
  metadataURI: String!
  createdAt: BigInt!
  completedAt: BigInt
  applications: [Application!]! @derivedFrom(field: "job")
  milestones: [Milestone!]! @derivedFrom(field: "job")
  reviews: [Review!]! @derivedFrom(field: "job")
  dispute: Dispute @derivedFrom(field: "job")
}

type User @entity {
  id: ID!
  jobsAsClient: [Job!]! @derivedFrom(field: "client")
  jobsAsFreelancer: [Job!]! @derivedFrom(field: "freelancer")
  applications: [Application!]! @derivedFrom(field: "freelancer")
  reviewsGiven: [Review!]! @derivedFrom(field: "reviewer")
  reviewsReceived: [Review!]! @derivedFrom(field: "reviewee")
  averageRating: BigDecimal
  totalJobsCompleted: Int!
  totalEarnings: BigInt!
  isArbitrator: Boolean!
  arbitratorStake: BigInt
}

type Application @entity {
  id: ID!
  job: Job!
  freelancer: User!
  status: ApplicationStatus!
  proposalURI: String!
  createdAt: BigInt!
}

type Milestone @entity {
  id: ID!
  job: Job!
  index: Int!
  amount: BigInt!
  deadline: BigInt!
  status: MilestoneStatus!
  metadataURI: String!
}

type Review @entity {
  id: ID!
  job: Job!
  reviewer: User!
  reviewee: User!
  rating: Int!
  commentURI: String!
  createdAt: BigInt!
}

type Dispute @entity {
  id: ID!
  job: Job!
  status: DisputeStatus!
  clientEvidenceURI: String
  freelancerEvidenceURI: String
  votes: [Vote!]! @derivedFrom(field: "dispute")
  resolvedAt: BigInt
  resolution: VoteDecision
}

type Vote @entity {
  id: ID!
  dispute: Dispute!
  arbitrator: User!
  decision: VoteDecision!
  rationaleURI: String!
}

enum JobStatus { Open InProgress Delivered Completed Disputed Cancelled }
enum ApplicationStatus { Pending Accepted Rejected }
enum MilestoneStatus { Pending InProgress Delivered Approved Disputed }
enum DisputeStatus { EvidencePhase VotingPhase Resolved }
enum VoteDecision { FullToClient FullToFreelancer Split }
`,
}
