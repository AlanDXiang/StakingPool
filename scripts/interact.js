const hre = require("hardhat");

async function main() {
    // We use lowercase here to avoid "bad address checksum" errors
    const RWD_ADDR = "0xaa97a933c61bbc19fb2f109d9c7ebda93e488654".toLowerCase();
    const STK_ADDR = "0x16a3aabb9f2fd3d19328bfd1edfe196830719087".toLowerCase();
    const POOL_ADDR = "0x11f405b2b36d884f671ce40a645fa60ea412f917".toLowerCase();

    const [owner] = await hre.ethers.getSigners();
    console.log("interacting with account:", owner.address);

    const stakingToken = await hre.ethers.getContractAt("MockERC20", STK_ADDR);
    const rewardsToken = await hre.ethers.getContractAt("MockERC20", RWD_ADDR);
    const stakingPool = await hre.ethers.getContractAt("StakingPool", POOL_ADDR);

    // --- ACT 1: SETUP THE POOL ---
    console.log("\n--- Setting up Rewards ---");

    const rewardAmount = hre.ethers.parseUnits("1000", 18);

    // 1. Transfer
    console.log("Sending transfer transaction...");
    const tx1 = await rewardsToken.transfer(POOL_ADDR, rewardAmount);
    await tx1.wait(); // <--- CRITICAL FIX: Wait for block to be mined
    console.log("✅ Transferred 1000 RWD to Pool");

    // 2. Set Duration
    console.log("Setting duration...");
    const tx2 = await stakingPool.setRewardsDuration(60);
    await tx2.wait(); // <--- CRITICAL FIX: Wait so 'duration' is not 0
    console.log("✅ Set duration to 60 seconds");

    // 3. Notify Reward
    console.log("Notifying reward amount...");
    const tx3 = await stakingPool.notifyRewardAmount(rewardAmount);
    await tx3.wait(); // <--- CRITICAL FIX
    console.log("✅ Notified Reward Amount (Clock started!)");


    // --- ACT 2: USER STAKING ---
    console.log("\n--- Staking Tokens ---");
    const stakeAmount = hre.ethers.parseUnits("100", 18);

    // 1. Approve
    console.log("Approving tokens...");
    const tx4 = await stakingToken.approve(POOL_ADDR, stakeAmount);
    await tx4.wait(); // <--- CRITICAL FIX
    console.log("✅ Approved Pool");

    // 2. Stake
    console.log("Staking...");
    const tx5 = await stakingPool.stake(stakeAmount);
    await tx5.wait(); // <--- CRITICAL FIX
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