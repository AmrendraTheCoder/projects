const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldRouter", function () {
  let vault, router, stablecoin;
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
  });

  describe("Deployment", function () {
    it("Should set the correct vault address", async function () {
      expect(await router.vault()).to.equal(await vault.getAddress());
    });

    it("Should set the correct stablecoin address", async function () {
      expect(await router.stablecoin()).to.equal(await stablecoin.getAddress());
    });

    it("Should initialize with correct constants", async function () {
      expect(await router.MIN_IMPROVEMENT()).to.equal(50);
      expect(await router.GAS_BUFFER()).to.equal(50000);
    });
  });

  describe("Protocol Management", function () {
    it("Should allow owner to add protocols", async function () {
      const protocolAddress = ethers.Wallet.createRandom().address;
      const adapterAddress = ethers.Wallet.createRandom().address;

      await router.addProtocol(protocolAddress, adapterAddress);

      const protocol = await router.protocols(protocolAddress);
      expect(protocol.adapter).to.equal(adapterAddress);
      expect(protocol.isActive).to.equal(true);
    });

    it("Should reject adding protocol with zero address", async function () {
      const protocolAddress = ethers.Wallet.createRandom().address;
      
      await expect(
        router.addProtocol(protocolAddress, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid adapter");
    });

    it("Should reject duplicate protocol", async function () {
      const protocolAddress = ethers.Wallet.createRandom().address;
      const adapterAddress = ethers.Wallet.createRandom().address;

      await router.addProtocol(protocolAddress, adapterAddress);
      
      await expect(
        router.addProtocol(protocolAddress, adapterAddress)
      ).to.be.revertedWith("Protocol already exists");
    });

    it("Should allow updating protocol APY", async function () {
      const protocolAddress = ethers.Wallet.createRandom().address;
      const adapterAddress = ethers.Wallet.createRandom().address;

      await router.addProtocol(protocolAddress, adapterAddress);
      await router.updateAPY(protocolAddress, 500); // 5% APY

      const protocol = await router.protocols(protocolAddress);
      expect(protocol.currentAPY).to.equal(500);
    });
  });

  describe("Best Protocol Selection", function () {
    it("Should identify the best protocol by APY", async function () {
      const protocol1 = ethers.Wallet.createRandom().address;
      const protocol2 = ethers.Wallet.createRandom().address;
      const adapter1 = ethers.Wallet.createRandom().address;
      const adapter2 = ethers.Wallet.createRandom().address;

      await router.addProtocol(protocol1, adapter1);
      await router.addProtocol(protocol2, adapter2);

      await router.updateAPY(protocol1, 300); // 3% APY
      await router.updateAPY(protocol2, 500); // 5% APY

      const [bestProtocol, bestAPY] = await router.getBestProtocol();
      expect(bestProtocol).to.equal(protocol2);
      expect(bestAPY).to.equal(500);
    });

    it("Should return zero address when no protocols exist", async function () {
      const [bestProtocol, bestAPY] = await router.getBestProtocol();
      expect(bestProtocol).to.equal(ethers.ZeroAddress);
      expect(bestAPY).to.equal(0);
    });
  });

  describe("Rebalance Checks", function () {
    it("Should check rebalancing conditions", async function () {
      const [needsRebalance] = await router.checkRebalance();
      // Initially should be false with no protocols or deposits
      expect(needsRebalance).to.equal(false);
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to update rebalance interval", async function () {
      const newInterval = 14 * 24 * 60 * 60; // 14 days
      await router.setRebalanceInterval(newInterval);
      expect(await router.rebalanceInterval()).to.equal(newInterval);
    });

    it("Should reject too short rebalance interval", async function () {
      const shortInterval = 12 * 60 * 60; // 12 hours
      await expect(
        router.setRebalanceInterval(shortInterval)
      ).to.be.revertedWith("Interval too short");
    });
  });

  describe("Gas Estimation", function () {
    it("Should estimate rebalance gas", async function () {
      const estimatedGas = await router.estimateRebalanceGas();
      expect(estimatedGas).to.be.gt(0);
    });
  });

  describe("Get All Protocols", function () {
    it("Should return all protocols with their info", async function () {
      const protocol1 = ethers.Wallet.createRandom().address;
      const protocol2 = ethers.Wallet.createRandom().address;
      const adapter1 = ethers.Wallet.createRandom().address;
      const adapter2 = ethers.Wallet.createRandom().address;

      await router.addProtocol(protocol1, adapter1);
      await router.addProtocol(protocol2, adapter2);

      const [protocols, infos] = await router.getAllProtocols();
      expect(protocols.length).to.equal(2);
      expect(infos.length).to.equal(2);
      expect(protocols[0]).to.equal(protocol1);
      expect(protocols[1]).to.equal(protocol2);
    });
  });
});

