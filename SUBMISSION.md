# Pumasi (품앗이) - Hackathon Submission

## 1. One-Liner Vision

**Escrow-powered micro-freelance marketplace with 3% fees, KYC accountability, and decentralized arbitration — eliminating the trust gap in gig economy.**

---

## 2. GitHub URL

**https://github.com/CipherBonney/pumasi**

---

## 2a. Live Demo

**https://pumasi-very-app.vercel.app/**

---

## 2b. Demo Video

**https://www.canva.com/design/DAG9FeOX2XI/ylGWnBhlQqAxTVGW1CjZcQ/watch**

---

## 2c. DoraHacks BUIDL

**https://dorahacks.io/buidl/38089**

---

## 3. Key Innovation Domains

1. **DeFi / Escrow Payments**
2. **Decentralized Identity (DID) / Reputation**
3. **DAO Governance / Arbitration**

---

## 4. Detailed Description

### Problem

The gig economy suffers from a fundamental trust gap:
- **Freelancers** complete work but don't get paid
- **Clients** pay upfront but receive poor quality
- **Platforms** charge 20-30% fees (크몽, Fiverr, etc.)
- **Direct deals** are risky — no accountability, no recourse

### Solution: Pumasi

Pumasi (품앗이 — Korean for "mutual labor exchange") is a trustless freelance marketplace built on VeryChain that solves these problems:

#### Core Features

| Feature | How It Works |
|---------|--------------|
| **Smart Contract Escrow** | Client deposits payment into escrow when posting a job. Funds are locked until freelancer delivers and client approves. No party can "run away" with the money. |
| **KYC Accountability** | All users are VeryChat-verified with real identities. Scammers can be held accountable. |
| **Shinroe Reputation Integration** | Trust scores from Shinroe (credit scoring dApp) are displayed on profiles, helping users assess counterparty risk. |
| **Milestone-Based Payments** | Large projects can be split into milestones, with partial releases as work progresses. |
| **Decentralized Arbitration** | Disputes are resolved by staked arbitrators (Shinroe score 700+, 1000+ VERY staked) who vote on evidence. Majority decision is executed automatically. |

#### Fee Structure

| Platform | Fee |
|----------|-----|
| 크몽 (Kmong) | 20% |
| Fiverr | 20% |
| 숨고 (Soomgo) | 10-15% |
| **Pumasi** | **3%** |

#### Job Categories

- Translation (Korean↔English, documents, subtitles)
- Design (Logo, UI/UX, illustrations)
- Writing (Blog posts, copywriting, editing)
- Development (Web, mobile, smart contracts)
- Tutoring (Language, academics, skills)
- Data Entry (Spreadsheets, transcription)
- Delivery (Local pickup/dropoff)

#### User Flow

```
1. Client posts job + deposits payment to escrow
2. Freelancers browse and apply (see client's Shinroe score)
3. Client selects freelancer (see freelancer's reputation)
4. Freelancer completes work and submits deliverable
5. Client approves → Escrow releases payment instantly
   OR Client disputes → Arbitration process begins
6. Both parties leave reviews → Shinroe scores updated
```

### Technical Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | VeryChain (EVM-compatible) |
| **Auth** | WEPIN Wallet + VeryChat |
| **Indexing** | TheGraph (self-hosted) |
| **Contracts** | Foundry (Solidity) |
| **Frontend** | Next.js + shadcn/ui |

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| **JobFactory** | Creates job contracts |
| **JobEscrow** | Holds funds, handles release logic |
| **MilestoneManager** | Multi-phase payment tracking |
| **ArbitrationDAO** | Dispute resolution with staked voting |

### Why VeryChain?

- Native integration with VeryChat (KYC + messaging)
- Low transaction fees for micro-transactions
- Wepin wallet for seamless UX
- Ecosystem synergy with Shinroe (reputation scores)

### Market Opportunity

- Korean gig economy: ₩20T+ annually
- High demand for 배달 (delivery), 번역 (translation), 디자인 (design)
- Existing platforms (숨고, 크몽) have trust and fee issues
- Crypto enables instant, global, low-fee payments

### Tagline

**"수수료 3%, 정산 100% 보장"**
*(3% fee, 100% payment guaranteed)*

---

## Team

Built as part of the VeryChain dApp ecosystem, integrating with:
- **Shinroe** (신뢰) — Reputation/Credit Scoring
- **VeryChat** — Identity & Messaging
- **WEPIN** — Wallet Infrastructure
