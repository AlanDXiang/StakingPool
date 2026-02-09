const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Invariant (Fuzzing)", function () {
    let stakingPool, stakingToken, rewardsToken;
    let owner, user1, user2;

    // Settings
    const NUM_RUNS = 50;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // 1. Deploy Tokens (MockERC20)
        // The Deployer (owner) receives the initial Total Supply automatically.
        const TokenFactory = await ethers.getContractFactory("MockERC20");
        stakingToken = await TokenFactory.deploy("Staking Token", "STK");
        rewardsToken = await TokenFactory.deploy("Rewards Token", "RWD");

        // 2. Deploy StakingPool
        const StakingFactory = await ethers.getContractFactory("StakingPool");
        stakingPool = await StakingFactory.deploy(stakingToken.target, rewardsToken.target);

        // 3. Fund the Reward Pool & Initialize Logic
        // FIX: Use transfer instead of mint
        await rewardsToken.transfer(stakingPool.target, ethers.parseEther("10000")); // Fund contract

        await stakingPool.setRewardsDuration(604800); // 7 Days
        await stakingPool.notifyRewardAmount(ethers.parseEther("5000")); // Start emission

        // 4. Fund Users & Approve
        // FIX: Use transfer instead of mint
        // The owner transfers tokens to the users so they can play.
        await stakingToken.transfer(user1.address, ethers.parseEther("10000"));
        await stakingToken.transfer(user2.address, ethers.parseEther("10000"));

        await stakingToken.connect(user1).approve(stakingPool.target, ethers.MaxUint256);
        await stakingToken.connect(user2).approve(stakingPool.target, ethers.MaxUint256);
    });

    it("Invariant: Staking Solvency (Contract Staking Balance >= Total Staked)", async function () {
        const actions = ["stake", "withdraw", "getReward", "exit"];
        const users = [user1, user2];

        for (let i = 0; i < NUM_RUNS; i++) {
            // Pick random user and action
            const user = users[Math.floor(Math.random() * users.length)];
            const action = actions[Math.floor(Math.random() * actions.length)];
            // Random amount between 1 and 50
            const amount = ethers.parseEther((Math.random() * 50 + 1).toFixed(2));

            try {
                if (action === "stake") {
                    await stakingPool.connect(user).stake(amount);
                }
                else if (action === "withdraw") {
                    // Check balance first to avoid useless reverts
                    const stakedBal = await stakingPool.balanceOf(user.address);
                    if (stakedBal > 0n) {
                        // Withdraw a random portion of what they own
                        const withdrawAmt = stakedBal > amount ? amount : stakedBal;
                        await stakingPool.connect(user).withdraw(withdrawAmt);
                    }
                }
                else if (action === "getReward") {
                    await stakingPool.connect(user).getReward();
                }
                else if (action === "exit") {
                    const stakedBal = await stakingPool.balanceOf(user.address);
                    if (stakedBal > 0n) {
                        await stakingPool.connect(user).exit();
                    }
                }
            } catch (e) {
                // Ignore expected reverts (like "Cannot stake 0")
                // We continue the loop to check if the state is still valid
            }

            // --- THE INVARIANT CHECKS ---

            // 1. Staking Solvency
            // The contract must always hold enough Staking Tokens to pay back everyone
            const contractStakingBal = await stakingToken.balanceOf(stakingPool.target);
            const totalUserStaked = await stakingPool.totalSupply();

            expect(contractStakingBal).to.be.greaterThanOrEqual(totalUserStaked,
                `Invariant Broken on run ${i}: Insolvency! Contract has fewer tokens than users staked.`
            );
        }
    });
});