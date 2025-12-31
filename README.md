# Pumasi (품앗이)

**Decentralized Freelance Marketplace on VeryChain**

> 수수료 3%, 정산 100% 보장 — 3% fee, 100% payment guaranteed

Pumasi is an escrow-powered decentralized freelance marketplace that eliminates the trust gap in the gig economy through smart contract escrow, KYC accountability, reputation integration, and decentralized arbitration.

## The Problem

The traditional gig economy suffers from critical trust issues:

| Problem | Traditional Platforms | Pumasi Solution |
|---------|----------------------|-----------------|
| **Payment Default** | Freelancer works, doesn't get paid | Smart contract escrow locks funds until delivery |
| **Quality Issues** | Client pays upfront, receives poor work | Escrow releases only on client approval |
| **High Fees** | 20-30% platform fees | Only 3% platform fee |
| **No Accountability** | Anonymous profiles enable scams | VeryChat KYC verification for all users |
| **Dispute Hell** | Centralized, opaque resolution | Staked arbitrators vote on evidence |

## Features

### Core Functionality
- **Escrow Payments** — Funds locked in smart contract until work approved
- **Milestone Support** — Break large projects into phases with separate payments
- **3% Platform Fee** — Competitive pricing vs 20%+ on traditional platforms
- **Job Categories** — Translation, design, writing, development, tutoring, delivery, and more

### Trust & Reputation
- **Shinroe Integration** — Display credit scores for trust signals
- **VeryChat KYC** — Verified identities prevent anonymous scams
- **Review System** — 5-star ratings linked to completed jobs only
- **Profile Registry** — On-chain profile metadata via IPFS

### Dispute Resolution
- **Arbitration DAO** — Staked arbitrators vote on disputes
- **Evidence Submission** — Both parties submit proof via IPFS
- **3-Way Decisions** — Full refund, full payment, or split
- **Fair Incentives** — Arbitrators earn 5% of disputed amount

### Automation
- **Timeout Protection** — 30 days for open jobs, 7 days for delivery approval
- **Auto-Rejection** — Accepting one application auto-rejects others
- **Fee Transparency** — Display net amounts after fee deduction

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Jobs   │ │ Profile │ │  Apply  │ │ Dispute │ │Arbitrate│   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼──────────┼──────────┼──────────┼─────────────┘
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TheGraph Subgraph                           │
│         Indexes: Jobs, Applications, Reviews, Disputes           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VeryChain (Chain ID: 74)                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ JobEscrow  │ │Application │ │ Milestone  │ │ Arbitration  │  │
│  │            │ │  Registry  │ │  Manager   │ │     DAO      │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘  │
│  ┌────────────┐ ┌────────────┐                                   │
│  │  Review    │ │  Profile   │                                   │
│  │  Registry  │ │  Registry  │                                   │
│  └────────────┘ └────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | VeryChain (EVM-compatible, Chain ID: 74) |
| **Smart Contracts** | Solidity 0.8.26 + Foundry |
| **Frontend** | Next.js 14 + TypeScript + Tailwind CSS |
| **UI Components** | shadcn/ui |
| **Authentication** | WEPIN Wallet |
| **Identity** | VeryChat (KYC) |
| **Reputation** | Shinroe Scores |
| **Indexing** | TheGraph (self-hosted) |
| **Storage** | IPFS (metadata, proposals, evidence) |
| **i18n** | English / Korean |

## Smart Contracts

### Core Contracts

| Contract | Purpose |
|----------|---------|
| **JobEscrow** | Creates jobs, manages escrow, handles payments |
| **ApplicationRegistry** | Manages freelancer applications |
| **MilestoneManager** | Multi-phase payment tracking |
| **ArbitrationDAO** | Staked dispute resolution |
| **ReviewRegistry** | On-chain reviews linked to jobs |
| **ProfileRegistry** | IPFS-based profile metadata |

### Contract Parameters

```solidity
// JobEscrow
MIN_BUDGET = 0.0001 VERY
PLATFORM_FEE = 3% (300 basis points)
DELIVERY_TIMEOUT = 7 days
OPEN_JOB_TIMEOUT = 30 days

// ArbitrationDAO
MIN_STAKE = 1 VERY
EVIDENCE_PERIOD = 24 hours
VOTING_PERIOD = 48 hours
MIN_VOTES_REQUIRED = 3
ARBITRATOR_FEE = 5%
```

## Project Structure

```
pumasi/
├── contracts/                 # Foundry smart contracts
│   ├── src/
│   │   ├── JobEscrow.sol
│   │   ├── ApplicationRegistry.sol
│   │   ├── MilestoneManager.sol
│   │   ├── ArbitrationDAO.sol
│   │   ├── ReviewRegistry.sol
│   │   ├── ProfileRegistry.sol
│   │   └── interfaces/
│   ├── script/
│   │   └── DeployPumasi.s.sol
│   └── test/
│
├── subgraph/                  # TheGraph indexing
│   ├── schema.graphql
│   ├── subgraph.yaml
│   ├── src/mappings/
│   └── abis/
│
└── frontend/                  # Next.js application
    ├── app/                   # Routes
    │   ├── jobs/             # Job board & details
    │   ├── applications/     # User applications
    │   ├── profile/          # User profiles
    │   ├── arbitration/      # Arbitrator hub
    │   └── disputes/         # Dispute management
    ├── components/           # React components
    ├── lib/
    │   ├── web3/            # WEPIN integration
    │   ├── graphql/         # Subgraph queries
    │   ├── hooks/           # Custom React hooks
    │   └── i18n/            # Translations
    └── public/
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Foundry (for contracts)
- Graph CLI (for subgraph)

### Environment Variables

Create `.env.local` in the frontend directory:

```env
# WEPIN Authentication
NEXT_PUBLIC_WEPIN_APP_ID=your_wepin_app_id
NEXT_PUBLIC_WEPIN_APP_KEY=your_wepin_app_key

# Chain Configuration
NEXT_PUBLIC_APP_MODE=mainnet
NEXT_PUBLIC_DEFAULT_CHAIN=verychain

# Subgraph
NEXT_PUBLIC_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/pumasi

# IPFS
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs
```

### Installation

```bash
# Clone the repository
git clone https://github.com/CipherBonney/pumasi.git
cd pumasi

# Install frontend dependencies
cd frontend
pnpm install

# Install contract dependencies
cd ../contracts
forge install

# Install subgraph dependencies
cd ../subgraph
pnpm install
```

### Development

**Frontend:**
```bash
cd frontend
pnpm dev
```

**Contracts:**
```bash
cd contracts

# Build
forge build

# Test
forge test

# Deploy to VeryChain
forge script script/DeployPumasi.s.sol --rpc-url https://rpc.verylabs.io --broadcast
```

**Subgraph:**
```bash
cd subgraph

# Generate types
pnpm codegen

# Build
pnpm build

# Deploy to local graph-node
graph create --node http://localhost:8020/ pumasi
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 pumasi
```

## Job Lifecycle

```
1. Client creates job (deposits funds to escrow)
   ↓
2. Freelancers browse and submit applications
   ↓
3. Client accepts one freelancer (others auto-rejected)
   ↓
4. Freelancer submits deliverable
   ↓
5a. Client approves → Funds released (97% to freelancer)
5b. Client requests revision → Back to in-progress
5c. Either party disputes → Arbitration begins
   ↓
6. Both parties leave reviews
```

## Dispute Resolution Flow

```
1. Party raises dispute
   ↓
2. Evidence submission period (24 hours)
   - Both parties submit evidence via IPFS
   ↓
3. Voting period (48 hours)
   - Minimum 3 arbitrator votes required
   - Options: FullToClient / FullToFreelancer / Split
   ↓
4. Majority decision executed
   - Funds distributed accordingly
   - Arbitrators earn 5% of disputed amount
```

## Deployed Contracts (VeryChain Mainnet)

| Contract | Address |
|----------|---------|
| JobEscrow | `0x4aafcb744e5a9923640838c4788455b2cc1ebd48` |
| ApplicationRegistry | `0x625ab5ca543cde5dea9f9f53137162b30ce39af5` |
| MilestoneManager | `0xb7f3d139128d54e6f994bcf0de88d5da8d1c71d2` |

## Links

- **Live Demo:** https://pumasi-very-app.vercel.app/
- **VeryChain Explorer:** https://scan.verychain.io

## Job Categories

- `translation` — Document & content translation
- `design` — Graphic design, UI/UX
- `writing` — Content writing, copywriting
- `development` — Software development
- `tutoring` — Online tutoring & lessons
- `data_entry` — Data entry & processing
- `delivery` — Local delivery services
- `misc` — Other services

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**품앗이 (Pumasi)** — The traditional Korean concept of mutual labor exchange, reimagined for the blockchain era. Work together, trust each other, prosper together.
