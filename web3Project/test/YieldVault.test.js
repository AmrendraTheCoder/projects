const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldVault", function () {
  let vault, stablecoin;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock stablecoin
    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    stablecoin = await MockStablecoin.deploy("Mock USDC", "mUSDC", 6);
    await stablecoin.waitForDeployment();

    // Deploy vault
    const YieldVault = await ethers.getContractFactory("YieldVault");
    vault = await YieldVault.deploy(await stablecoin.getAddress());
    await vault.waitForDeployment();

    // Mint tokens to users
    await stablecoin.mint(user1.address, ethers.parseUnits("10000", 6));
    await stablecoin.mint(user2.address, ethers.parseUnits("10000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct stablecoin address", async function () {
      expect(await vault.stablecoin()).to.equal(await stablecoin.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero deposits", async function () {
      expect(await vault.totalDeposits()).to.equal(0);
      expect(await vault.totalShares()).to.equal(0);
    });
  });

  describe("Guardrails", function () {
    it("Should allow users to set guardrails", async function () {
      await vault.connect(user1).setGuardrails(
        500,  // 5% min APY
        100,  // 1% max slippage
        50    // 50 gwei max gas
      );

      const guardrails = await vault.userGuardrails(user1.address);
      expect(guardrails.minAPY).to.equal(500);
      expect(guardrails.maxSlippage).to.equal(100);
      expect(guardrails.maxGasPrice).to.equal(50);
      expect(guardrails.isActive).to.equal(true);
    });

    it("Should reject invalid guardrails", async function () {
      await expect(
        vault.connect(user1).setGuardrails(
          20000, // Invalid: > BASIS_POINTS
          100,
          50
        )
      ).to.be.revertedWith("Invalid minAPY");
    });
  });

  describe("Deposits", function () {
    beforeEach(async function () {
      // Set guardrails first
      await vault.connect(user1).setGuardrails(500, 100, 50);
      await vault.connect(user2).setGuardrails(500, 100, 50);
    });

    it("Should allow deposits after setting guardrails", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      
      await stablecoin.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);

      const deposit = await vault.userDeposits(user1.address);
      expect(deposit.amount).to.equal(depositAmount);
      expect(await vault.totalDeposits()).to.equal(depositAmount);
    });

    it("Should reject deposits without guardrails", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      const user3 = (await ethers.getSigners())[3];
      
      await stablecoin.mint(user3.address, depositAmount);
      await stablecoin.connect(user3).approve(await vault.getAddress(), depositAmount);
      
      await expect(
        vault.connect(user3).deposit(depositAmount)
      ).to.be.revertedWith("Set guardrails first");
    });

    it("Should reject deposits below minimum", async function () {
      const smallAmount = ethers.parseUnits("5", 6); // Below MIN_DEPOSIT
      
      await stablecoin.connect(user1).approve(await vault.getAddress(), smallAmount);
      
      await expect(
        vault.connect(user1).deposit(smallAmount)
      ).to.be.revertedWith("Amount below minimum");
    });

    it("Should calculate shares correctly", async function () {
      const amount1 = ethers.parseUnits("1000", 6);
      const amount2 = ethers.parseUnits("2000", 6);

      await stablecoin.connect(user1).approve(await vault.getAddress(), amount1);
      await vault.connect(user1).deposit(amount1);

      await stablecoin.connect(user2).approve(await vault.getAddress(), amount2);
      await vault.connect(user2).deposit(amount2);

      const deposit1 = await vault.userDeposits(user1.address);
      const deposit2 = await vault.userDeposits(user2.address);

      // First deposit: shares = amount
      expect(deposit1.shares).to.equal(amount1);
      // Second deposit: shares proportional to existing
      expect(deposit2.shares).to.equal(amount2);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await vault.connect(user1).setGuardrails(500, 100, 50);
      
      const depositAmount = ethers.parseUnits("1000", 6);
      await stablecoin.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);
    });

    it("Should allow users to withdraw their deposits", async function () {
      const deposit = await vault.userDeposits(user1.address);
      const initialBalance = await stablecoin.balanceOf(user1.address);

      await vault.connect(user1).withdraw(deposit.shares);

      const finalBalance = await stablecoin.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
      
      const newDeposit = await vault.userDeposits(user1.address);
      expect(newDeposit.shares).to.equal(0);
    });

    it("Should reject withdrawal of more shares than owned", async function () {
      const deposit = await vault.userDeposits(user1.address);
      const excessShares = deposit.shares + 1n;

      await expect(
        vault.connect(user1).withdraw(excessShares)
      ).to.be.revertedWith("Insufficient shares");
    });
  });

  describe("Emergency Withdraw", function () {
    beforeEach(async function () {
      await vault.connect(user1).setGuardrails(500, 100, 50);
      
      const depositAmount = ethers.parseUnits("1000", 6);
      await stablecoin.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);
    });

    it("Should allow emergency withdrawal", async function () {
      const initialBalance = await stablecoin.balanceOf(user1.address);

      await vault.connect(user1).emergencyWithdraw();

      const finalBalance = await stablecoin.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
      
      const deposit = await vault.userDeposits(user1.address);
      expect(deposit.shares).to.equal(0);
      expect(deposit.amount).to.equal(0);
    });
  });

  describe("Protocol Whitelisting", function () {
    it("Should allow owner to whitelist protocols", async function () {
      const protocolAddress = "0x1234567890123456789012345678901234567890";
      
      await vault.whitelistProtocol(protocolAddress, true);
      expect(await vault.whitelistedProtocols(protocolAddress)).to.equal(true);
    });

    it("Should reject non-owner from whitelisting", async function () {
      const protocolAddress = "0x1234567890123456789012345678901234567890";
      
      await expect(
        vault.connect(user1).whitelistProtocol(protocolAddress, true)
      ).to.be.reverted;
    });
  });

  describe("User Value", function () {
    it("Should correctly calculate user value", async function () {
      await vault.connect(user1).setGuardrails(500, 100, 50);
      
      const depositAmount = ethers.parseUnits("1000", 6);
      await stablecoin.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);

      const userValue = await vault.getUserValue(user1.address);
      expect(userValue).to.equal(depositAmount);
    });
  });
});

