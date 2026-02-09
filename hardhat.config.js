require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load the secrets
require("hardhat-gas-reporter");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.33",
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
    gasReporter: {
        enabled: true,
        currency: 'USD',
        noColors: false,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY || "", // Optional: for real USD prices
        token: "ETH",
    }
};