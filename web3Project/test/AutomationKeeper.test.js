const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AutomationKeeper", function () {
  let vault, router, keeper, stablecoin;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy mock stablecoin
    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    stablecoin = await MockStablecoin.deploy("Mock USDC", "mUSDC", 6);
    await stablecoin.waitForDeployment();

    // Deploy vault
    const YieldVault = await ethers.getContractFactory("YieldVault");
    vault = await YieldVault.deploy(await stablecoin.getAddress());
    await vault.waitForDeployment();

    // Deploy router
    const YieldRouter = await ethers.getContractFactory("YieldRouter");
    router = await YieldRouter.deploy(
      await vault.getAddress(),
      await stablecoin.getAddress()
    );
    await router.waitForDeployment();

    // Deploy keeper
    const AutomationKeeper = await ethers.getContractFactory("AutomationKeeper");
    keeper = await AutomationKeeper.deploy(await router.getAddress());
    await keeper.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct router address", async function () {
      expect(await keeper.router()).to.equal(await router.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await keeper.owner()).to.equal(owner.address);
    });

    it("Should initialize unpaused", async function () {
      expect(await keeper.paused()).to.equal(false);
    });

    it("Should initialize upkeep count to zero", async function () {
      expect(await keeper.upkeepCount()).to.equal(0);
    });
  });

  describe("Check Upkeep", function () {
    it("Should return false when paused", async function () {
      await keeper.setPaused(true);
      const [upkeepNeeded] = await keeper.checkUpkeep("0x");
      expect(upkeepNeeded).to.equal(false);
    });

    it("Should check upkeep when not paused", async function () {
      const [upkeepNeeded] = await keeper.checkUpkeep("0x");
      // Should be false initially with no protocols or funds
      expect(upkeepNeeded).to.equal(false);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause", async function () {
      await keeper.setPaused(true);
      expect(await keeper.paused()).to.equal(true);
    });

    it("Should allow owner to unpause", async function () {
      await keeper.setPaused(true);
      await keeper.setPaused(false);
      expect(await keeper.paused()).to.equal(false);
    });

    it("Should reject non-owner from pausing", async function () {
      await expect(
        keeper.connect(user1).setPaused(true)
      ).to.be.revertedWith("Not owner");
    });

    it("Should emit event when paused", async function () {
      await expect(keeper.setPaused(true))
        .to.emit(keeper, "KeeperPaused")
        .withArgs(true);
    });
  });

  describe("Statistics", function () {
    it("Should return correct stats", async function () {
      const [lastUpkeepTime, upkeepCount] = await keeper.getStats();
      expect(upkeepCount).to.equal(0);
      expect(lastUpkeepTime).to.be.gt(0);
    });
  });

  describe("Perform Upkeep", function () {
    it("Should reject when paused", async function () {
      await keeper.setPaused(true);
      
      // Create mock rebalance params
      const params = {
        fromProtocol: ethers.ZeroAddress,
        toProtocol: ethers.ZeroAddress,
        amount: 0,
        minAmountOut: 0,
        estimatedGas: 0
      };
      
      const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(address,address,uint256,uint256,uint256)"],
        [[params.fromProtocol, params.toProtocol, params.amount, params.minAmountOut, params.estimatedGas]]
      );

      await expect(
        keeper.performUpkeep(encodedParams)
      ).to.be.revertedWith("Keeper paused");
    });
  });
});

