#!/usr/bin/env node
/**
 * VERY Token Cost Estimation for Pumasi Deployment + Seeding
 */

// VeryChain gas price (from RPC): ~500 Gwei
const GAS_PRICE_GWEI = 500;
const GWEI_TO_ETHER = 1e-9;

// Contract deployment gas estimates (from contract sizes + deployment overhead)
const DEPLOYMENT_GAS = {
  ProfileRegistry: 350_000,      // Small contract
  JobFactory: 1_200_000,         // Large, complex
  ApplicationRegistry: 650_000,  // Medium
  MilestoneManager: 950_000,     // Medium-large
  ReviewRegistry: 550_000,       // Medium
  ArbitrationDAO: 1_050_000,     // Large
};

// Seeding operations gas estimates
const SEEDING_GAS = {
  // Profile operations (5 profiles)
  setProfile: 80_000,  // Storage write + event

  // Job creation (4 jobs with ETH value)
  createJob: 150_000,  // Complex storage + ETH transfer

  // Applications (5 applications)
  submitApplication: 100_000,
  acceptApplication: 60_000,

  // Job assignment (2 assignments)
  assignFreelancer: 70_000,

  // Deliverables (1 submission + 1 approval)
  submitDeliverable: 80_000,
  approveDelivery: 120_000,  // Includes ETH transfer

  // Reviews (2 reviews)
  submitReview: 90_000,
};

// Calculate totals
function calculateDeploymentCost() {
  let totalGas = 0;
  console.log("\n📦 CONTRACT DEPLOYMENT");
  console.log("=".repeat(50));

  for (const [contract, gas] of Object.entries(DEPLOYMENT_GAS)) {
    const cost = gas * GAS_PRICE_GWEI * GWEI_TO_ETHER;
    console.log(`  ${contract.padEnd(25)} ${gas.toLocaleString().padStart(12)} gas  ${cost.toFixed(4)} VERY`);
    totalGas += gas;
  }

  const totalCost = totalGas * GAS_PRICE_GWEI * GWEI_TO_ETHER;
  console.log("-".repeat(50));
  console.log(`  TOTAL DEPLOYMENT:        ${totalGas.toLocaleString().padStart(12)} gas  ${totalCost.toFixed(4)} VERY`);

  return { gas: totalGas, cost: totalCost };
}

function calculateSeedingCost() {
  const operations = [
    { name: "Create 5 profiles", op: "setProfile", count: 5 },
    { name: "Create 4 jobs", op: "createJob", count: 4 },
    { name: "Submit 5 applications", op: "submitApplication", count: 5 },
    { name: "Accept 2 applications", op: "acceptApplication", count: 2 },
    { name: "Assign 2 freelancers", op: "assignFreelancer", count: 2 },
    { name: "Submit 1 deliverable", op: "submitDeliverable", count: 1 },
    { name: "Approve 1 delivery", op: "approveDelivery", count: 1 },
    { name: "Submit 2 reviews", op: "submitReview", count: 2 },
  ];

  let totalGas = 0;
  console.log("\n🌱 SEEDING OPERATIONS");
  console.log("=".repeat(50));

  for (const { name, op, count } of operations) {
    const gas = SEEDING_GAS[op] * count;
    const cost = gas * GAS_PRICE_GWEI * GWEI_TO_ETHER;
    console.log(`  ${name.padEnd(25)} ${gas.toLocaleString().padStart(12)} gas  ${cost.toFixed(4)} VERY`);
    totalGas += gas;
  }

  const totalCost = totalGas * GAS_PRICE_GWEI * GWEI_TO_ETHER;
  console.log("-".repeat(50));
  console.log(`  TOTAL SEEDING:           ${totalGas.toLocaleString().padStart(12)} gas  ${totalCost.toFixed(4)} VERY`);

  return { gas: totalGas, cost: totalCost };
}

function calculateJobBudgets() {
  // From SeedPumasi.s.sol
  const budgets = {
    "Job 0 (WebDev)": 0.5,
    "Job 1 (Smart Contract)": 1.0,
    "Job 2 (UI Design)": 0.25,
    "Job 3 (Logo - completed)": 0.5,
  };

  let total = 0;
  console.log("\n💰 JOB ESCROW BUDGETS");
  console.log("=".repeat(50));

  for (const [job, budget] of Object.entries(budgets)) {
    console.log(`  ${job.padEnd(30)} ${budget.toFixed(2)} VERY`);
    total += budget;
  }

  console.log("-".repeat(50));
  console.log(`  TOTAL ESCROW:              ${total.toFixed(2)} VERY`);
  console.log(`  (Returned on completion or cancellation)`);

  return total;
}

// Main
console.log("╔══════════════════════════════════════════════════╗");
console.log("║     PUMASI DEPLOYMENT COST ESTIMATION            ║");
console.log("║     VeryChain (Chain ID: 74)                     ║");
console.log("╚══════════════════════════════════════════════════╝");
console.log(`\n⛽ Gas Price: ${GAS_PRICE_GWEI} Gwei`);

const deployment = calculateDeploymentCost();
const seeding = calculateSeedingCost();
const escrow = calculateJobBudgets();

const totalGas = deployment.gas + seeding.gas;
const totalGasCost = deployment.cost + seeding.cost;
const buffer = totalGasCost * 0.2; // 20% buffer for gas fluctuations

console.log("\n" + "═".repeat(50));
console.log("📊 SUMMARY");
console.log("═".repeat(50));
console.log(`  Gas for deployment:    ${deployment.cost.toFixed(4)} VERY`);
console.log(`  Gas for seeding:       ${seeding.cost.toFixed(4)} VERY`);
console.log(`  Escrow deposits:       ${escrow.toFixed(4)} VERY`);
console.log("-".repeat(50));
console.log(`  Subtotal:              ${(totalGasCost + escrow).toFixed(4)} VERY`);
console.log(`  + 20% Buffer:          ${buffer.toFixed(4)} VERY`);
console.log("═".repeat(50));
console.log(`  RECOMMENDED FUNDING:   ${(totalGasCost + escrow + buffer).toFixed(2)} VERY`);
console.log("═".repeat(50));

console.log("\n📝 NOTES:");
console.log("  • Escrow funds (2.25 VERY) are held in contracts, not consumed");
console.log("  • Job 3 escrow (0.5 VERY) is released to freelancer on completion");
console.log("  • Actual gas may vary ±20% based on network conditions");
console.log("  • Treasury receives 3% platform fee from completed jobs");
