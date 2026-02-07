const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const parseUnits = (amount) => BigInt(amount) * 10n ** 18n;

module.exports = buildModule("StakingSystem", (m) => {
    // 1. Deploy the Staking Token (Mock)
    const stakingToken = m.contract("MockERC20", ["Staking Token", "STK"], {
        id: "StakingToken",
    });

    // 2. Deploy the Rewards Token (Mock)
    const rewardsToken = m.contract("MockERC20", ["Rewards Token", "RWD"], {
        id: "RewardsToken",
    });

    // 3. Deploy the Staking Pool
    // We pass the addresses of the two tokens we just deployed
    const stakingPool = m.contract("StakingPool", [stakingToken, rewardsToken]);

    // Optional: Return the contracts so we can use them in tests or scripts
    return { stakingToken, rewardsToken, stakingPool };
});