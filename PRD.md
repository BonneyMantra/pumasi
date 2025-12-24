# Pumasi (품앗이) — Product Requirements Document

## Escrow-Based Micro-Freelance Platform

---

## 1. Executive Summary

**Product Name:** Pumasi (품앗이)
**Tagline:** "안전한 거래, 확실한 정산" (Safe Deals, Guaranteed Payment)
**Category:** Gig Economy / Marketplace

Pumasi is a freelance and task marketplace where payments are protected by smart contract escrow. KYC-verified identities ensure accountability for both service providers and clients.

---

## 2. Problem Statement

### The Gig Economy Trust Gap

Freelance platforms charge 20%+ fees. Direct deals risk non-payment or non-delivery.

**Current Pain Points:**

| Problem | Impact |
|---------|--------|
| **Payment Default** | Freelancers complete work, clients don't pay |
| **Quality Issues** | Clients pay upfront, receive poor work |
| **High Platform Fees** | 20-30% taken by intermediaries |
| **Dispute Hell** | No fair resolution mechanism |
| **Anonymous Scams** | Fake profiles on both sides |

### Market Context

- Korean gig economy: ₩20T+ annually
- 배달 (delivery), 번역 (translation), 디자인 (design) are huge
- Existing platforms (숨고, 크몽) have trust issues
- Crypto enables instant, global, low-fee payments

---

## 3. Solution Overview

Pumasi creates a trustless marketplace where:

1. **Escrow Payments** — Client's payment locked until delivery confirmed
2. **KYC Accountability** — Real identities, real consequences
3. **Reputation Integration** — Shinroe scores for trust signals
4. **Milestone-Based Work** — Large projects split into deliverables
5. **Decentralized Arbitration** — Disputes resolved by staked arbitrators

---

## 4. Target Users

### Clients (Job Posters)

**Primary: Small Business Owners**
- Need translation, design, data entry
- Don't want to commit to full-time hire
- Value payment protection

**Secondary: Individuals**
- Personal tasks (moving help, tutoring)
- One-time needs

### Freelancers (Service Providers)

**Primary: Part-Time Freelancers**
- Side income alongside main job
- Translation, design, writing, tutoring
- Want guaranteed payment

**Secondary: Full-Time Freelancers**
- Professional service providers
- Building client base
- Seeking lower fees than platforms

---

## 5. User Flows

### Flow 1: Posting a Job

```
1. Client opens Pumasi
2. Logs in with VeryChat
3. Clicks "일감 올리기" (Post Job)
4. Fills details:
   - Title ("영문 번역 필요")
   - Category (Translation)
   - Description
   - Budget (500 VERY)
   - Deadline
   - Requirements
5. Chooses payment structure:
   - Milestone-based
   - Full on completion
6. Deposits payment to escrow
7. Job goes live
```

### Flow 2: Applying for a Job

```
1. Freelancer browses jobs
2. Filters by category, budget, skills
3. Opens interesting job
4. Views client profile:
   - Shinroe score
   - Past jobs posted
   - Review history
5. Submits application:
   - Cover letter
   - Proposed timeline
   - Portfolio links
6. Waits for client response
```

### Flow 3: Hiring and Starting Work

```
1. Client reviews applications
2. Views freelancer profiles:
   - Shinroe score
   - Completed jobs
   - Reviews
3. Selects freelancer
4. Confirms hire
5. Both parties see:
   - Job details
   - Milestones
   - Deadline
   - Escrow status (funds locked)
6. Chat channel opens
7. Work begins
```

### Flow 4: Delivering and Payment

```
1. Freelancer completes work
2. Submits deliverable:
   - Files
   - Description
   - Request for approval
3. Client reviews:
   - Approve → Payment released
   - Request revision → Back to freelancer
   - Dispute → Arbitration triggered
4. On approval:
   - Escrow releases to freelancer
   - Both leave reviews
   - Shinroe scores updated
```

### Flow 5: Dispute Resolution

```
1. Client or freelancer raises dispute
2. Both submit evidence:
   - Chat logs
   - Deliverables
   - Original requirements
3. Arbitration pool notified
4. 3-5 staked arbitrators review
5. Each votes:
   - Full to client
   - Full to freelancer
   - Partial split
6. Majority wins
7. Funds distributed accordingly
8. Arbitrators earn fee
```

---

## 6. Feature Breakdown

### Core Features (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Job Posting** | Create and publish jobs | P0 |
| **Job Discovery** | Search and filter jobs | P0 |
| **Application System** | Apply to jobs with proposal | P0 |
| **Escrow Payment** | Smart contract holds funds | P0 |
| **Delivery & Approval** | Submit work, confirm completion | P0 |
| **In-Job Chat** | Communication channel | P0 |
| **Review System** | Rate completed jobs | P0 |
| **Profile Pages** | Freelancer/client profiles | P0 |

### Payment Structures

| Type | Use Case | Implementation |
|------|----------|----------------|
| **Full Escrow** | Simple tasks | All funds locked, released on completion |
| **Milestone** | Large projects | Funds released per milestone |
| **Hourly** | Ongoing work | Weekly escrow + time tracking |

### Secondary Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Milestone System** | Break large jobs into phases | P1 |
| **Arbitration** | Dispute resolution | P1 |
| **Shinroe Integration** | Trust scores on profiles | P1 |
| **Portfolio** | Freelancer work showcase | P1 |
| **Saved Searches** | Job alerts | P2 |
| **Repeat Hire** | Quick re-hire past freelancers | P2 |

### Categories

| Category | Examples |
|----------|----------|
| **Translation** | Korean↔English, documents, subtitles |
| **Design** | Logo, UI/UX, illustrations |
| **Writing** | Blog posts, copywriting, editing |
| **Development** | Web, mobile, smart contracts |
| **Tutoring** | Language, academics, skills |
| **Data Entry** | Spreadsheets, transcription |
| **Delivery** | Local pickup/dropoff |
| **Misc** | Research, virtual assistance |

---

## 7. Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  - Job Board                                                │
│  - Profile Pages                                            │
│  - Chat Interface                                           │
│  - Delivery System                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                       │
│  - Job Management                                           │
│  - Application Processing                                   │
│  - File Storage                                             │
│  - Notification System                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────┬─────────────────┬───────────────────────┐
│   VeryChat Auth   │   Wepin Wallet  │   VeryChain (EVM)     │
│   - Login         │   - Pay to escrow│  - JobEscrow         │
│   - KYC           │   - Receive pay │  - ArbitrationDAO     │
│   - Chat          │                 │  - ReputationHook     │
└───────────────────┴─────────────────┴───────────────────────┘
```

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| **JobFactory** | Create job contracts |
| **JobEscrow** | Hold funds, release logic |
| **MilestoneManager** | Multi-phase payments |
| **ArbitrationDAO** | Dispute voting, stake management |

### Data Model

**Job:**
- jobId
- title
- description
- category
- budget
- deadline
- clientId
- status (open/in_progress/completed/disputed)
- paymentType (full/milestone)
- milestones[]
- escrowAddress

**Application:**
- applicationId
- jobId
- freelancerId
- coverLetter
- proposedTimeline
- status (pending/accepted/rejected)

**Milestone:**
- milestoneId
- jobId
- description
- amount
- deadline
- status (pending/delivered/approved/disputed)

**Review:**
- reviewId
- jobId
- reviewerId
- revieweeId
- rating (1-5)
- comment
- createdAt

---

## 8. Arbitration System

### Becoming an Arbitrator

1. Minimum Shinroe score: 700+
2. Stake requirement: 1000+ VERY
3. Pass arbitration guidelines quiz
4. Start with low-value disputes

### Arbitration Process

| Step | Action |
|------|--------|
| 1 | Dispute raised by either party |
| 2 | Both parties submit evidence (24h) |
| 3 | Random selection of 3 arbitrators |
| 4 | Arbitrators review (48h) |
| 5 | Each casts vote with rationale |
| 6 | Majority decision executed |
| 7 | Arbitrators earn fee (5% of dispute amount) |

### Arbitrator Incentives

| Behavior | Consequence |
|----------|-------------|
| Vote with majority | Earn full fee |
| Vote against majority | No fee |
| Fail to vote in time | Stake slashed, removed |
| Pattern of bad decisions | Stake slashed, banned |

---

## 9. Fee Structure

| Fee | Amount | Purpose |
|-----|--------|---------|
| **Platform Fee** | 3% | Protocol treasury |
| **Arbitration Fee** | 5% (if disputed) | Paid to arbitrators |
| **No other fees** | — | No listing, no application fees |

Comparison to competitors:
- 크몽 (Kmong): 20%
- 숨고 (Soomgo): 10-15%
- Fiverr: 20%
- Pumasi: 3%

---

## 10. Success Metrics

### Primary KPIs

| Metric | Target (3 months) |
|--------|-------------------|
| Jobs posted | 1,000+ |
| Jobs completed | 500+ |
| Freelancers registered | 2,000+ |
| Total value escrowed | 1M+ VERY |
| Dispute rate | <5% |

### Secondary KPIs

| Metric | Target |
|--------|--------|
| Avg job value | 200+ VERY |
| Completion rate | >80% |
| Repeat hire rate | 30% |
| Avg review score | 4.2+ |

---

## 11. Korean Market Positioning

### Messaging

**Primary:** "수수료 3%, 정산 100% 보장"  
(3% fee, 100% payment guaranteed)

**Secondary:** "먹튀 없는 프리랜서 마켓"  
(No-scam freelance market)

### Cultural Alignment

| Korean Norm | Pumasi Feature |
|-------------|-----------------|
| 정산 문화 | Escrow guarantees |
| 후기 중시 | Prominent reviews |
| 가성비 | Low 3% fee |
| 신뢰 | KYC + Shinroe |

### Competitive Differentiation

| Competitor | Pumasi Advantage |
|------------|-------------------|
| 크몽 | 3% vs 20% fee |
| 숨고 | Guaranteed payment |
| 직거래 | No scam risk |
| Global platforms | Korean UX, local currency |

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low liquidity (VERY) | Medium | High | Show fiat equivalents |
| Quality disputes | High | Medium | Clear guidelines, arbitration |
| Arbitrator collusion | Low | High | Random selection, stake requirements |
| Off-platform deals | Medium | Medium | Benefits for staying (escrow, reputation) |
| Category saturation | Medium | Low | Expand categories gradually |

---

## 13. Demo Script (For Hackathon)

### Scene 1: The Problem (20 sec)
- Show 20% platform fee
- "Or pay directly and risk non-payment"

### Scene 2: Post a Job (40 sec)
- Client posts translation job
- Deposits to escrow
- Show funds locked in contract

### Scene 3: Freelancer Applies (30 sec)
- Browse jobs
- See client's Shinroe score
- Submit application

### Scene 4: Complete and Pay (40 sec)
- Freelancer delivers
- Client approves
- Instant payment release
- Reviews exchanged

### Scene 5: Dispute (20 sec)
- Show dispute flow briefly
- Arbitrators vote
- Fair resolution

### Closing (10 sec)
- "수수료 3%, 정산 100% 보장. Pumasi"

---

## 14. Timeline Estimate

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Design | 2 days | UI/UX, contract design |
| Smart Contracts | 4 days | Escrow, arbitration |
| Backend | 4 days | Jobs, applications, chat |
| Frontend | 5 days | All screens |
| Arbitration | 2 days | Voting system |
| Integration | 2 days | VeryChat, Wepin, Shinroe |
| Testing | 2 days | E2E testing |
| Demo Prep | 1 day | Recording |
| **Total** | **~3 weeks** | |

---

## 15. Open Questions

1. Minimum job value to prevent spam?
2. How long can funds stay in escrow before timeout?
3. Should arbitrators be anonymous to parties?
4. Physical tasks (delivery, cleaning) — how to verify completion?
5. Refund policy for cancelled jobs?
