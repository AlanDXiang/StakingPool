const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StakingPool System", function () {
    let StakingPool, stakingPool;
    let MockERC20, stakingToken, rewardsToken;
    let owner, addr1, addr2;

    const parseUnits = (amount) => ethers.parseUnits(amount, 18);
    const formatUnits = (amount) => ethers.formatUnits(amount, 18);

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // 1. Deploy Tokens
        MockERC20 = await ethers.getContractFactory("MockERC20");
        stakingToken = await MockERC20.deploy("Stake Token", "STK");
        rewardsToken = await MockERC20.deploy("Reward Token", "RWD");

        // 2. Deploy Pool
        StakingPool = await ethers.getContractFactory("StakingPool");
        stakingPool = await StakingPool.deploy(stakingToken.target, rewardsToken.target);

        // 3. Fund Users
        await stakingToken.transfer(addr1.address, parseUnits("1000"));
        await stakingToken.transfer(addr2.address, parseUnits("1000"));

        // 4. Approvals
        await stakingToken.connect(addr1).approve(stakingPool.target, parseUnits("1000"));
        await stakingToken.connect(addr2).approve(stakingPool.target, parseUnits("1000"));
    });

    describe("Core Mechanics (Stake & Withdraw)", function () {
        it("Should allow staking and update balances", async function () {
            await stakingPool.connect(addr1).stake(parseUnits("100"));

            expect(await stakingPool.balanceOf(addr1.address)).to.equal(parseUnits("100"));
            expect(await stakingPool.totalSupply()).to.equal(parseUnits("100"));
        });

        it("Should allow withdrawing and return tokens", async function () {
            await stakingPool.connect(addr1).stake(parseUnits("100"));
            await stakingPool.connect(addr1).withdraw(parseUnits("50"));

            expect(await stakingPool.balanceOf(addr1.address)).to.equal(parseUnits("50"));
            expect(await stakingToken.balanceOf(addr1.address)).to.equal(parseUnits("950")); // 1000 - 50 staked
        });

        it("Should fail if staking 0 or withdrawing > balance", async function () {
            await expect(stakingPool.connect(addr1).stake(0)).to.be.revertedWith("Cannot stake 0");
            await expect(stakingPool.connect(addr1).withdraw(parseUnits("10"))).to.be.revertedWith("Insufficient balance");
        });
    });

    describe("Rewards System", function () {
        beforeEach(async function () {
            // Setup: 1000 Tokens over 100 seconds = 10 Tokens/sec
            await rewardsToken.transfer(stakingPool.target, parseUnits("1000"));
            await stakingPool.setRewardsDuration(100);
            await stakingPool.notifyRewardAmount(parseUnits("1000"));
        });

        it("Should enable a user to claim rewards", async function () {
            await stakingPool.connect(addr1).stake(parseUnits("100"));

            // Fast forward 50 seconds
            await time.increase(50);

            // Claiming rewards creates a transaction (+1 second)
            // Total time = 50s (wait) + 1s (tx) = 51s
            // Expected Reward = 51s * 10 tokens/sec = 510 tokens
            await stakingPool.connect(addr1).getReward();

            const balance = await rewardsToken.balanceOf(addr1.address);
            expect(balance).to.be.closeTo(parseUnits("510"), parseUnits("1"));
        });

        it("Should correctly split rewards between two users (The Global Odometer Test)", async function () {
            // 1. User 1 stakes 100
            await stakingPool.connect(addr1).stake(parseUnits("100"));

            // 2. Wait 10 seconds.
            await time.increase(10);

            // 3. User 2 stakes 100. (Total stake = 200). 
            // This transaction takes 1 second. 
            // User 1 gets full credit for this 1 second before User 2 arrives.
            await stakingPool.connect(addr2).stake(parseUnits("100"));

            // 4. Wait 10 seconds.
            await time.increase(10);

            // CALCULATION:
            // User 1 Alone: 10s (wait) + 1s (User 2's tx) = 11s * 10 tokens = 110 tokens
            // Shared Time: 10s (wait) = 10s * 5 tokens = 50 tokens
            // User 1 Total: 110 + 50 = 160
            // User 2 Total: 10s * 5 tokens = 50

            expect(await stakingPool.earned(addr1.address)).to.be.closeTo(parseUnits("160"), parseUnits("1"));
            expect(await stakingPool.earned(addr2.address)).to.be.closeTo(parseUnits("50"), parseUnits("1"));
        });
    });

    describe("Admin Functions", function () {
        it("Should not allow setting duration while event is active", async function () {
            await rewardsToken.transfer(stakingPool.target, parseUnits("100"));
            await stakingPool.setRewardsDuration(100);
            await stakingPool.notifyRewardAmount(parseUnits("100"));

            // Try to change duration immediately
            await expect(stakingPool.setRewardsDuration(200)).to.be.revertedWith("Reward duration not finished");
        });
    });
});