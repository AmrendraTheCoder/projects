const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting Adaptive Yield Router deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("");

  // Deploy Mock Stablecoin (for testing)
  console.log("📝 Deploying Mock Stablecoin...");
  const MockStablecoin = await hre.ethers.getContractFactory("MockStablecoin");
  const stablecoin = await MockStablecoin.deploy("Mock USDC", "mUSDC", 6);
  await stablecoin.waitForDeployment();
  const stablecoinAddress = await stablecoin.getAddress();
  console.log("✅ Mock Stablecoin deployed to:", stablecoinAddress);
  console.log("");

  // Deploy YieldVault
  console.log("📝 Deploying YieldVault...");
  const YieldVault = await hre.ethers.getContractFactory("YieldVault");
  const vault = await YieldVault.deploy(stablecoinAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ YieldVault deployed to:", vaultAddress);
  console.log("");

  // Deploy YieldRouter
  console.log("📝 Deploying YieldRouter...");
  const YieldRouter = await hre.ethers.getContractFactory("YieldRouter");
  const router = await YieldRouter.deploy(vaultAddress, stablecoinAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ YieldRouter deployed to:", routerAddress);
  console.log("");

  // Deploy AutomationKeeper
  console.log("📝 Deploying AutomationKeeper...");
  const AutomationKeeper = await hre.ethers.getContractFactory("AutomationKeeper");
  const keeper = await AutomationKeeper.deploy(routerAddress);
  await keeper.waitForDeployment();
  const keeperAddress = await keeper.getAddress();
  console.log("✅ AutomationKeeper deployed to:", keeperAddress);
  console.log("");

  // Deploy Mock Protocol Adapters (for testing)
  console.log("📝 Deploying Mock Aave Adapter...");
  // Note: In production, use real Aave pool addresses
  const mockAavePool = "0x0000000000000000000000000000000000000001";
  const mockAToken = "0x0000000000000000000000000000000000000002";
  
  console.log("⚠️  Using mock addresses for testing. Update with real addresses for production.");
  console.log("");

  // Mint some tokens for testing
  console.log("💰 Minting test tokens...");
  await stablecoin.mint(deployer.address, hre.ethers.parseUnits("10000", 6));
  console.log("✅ Minted 10,000 mUSDC to deployer");
  console.log("");

  // Summary
  console.log("=" .repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(60));
  console.log("Deployer Address:     ", deployer.address);
  console.log("Mock Stablecoin:      ", stablecoinAddress);
  console.log("YieldVault:           ", vaultAddress);
  console.log("YieldRouter:          ", routerAddress);
  console.log("AutomationKeeper:     ", keeperAddress);
  console.log("=" .repeat(60));
  console.log("");

  console.log("📝 Save these addresses to your .env file:");
  console.log(`STABLECOIN_ADDRESS=${stablecoinAddress}`);
  console.log(`VAULT_ADDRESS=${vaultAddress}`);
  console.log(`ROUTER_ADDRESS=${routerAddress}`);
  console.log(`KEEPER_ADDRESS=${keeperAddress}`);
  console.log("");

  console.log("✨ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

