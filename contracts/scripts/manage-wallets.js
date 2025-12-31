#!/usr/bin/env node
/**
 * Wallet Management for Pumasi Deployment
 * Generates, stores, and manages wallets for simulation and mainnet deployment
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const WALLETS_FILE = path.join(__dirname, "..", "wallets.json");
const ENV_FILE = path.join(__dirname, "..", ".env");

// Generate a random private key
function generatePrivateKey() {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

// Derive address from private key (simplified - for display only)
function deriveAddress(privateKey) {
  // Note: For actual address derivation, use ethers.js or similar
  // This is a placeholder that should be replaced with proper derivation
  const hash = crypto.createHash("sha256").update(privateKey).digest("hex");
  return "0x" + hash.substring(0, 40);
}

// Load existing wallets
function loadWallets() {
  if (fs.existsSync(WALLETS_FILE)) {
    return JSON.parse(fs.readFileSync(WALLETS_FILE, "utf-8"));
  }
  return {
    description: "Pumasi deployment wallets. KEEP SECURE - contains private keys!",
    createdAt: new Date().toISOString(),
    wallets: {},
  };
}

// Save wallets
function saveWallets(data) {
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(data, null, 2));
  console.log(`💾 Saved to: ${WALLETS_FILE}`);
}

// Generate deployment wallets
function generateDeploymentWallets() {
  const data = loadWallets();

  // Deployer wallet (for mainnet)
  if (!data.wallets.deployer) {
    const pk = generatePrivateKey();
    data.wallets.deployer = {
      privateKey: pk,
      address: deriveAddress(pk),
      purpose: "Main deployment wallet for VeryChain mainnet",
      network: "verychain",
      chainId: 74,
      createdAt: new Date().toISOString(),
      funded: false,
    };
    console.log("✓ Generated deployer wallet");
  }

  // Treasury wallet
  if (!data.wallets.treasury) {
    const pk = generatePrivateKey();
    data.wallets.treasury = {
      privateKey: pk,
      address: deriveAddress(pk),
      purpose: "Treasury wallet for platform fees",
      network: "verychain",
      chainId: 74,
      createdAt: new Date().toISOString(),
      funded: false,
    };
    console.log("✓ Generated treasury wallet");
  }

  saveWallets(data);
  return data;
}

// Generate test wallets (matches Anvil accounts for consistency)
function generateTestWallets() {
  const data = loadWallets();

  // Standard Anvil test accounts
  const anvilAccounts = [
    { name: "alice", pk: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", addr: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", purpose: "Admin/Treasury" },
    { name: "bob", pk: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", addr: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", purpose: "Client" },
    { name: "carol", pk: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", addr: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", purpose: "Freelancer" },
    { name: "dave", pk: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", addr: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", purpose: "Freelancer" },
    { name: "eve", pk: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", addr: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", purpose: "Client" },
  ];

  for (const account of anvilAccounts) {
    data.wallets[account.name] = {
      privateKey: account.pk,
      address: account.addr,
      purpose: `Test account - ${account.purpose}`,
      network: "localhost",
      chainId: 31337,
      isAnvilDefault: true,
    };
  }

  console.log("✓ Added Anvil test wallets (alice, bob, carol, dave, eve)");
  saveWallets(data);
  return data;
}

// Update .env with deployer private key
function updateEnvFile(wallets) {
  if (!wallets.wallets.deployer) {
    console.log("⚠️  No deployer wallet found. Generate first with: node manage-wallets.js generate");
    return;
  }

  let envContent = "";
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, "utf-8");
  }

  // Remove leading 0x for Foundry compatibility
  const pkWithout0x = wallets.wallets.deployer.privateKey.replace("0x", "");

  if (envContent.includes("PRIVATE_KEY=")) {
    envContent = envContent.replace(/PRIVATE_KEY=.*/, `PRIVATE_KEY=${pkWithout0x}`);
  } else {
    envContent += `\n# Deployer private key (auto-generated)\nPRIVATE_KEY=${pkWithout0x}\n`;
  }

  fs.writeFileSync(ENV_FILE, envContent);
  console.log(`✓ Updated .env with deployer private key`);
}

// Display wallets (hiding full private keys)
function displayWallets() {
  const data = loadWallets();

  console.log("\n📋 Pumasi Wallets\n");
  console.log("=".repeat(60));

  for (const [name, wallet] of Object.entries(data.wallets)) {
    console.log(`\n${name.toUpperCase()}`);
    console.log("-".repeat(40));
    console.log(`  Address:  ${wallet.address}`);
    console.log(`  Purpose:  ${wallet.purpose}`);
    console.log(`  Network:  ${wallet.network || "any"} (Chain ID: ${wallet.chainId || "any"})`);
    console.log(`  PK (last 8): ...${wallet.privateKey.slice(-8)}`);
    if (wallet.funded !== undefined) {
      console.log(`  Funded:   ${wallet.funded ? "✓ Yes" : "✗ No"}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n⚠️  Full private keys are in: ${WALLETS_FILE}`);
  console.log("   KEEP THIS FILE SECURE!\n");
}

// Export wallets for use in scripts
function exportForFoundry() {
  const data = loadWallets();

  console.log("\n# Add to .env for Foundry scripts:");
  console.log("# ================================");

  if (data.wallets.deployer) {
    console.log(`PRIVATE_KEY=${data.wallets.deployer.privateKey.replace("0x", "")}`);
    console.log(`DEPLOYER_ADDRESS=${data.wallets.deployer.address}`);
  }

  if (data.wallets.treasury) {
    console.log(`TREASURY_ADDRESS=${data.wallets.treasury.address}`);
  }
}

// Main CLI
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  console.log("🔐 Pumasi Wallet Manager\n");

  switch (command) {
    case "generate":
      console.log("Generating deployment wallets...\n");
      generateDeploymentWallets();
      break;

    case "test":
      console.log("Adding Anvil test wallets...\n");
      generateTestWallets();
      break;

    case "list":
      displayWallets();
      break;

    case "export":
      exportForFoundry();
      break;

    case "sync-env":
      console.log("Syncing deployer to .env...\n");
      updateEnvFile(loadWallets());
      break;

    case "all":
      console.log("Setting up all wallets...\n");
      generateDeploymentWallets();
      generateTestWallets();
      updateEnvFile(loadWallets());
      displayWallets();
      break;

    case "help":
    default:
      console.log("Usage: node manage-wallets.js <command>\n");
      console.log("Commands:");
      console.log("  generate   - Generate deployment wallets (deployer, treasury)");
      console.log("  test       - Add Anvil test wallets (alice, bob, carol, dave, eve)");
      console.log("  list       - Display all wallets (hides full private keys)");
      console.log("  export     - Export wallet info for Foundry .env");
      console.log("  sync-env   - Update .env with deployer private key");
      console.log("  all        - Run all setup steps");
      break;
  }
}

main();
