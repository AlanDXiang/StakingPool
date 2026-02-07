const hre = require("hardhat");

async function main() {
    // -- CONFIGURATION --
    // replace addresses from yours
    const RWD_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const STK_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const POOL_ADDR = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    // Get the account (Owner)
    const [owner] = await hre.ethers.getSigners();
    console.log("interacting with account:", owner.address);

    // Attach to the specific deployed contracts
    const stakingToken = await hre.ethers.getContractAt("MockERC20", STK_ADDR);
    const rewardsToken = await hre.ethers.getContractAt("MockERC20", RWD_ADDR);
    const stakingPool = await hre.ethers.getContractAt("StakingPool", POOL_ADDR);

    // --- ACT 1: SETUP THE POOL (Owner Action) ---
    console.log("\n--- Setting up Rewards ---");

    // 1. Send Reward Tokens to the Pool
    const rewardAmount = hre.ethers.parseUnits("1000", 18);
    await rewardsToken.transfer(POOL_ADDR, rewardAmount);
    console.log("✅ Transferred 1000 RWD to Pool");

    // 2. Set Duration (e.g., 7 days = 604800 seconds)
    // For testing locally, we'll use 60 seconds so we can see results fast
    await stakingPool.setRewardsDuration(60);
    console.log("✅ Set duration to 60 seconds");

    // 3. Notify Reward Amount (Starts the clock!)
    await stakingPool.notifyRewardAmount(rewardAmount);
    console.log("✅ Notified Reward Amount (Clock started!)");


    // --- ACT 2: USER STAKING (User Action) ---
    console.log("\n--- Staking Tokens ---");

    const stakeAmount = hre.ethers.parseUnits("100", 18);

    // 1. Approve the pool to spend our tokens
    await stakingToken.approve(POOL_ADDR, stakeAmount);
    console.log("✅ Approved Pool to spend 100 STK");

    // 2. Stake!
    await stakingPool.stake(stakeAmount);
    console.log("✅ Staked 100 STK");


    // --- ACT 3: CHECKING RESULTS ---
    console.log("\n--- Checking Status ---");

    const stakedBalance = await stakingPool.balanceOf(owner.address);
    console.log(`My Staked Balance: ${hre.ethers.formatUnits(stakedBalance, 18)} STK`);

    const rewardRate = await stakingPool.rewardRate();
    console.log(`Current Reward Rate: ${hre.ethers.formatUnits(rewardRate, 18)} RWD/sec`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});