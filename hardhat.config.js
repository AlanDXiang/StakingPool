require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load the secrets

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.20",
    networks: {
        // We define the new network here
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL,
            accounts: [process.env.PRIVATE_KEY], // Hardhat will use this account to deploy
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY, // Used to verify code later
    },
};