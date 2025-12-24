# Pumasi Contract Deployment Guide

## Overview

This guide covers the complete deployment workflow for Pumasi contracts on **VeryChain mainnet**:
1. **Simulation** - Test on local Anvil
2. **Deployment** - Deploy to VeryChain mainnet
3. **Seeding** - Populate with initial data

## Prerequisites

```bash
# Install dependencies
forge install

# Set up .env with your private key
echo "PRIVATE_KEY=your_private_key_here" > .env
echo "VERYCHAIN_RPC_URL=https://rpc.verychain.io" >> .env
```

## 1. Simulation (Local Testing)

### Run Integration Tests

```bash
# Test deployment + seeding workflow
forge test --match-contract DeployAndSeedTest -vvv

# Test all contracts
forge test
```

### Manual Anvil Simulation

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy
forge script script/DeployPumasi.s.sol:DeployPumasi \
  --rpc-url http://localhost:8545 \
  --broadcast

# Terminal 2: Seed (using deployed addresses)
forge script script/SeedPumasi.s.sol:SeedPumasi \
  --sig "run(address,address,address,address)" \
  <JobFactory> <ApplicationRegistry> <ReviewRegistry> <ProfileRegistry> \
  --rpc-url http://localhost:8545 \
  --broadcast
```

## 2. Deploy to VeryChain Mainnet

```bash
# Ensure PRIVATE_KEY is set in .env
source .env

# Deploy all contracts
forge script script/DeployPumasi.s.sol:DeployPumasi \
  --rpc-url verychain \
  --broadcast
```

## 3. Seeding Data (Optional)

### Seed with Contract Addresses

```bash
# Set contract addresses after deployment
export JOB_FACTORY=0x...
export APPLICATION_REGISTRY=0x...
export REVIEW_REGISTRY=0x...
export PROFILE_REGISTRY=0x...

forge script script/SeedPumasi.s.sol:SeedPumasi \
  --sig "runFromEnv()" \
  --rpc-url verychain \
  --broadcast
```

### Seeded Data Summary

| Entity | Count | Details |
|--------|-------|---------|
| Profiles | 5 | Alice (Admin), Bob (Client), Carol (Freelancer), Dave (Freelancer), Eve (Client) |
| Jobs | 4 | Open (2), InProgress (1), Completed (1) |
| Applications | 5 | Various states |
| Reviews | 2 | Carol: 5 stars, Eve: 4 stars |

## Contract Deployment Order

Contracts must be deployed in this order due to dependencies:

```
1. ProfileRegistry      (independent)
2. JobFactory          (treasury address)
   ├── 3. ApplicationRegistry (JobFactory)
   ├── 4. MilestoneManager    (JobFactory + treasury)
   ├── 5. ReviewRegistry      (JobFactory)
   └── 6. ArbitrationDAO      (JobFactory + treasury)
```

## Post-Deployment Checklist

After deployment, sync addresses to frontend and subgraph:

- [ ] Update `frontend/lib/config/contracts.ts`
- [ ] Update `subgraph/networks.json`
- [ ] Copy ABIs to `subgraph/abis/`
- [ ] Deploy subgraph to local graph-node

## Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| VeryChain Mainnet | 74 | https://rpc.verychain.io |
| Local (Anvil) | 31337 | http://localhost:8545 |

## Test Accounts (Anvil Only)

| Account | Role | Address |
|---------|------|---------|
| Alice | Admin/Treasury | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 |
| Bob | Client | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 |
| Carol | Freelancer | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC |
| Dave | Freelancer | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 |
| Eve | Client | 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 |

## Troubleshooting

### Missing PRIVATE_KEY

```bash
# Create .env file
echo "PRIVATE_KEY=your_private_key_without_0x" > .env
```

### Insufficient Gas

Ensure your deployer wallet has enough VERY tokens for gas fees.
