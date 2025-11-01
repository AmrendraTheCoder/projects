const hre = require("hardhat");

/**
 * Interactive script for testing deployed contracts
 * Usage: npx hardhat run scripts/interact.js --network localhost
 */

async function main() {
  console.log("🔧 Adaptive Yield Router - Interaction Script\n");

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), "ETH\n");

  // Contract addresses (update these after deployment)
  const STABLECOIN_ADDRESS = process.env.STABLECOIN_ADDRESS || "";
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "";
  const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS || "";

  if (!STABLECOIN_ADDRESS || !VAULT_ADDRESS || !ROUTER_ADDRESS) {
    console.error("❌ Please set contract addresses in .env file");
    process.exit(1);
  }

  // Get contract instances
  const stablecoin = await hre.ethers.getContractAt("MockStablecoin", STABLECOIN_ADDRESS);
  const vault = await hre.ethers.getContractAt("YieldVault", VAULT_ADDRESS);
  const router = await hre.ethers.getContractAt("YieldRouter", ROUTER_ADDRESS);

  console.log("📊 Contract Status Check\n");

  // Check stablecoin balance
  const balance = await stablecoin.balanceOf(signer.address);
  console.log("Stablecoin Balance:", hre.ethers.formatUnits(balance, 6), "USDC");

  // Check vault stats
  const totalDeposits = await vault.totalDeposits();
  const totalShares = await vault.totalShares();
  console.log("Vault Total Deposits:", hre.ethers.formatUnits(totalDeposits, 6), "USDC");
  console.log("Vault Total Shares:", totalShares.toString());

  // Check user deposit
  const userDeposit = await vault.userDeposits(signer.address);
  console.log("\n👤 Your Position:");
  console.log("  Deposited Amount:", hre.ethers.formatUnits(userDeposit.amount, 6), "USDC");
  console.log("  Shares:", userDeposit.shares.toString());

  // Check user value
  const userValue = await vault.getUserValue(signer.address);
  console.log("  Current Value:", hre.ethers.formatUnits(userValue, 6), "USDC");

  // Check guardrails
  const guardrails = await vault.userGuardrails(signer.address);
  if (guardrails.isActive) {
    console.log("\n⚙️  Your Guardrails:");
    console.log("  Min APY:", guardrails.minAPY.toString(), "basis points");
    console.log("  Max Slippage:", guardrails.maxSlippage.toString(), "basis points");
    console.log("  Max Gas Price:", guardrails.maxGasPrice.toString(), "gwei");
  } else {
    console.log("\n⚠️  Guardrails not set");
  }

  // Get all protocols
  console.log("\n🔄 Protocol Information:");
  const [protocols, infos] = await router.getAllProtocols();
  
  if (protocols.length === 0) {
    console.log("  No protocols configured yet");
  } else {
    protocols.forEach((protocol, index) => {
      const info = infos[index];
      console.log(`  Protocol ${index + 1}:`, protocol);
      console.log(`    APY: ${info.currentAPY.toString()} basis points`);
      console.log(`    Active: ${info.isActive}`);
    });
  }

  // Get best protocol
  const [bestProtocol, bestAPY] = await router.getBestProtocol();
  if (bestProtocol !== hre.ethers.ZeroAddress) {
    console.log("\n⭐ Best Protocol:", bestProtocol);
    console.log("   APY:", bestAPY.toString(), "basis points");
  }

  // Check rebalancing status
  console.log("\n🔄 Rebalancing Status:");
  const [needsRebalance, params] = await router.checkRebalance();
  console.log("  Needs Rebalance:", needsRebalance);
  
  if (needsRebalance) {
    console.log("  From:", params.fromProtocol);
    console.log("  To:", params.toProtocol);
    console.log("  Amount:", hre.ethers.formatUnits(params.amount, 6), "USDC");
    console.log("  Estimated Gas:", params.estimatedGas.toString());
  }

  console.log("\n✨ Interaction script completed!\n");

  // Example actions (commented out - uncomment to use)
  
  /*
  // Set guardrails
  console.log("Setting guardrails...");
  const tx1 = await vault.setGuardrails(
    500,  // 5% min APY
    100,  // 1% max slippage
    50    // 50 gwei max gas
  );
  await tx1.wait();
  console.log("✅ Guardrails set!");
  */

  /*
  // Deposit
  const depositAmount = hre.ethers.parseUnits("100", 6); // 100 USDC
  console.log("Approving tokens...");
  const tx2 = await stablecoin.approve(VAULT_ADDRESS, depositAmount);
  await tx2.wait();
  
  console.log("Depositing...");
  const tx3 = await vault.deposit(depositAmount);
  await tx3.wait();
  console.log("✅ Deposit successful!");
  */

  /*
  // Withdraw
  const userDep = await vault.userDeposits(signer.address);
  if (userDep.shares > 0) {
    console.log("Withdrawing...");
    const tx4 = await vault.withdraw(userDep.shares);
    await tx4.wait();
    console.log("✅ Withdrawal successful!");
  }
  */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

