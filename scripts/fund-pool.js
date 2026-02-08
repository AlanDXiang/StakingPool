const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    // REPLACE THESE WITH YOUR ACTUAL DEPLOYED ADDRESSES
    const STAKING_POOL_ADDRESS = "0x11f405b2b36d884f671ce40a645fa60ea412f917";
    const REWARD_TOKEN_ADDRESS = "0xaa97a933c61bbc19fb2f109d9c7ebda93e488654";

    // How much reward to distribute? (e.g., 5000 tokens)
    const REWARD_AMOUNT = hre.ethers.parseEther("5000");

    // 1. Get Contract Instances
    const rewardToken = await hre.ethers.getContractAt("MockERC20", REWARD_TOKEN_ADDRESS);
    const stakingPool = await hre.ethers.getContractAt("StakingPool", STAKING_POOL_ADDRESS);

    console.log("Found Reward Token at:", await rewardToken.getAddress());
    console.log("Found Staking Pool at:", await stakingPool.getAddress());

    // 2. Transfer Reward Tokens to the Pool
    console.log(`Transferring ${hre.ethers.formatEther(REWARD_AMOUNT)} tokens to pool...`);
    const transferTx = await rewardToken.transfer(STAKING_POOL_ADDRESS, REWARD_AMOUNT);
    await transferTx.wait();
    console.log("Transfer complete!");

    // 3. Set Duration (if not already set) - e.g., 7 days (604800 seconds)
    console.log("Setting reward duration to 7 days...");
    const durationTx = await stakingPool.setRewardsDuration(604800);
    await durationTx.wait();

    // 4. Notify Reward Amount (Starts the clock!)
    console.log("Notifying reward amount...");
    const notifyTx = await stakingPool.notifyRewardAmount(REWARD_AMOUNT);
    await notifyTx.wait();

    console.log("✅ Pool Funded & Active! Refresh your frontend.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});