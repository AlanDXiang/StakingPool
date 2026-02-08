# 🏦 DeFi Staking Pool

A professional-grade Staking dApp built with **Hardhat** and **Solidity**. This project implements a "Synthetix-style" staking algorithm, allowing users to stake ERC20 tokens and earn rewards proportional to their share of the pool and the time staked.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)
![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)

## 🌟 Features

* **Time-Based Rewards:** Users earn rewards every second they are staked.
* **Math Precision:** Uses a "Global Odometer" (Reward Per Token) pattern for O(1) complexity, ensuring gas costs remain low regardless of user count.
* **Security:** Built with OpenZeppelin v5 (ReentrancyGuard, Ownable, SafeERC20).
* **Admin Controls:** Owner can set reward durations and fund the pool dynamically.
* **Comprehensive Testing:** Includes "Time Travel" tests to verify reward accumulation over time.

---

## 📂 Project Structure

* `contracts/`: Smart contracts (`Staking.sol`, `MockERC20.sol`).
* `test/`: Hardhat tests ensuring mathematical accuracy.
* `ignition/modules/`: Deployment modules for Hardhat Ignition.
* `scripts/`: Interaction scripts for mainnet/testnet and local time manipulation.

---

## 🛠️ Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone <your-repo-url>
    cd StakingPool
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory (do not share this file!).
    ```ini
    # .env
    PRIVATE_KEY="your_wallet_private_key"
    SEPOLIA_RPC_URL="[https://sepolia.infura.io/v3/YOUR_KEY](https://sepolia.infura.io/v3/YOUR_KEY)"
    ETHERSCAN_API_KEY="your_etherscan_key"
    ```

---

## 🧪 Testing

We use Hardhat and Chai for testing. The test suite includes "Time Travel" scenarios to simulate days or weeks of staking in seconds.

```bash
npx hardhat test

```

**What is tested?**

* ✅ Staking & Withdrawing mechanics.
* ✅ Reward calculation accuracy (Math verification).
* ✅ Multi-user scenarios (ensuring no one steals rewards).
* ✅ Access controls (Owner functions).

---

## 🚀 Deployment

We use **Hardhat Ignition** for robust deployments.

### Option 1: Local Blockchain (Fastest)

Great for development and frontend testing.

1. **Start the Local Node:**
```bash
npx hardhat node

```


2. **Deploy:**
```bash
npx hardhat ignition deploy ignition/modules/Deploy.js --network localhost

```



### Option 2: Sepolia Testnet (Public)

Deploys to the real Ethereum test network.

```bash
npx hardhat ignition deploy ignition/modules/Deploy.js --network sepolia

```

---

## 🎮 Interaction Scripts

After deployment, you can interact with your contract using the provided scripts.

### 1. Setup & Stake (`scripts/interact.js`)

This script funds the pool, sets the reward rate, and stakes tokens on behalf of the owner.

* **Note:** If running on Sepolia, make sure to update the addresses in the script first.

```bash
npx hardhat run scripts/interact.js --network localhost
# OR
npx hardhat run scripts/interact.js --network sepolia

```

### 2. Time Travel Debugging (`scripts/checkRewards.js`)

*Only works on `localhost`.*
This script simulates the passage of time (e.g., fast-forward 30 seconds) to verify rewards without waiting.

```bash
npx hardhat run scripts/checkRewards.js --network localhost

```

---

## 📜 Contract Details

### StakingPool.sol

* **Staking Token:** The ERC20 token users deposit.
* **Rewards Token:** The ERC20 token users earn (can be the same or different).
* **updateReward Modifier:** The heartbeat of the contract. It updates the state whenever a user interacts, ensuring calculations are always precise down to the second.

---

## 🛡️ Security

* **ReentrancyGuard:** Prevents reentrancy attacks on withdraw/claim functions.
* **SafeERC20:** Handles non-standard ERC20 tokens securely.
* **Rounding Errors:** Minimized by scaling calculations by `1e18`.

