const { expect } = require("chai");
const { ethers } = require("hardhat");

const ACTIVE_DEPOSIT_ADDRESS = "0xc1be769592a23e25c8a0a6cf39d57bdd8b3e47f6";
const REDEEMED_DEPOSIT_ADDRESS = "0x0d12d705bb562affd85b5d3a5cf3656169b56288";
const NON_DEPOSIT_ADDRESS = "0x868464f81e7b1be0e6ac5718174f0ffe378f9903";
const TBTC_DEPOSIT_TOKEN_ADDRESS = "0x10b66bd1e3b5a936b7f8dbc5976004311037cdf0";

describe("DepositRedemptionIncentive", function () {
  async function initContract(depositAddress, amount) {
    const DepositRedemptionIncentive = await ethers.getContractFactory("DepositRedemptionIncentive");
    const DepositRedemptionIncentiveFactory = await ethers.getContractFactory("DepositRedemptionIncentiveFactory");
    const implementation = await DepositRedemptionIncentive.deploy();
    depositRedemptionIncentiveFactory = await DepositRedemptionIncentiveFactory.deploy(implementation.address, TBTC_DEPOSIT_TOKEN_ADDRESS);
    const transactionReceipt = await depositRedemptionIncentiveFactory.createIncentive(depositAddress, {value: amount});
    const data = await transactionReceipt.wait();
    const cloneAddress = data.events[0].args.cloneAddress;

    return await DepositRedemptionIncentive.attach(cloneAddress);
  }

  it("Redeemed deposit should allow multiple deposits and a redemption", async function () {
    const redeemerAddress = "0xa984ecf1aca8dd45e1358034d577b6d2c7032262";
    const depositAddress = REDEEMED_DEPOSIT_ADDRESS;

    const depositRedemptionIncentive = await initContract(REDEEMED_DEPOSIT_ADDRESS);
    const redeemerStartingBalance = await ethers.provider.getBalance(redeemerAddress);

    const depositTx = await depositRedemptionIncentive.addIncentive({value: 10});
    await depositTx.wait();

    expect(await ethers.provider.getBalance(depositRedemptionIncentive.address)).to.equal(10);

    // Second deposit
    const depositTx2 = await depositRedemptionIncentive.addIncentive({value: 10});
    await depositTx2.wait();

    expect(await ethers.provider.getBalance(depositRedemptionIncentive.address)).to.equal(20);

    // Withdrawal
    const redeemTx = await depositRedemptionIncentive.redeem();
    await redeemTx.wait();

    // Contract balance should be 0
    expect(await ethers.provider.getBalance(depositRedemptionIncentive.address)).to.equal(0);

    // TDT owner should revceive the incentive
    const redeemerEndingBalance = await ethers.provider.getBalance(redeemerAddress);
    expect(redeemerEndingBalance.sub(redeemerStartingBalance)).to.equal(20);
  });

  it("Deposit should allow deposit via creation function", async function () {
    const depositRedemptionIncentive = await initContract(ACTIVE_DEPOSIT_ADDRESS, 10);

    expect(await ethers.provider.getBalance(depositRedemptionIncentive.address)).to.equal(10);
  });

  it("Active deposit should allow deposit but block redemption", async function () {
    const depositRedemptionIncentive = await initContract(ACTIVE_DEPOSIT_ADDRESS);

    const depositTx = await depositRedemptionIncentive.addIncentive({value: 10});
    await depositTx.wait();

    expect(await ethers.provider.getBalance(depositRedemptionIncentive.address)).to.equal(10);

    // Block Withdrawal
    await expect(depositRedemptionIncentive.redeem()).to.be.revertedWith("");
  });

  it("Deposit is not cancellable by non-creator", async function () {
    const [creator, addr1, addr2] = await ethers.getSigners();
    const depositRedemptionIncentive = await initContract(ACTIVE_DEPOSIT_ADDRESS);

    await expect(depositRedemptionIncentive.connect(addr1).initCancel()).to.be.revertedWith("");
  });

  it("Active deposit is not cancellable by creator before initializing cancellation", async function () {
    const [creator, addr1, addr2] = await ethers.getSigners();
    const depositRedemptionIncentive = await initContract(ACTIVE_DEPOSIT_ADDRESS);

    await expect(depositRedemptionIncentive.connect(creator).finalizeCancel()).to.be.revertedWith("");
  });

  it("End state deposit is not cancellable by creator before initializing cancellation", async function () {
    const [creator, addr1, addr2] = await ethers.getSigners();
    const depositRedemptionIncentive = await initContract(REDEEMED_DEPOSIT_ADDRESS);

    await expect(depositRedemptionIncentive.connect(creator).finalizeCancel()).to.be.revertedWith("");
  });

  it("Active deposit is not cancellable by creator before cooldown period", async function () {
    const [creator, addr1, addr2] = await ethers.getSigners();
    const depositRedemptionIncentive = await initContract(ACTIVE_DEPOSIT_ADDRESS);

    const cancelTx = await depositRedemptionIncentive.initCancel();
    await cancelTx.wait();

    // Cooldown period has not elapsed
    await expect(depositRedemptionIncentive.finalizeCancel()).to.be.revertedWith("");
  });

  it("Active deposit is cancellable by creator after cooldown period", async function () {
    const [creator, addr1, addr2] = await ethers.getSigners();
    const depositRedemptionIncentive = await initContract(ACTIVE_DEPOSIT_ADDRESS);

    const cancelTx = await depositRedemptionIncentive.initCancel();
    await cancelTx.wait();

    // Cooldown period has elapsed
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;
    await network.provider.send("evm_setNextBlockTimestamp", [timestampBefore + 60 * 60 * 24 * 7 + 1]);
    await network.provider.send("evm_mine");
    const finalizeTx = await depositRedemptionIncentive.finalizeCancel();
    await finalizeTx.wait();
  });

  it("Redeemed deposit is not cancellable by creator", async function () {
    const [creator, addr1, addr2] = await ethers.getSigners();
    const depositRedemptionIncentive = await initContract(REDEEMED_DEPOSIT_ADDRESS);

    const cancelTx = await depositRedemptionIncentive.initCancel();
    await cancelTx.wait();

    // Cooldown period has elapsed
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;
    await network.provider.send("evm_setNextBlockTimestamp", [timestampBefore + 60 * 60 * 24 * 7 + 1]);
    await network.provider.send("evm_mine");
    await expect(depositRedemptionIncentive.finalizeCancel()).to.be.revertedWith("");
  });

  it("Require non-deposit address initializations to fail", async function () {
    const DepositRedemptionIncentive = await ethers.getContractFactory("DepositRedemptionIncentive");
    const DepositRedemptionIncentiveFactory = await ethers.getContractFactory("DepositRedemptionIncentiveFactory");
    const implementation = await DepositRedemptionIncentive.deploy();
    depositRedemptionIncentiveFactory = await DepositRedemptionIncentiveFactory.deploy(implementation.address, TBTC_DEPOSIT_TOKEN_ADDRESS);
    await expect(depositRedemptionIncentiveFactory.createIncentive(NON_DEPOSIT_ADDRESS, {value: 0})).to.be.revertedWith("");
  });
});
