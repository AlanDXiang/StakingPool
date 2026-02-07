const hre = require("hardhat");

async function main() {
    // -- CONFIGURATION --
    // (replace addresses with yours)
    const POOL_ADDR = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    // Get the account
    const [owner] = await hre.ethers.getSigners();
    const stakingPool = await hre.ethers.getContractAt("StakingPool", POOL_ADDR);

    console.log("--- ⏱️  Current Status ---");

    // Check pending rewards BEFORE time travel
    let earned = await stakingPool.earned(owner.address);
    console.log(`💰 Earned so far: ${hre.ethers.formatUnits(earned, 18)} RWD`);

    console.log("\n🚀 WARPING TIME FORWARD 30 SECONDS...");

    // -- THE MAGIC COMMANDS --
    // 1. fast forward time by 30 seconds
    await hre.network.provider.send("evm_increaseTime", [30]);
    // 2. mine a new block to "stamp" the new time
    await hre.network.provider.send("evm_mine");

    console.log("--- 🏁 Future Status ---");

    // Check pending rewards AFTER time travel
    earned = await stakingPool.earned(owner.address);
    console.log(`💰 Earned after warp: ${hre.ethers.formatUnits(earned, 18)} RWD`);

    // Quick math check: 
    // Rate was ~16.6 RWD/sec. 
    // 30 seconds * 16.6 = ~500 RWD. 
    // You should see roughly 500 tokens!
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});