export const JobFactoryABI = [
  {
    type: 'constructor',
    inputs: [{ name: 'treasuryAddr', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  // View functions
  {
    type: 'function',
    name: 'minBudget',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'platformFeeBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalJobs',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getJob',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'jobId', type: 'uint256' },
          { name: 'client', type: 'address' },
          { name: 'freelancer', type: 'address' },
          { name: 'budget', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'metadataURI', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'deliveredAt', type: 'uint256' },
          { name: 'deliverableURI', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getClientJobs',
    inputs: [{ name: 'client', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getFreelancerJobs',
    inputs: [{ name: 'freelancer', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserStats',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'jobsPosted', type: 'uint256' },
          { name: 'jobsCompleted', type: 'uint256' },
          { name: 'jobsCancelled', type: 'uint256' },
          { name: 'totalEarned', type: 'uint256' },
          { name: 'totalSpent', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  // Write functions
  {
    type: 'function',
    name: 'createJob',
    inputs: [
      { name: 'deadline', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
    outputs: [{ name: 'jobId', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'assignFreelancer',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'freelancer', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'submitDeliverable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'deliverableURI', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approveDelivery',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'requestRevision',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'raiseDispute',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelJob',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Events
  {
    type: 'event',
    name: 'JobCreated',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true },
      { name: 'client', type: 'address', indexed: true },
      { name: 'budget', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
      { name: 'metadataURI', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FreelancerAssigned',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true },
      { name: 'freelancer', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DeliverableSubmitted',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true },
      { name: 'freelancer', type: 'address', indexed: true },
      { name: 'deliverableURI', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'JobApproved',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true },
      { name: 'client', type: 'address', indexed: true },
      { name: 'freelancer', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'JobDisputed',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true },
      { name: 'disputedBy', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'JobCancelled',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true },
      { name: 'cancelledBy', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FundsReleased',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'platformFee', type: 'uint256', indexed: false },
    ],
  },
] as const;
