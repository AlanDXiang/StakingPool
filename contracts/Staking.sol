// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

// -- IMPORTS --
// We use OpenZeppelin for security. In Remix, these imports work automatically.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // -- STATE VARIABLES --
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardsToken;

    // Duration of the reward period (in seconds)
    uint256 public duration;
    // Timestamp when the reward period ends
    uint32 public finishAt;
    // Timestamp of the last update
    uint32 public updatedAt;
    // Rewards emitted per second
    uint256 public rewardRate;

    // The Global Odometer (Scaled by 1e18 for precision)
    uint192 public rewardPerTokenStored;

    // User Snapshots (The "Trip Meter")
    mapping(address => uint256) public userRewardPerTokenPaid;

    // Unclaimed rewards earned by each user
    mapping(address => uint256) public rewards;

    // Total staked amount
    uint256 public totalSupply;
    // User balances
    mapping(address => uint256) public balanceOf;

    // -- EVENTS --
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);

    // -- CONSTRUCTOR --
    constructor(
        address _stakingToken,
        address _rewardsToken
    ) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
    }

    // -- MODIFIERS --

    // The "Heartbeat" of the system.
    // It updates the Global Odometer and the User's Snapshot before any action.
    modifier updateReward(address _account) {
        // rewardPerTokenStored = rewardPerToken(); // Update global index
        // updatedAt = lastTimeRewardApplicable(); // Update timestamp
        // Cast the uint256 result down to uint192
        rewardPerTokenStored = uint192(rewardPerToken());

        // Cast the uint256 result down to uint32
        updatedAt = uint32(lastTimeRewardApplicable());

        if (_account != address(0)) {
            // Calculate what the user earned since their last interaction
            rewards[_account] = earned(_account);
            // Sync their snapshot to the current global odometer
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
        _;
    }

    // -- VIEWS (READ ONLY) --

    // Returns the lesser of "current time" or "finish time"
    // Prevents calculating rewards after the event has ended.
    function lastTimeRewardApplicable() public view returns (uint256) {
        return _min(finishAt, block.timestamp);
    }

    // Calculates the current reading of the Global Odometer
    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }

        // Formula: OldOdometer + (Rate * TimeDelta * 1e18 / TotalSupply)
        return
            rewardPerTokenStored +
            (rewardRate * (lastTimeRewardApplicable() - updatedAt) * 1e18) /
            totalSupply;
    }

    // Calculates how much a specific user has earned
    function earned(address _account) public view returns (uint256) {
        // Formula: Balance * (CurrentOdometer - UserSnapshot) / 1e18 + PendingRewards
        return
            ((balanceOf[_account] *
                (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18) +
            rewards[_account];
    }

    // Helper for min value
    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }

    // -- USER FUNCTIONS --

    // Stake tokens into the pool
    function stake(
        uint256 _amount
    ) external nonReentrant updateReward(msg.sender) {
        require(_amount > 0, "Cannot stake 0");

        // Transfer tokens from user to contract
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Update state
        balanceOf[msg.sender] += _amount;
        totalSupply += _amount;

        emit Staked(msg.sender, _amount);
    }

    // Withdraw staked tokens
    function withdraw(
        uint256 _amount
    ) public nonReentrant updateReward(msg.sender) {
        require(_amount > 0, "Cannot withdraw 0");
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");

        // Update state
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;

        // Transfer tokens back to user
        stakingToken.safeTransfer(msg.sender, _amount);

        emit Withdrawn(msg.sender, _amount);
    }

    // Claim rewards without withdrawing stake
    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    // Exit: Withdraw all stake + claim all rewards
    function exit() external {
        withdraw(balanceOf[msg.sender]);
        getReward();
    }

    // -- OWNER FUNCTIONS --

    // Set the duration of the rewards (e.g., 7 days = 604800 seconds)
    function setRewardsDuration(uint256 _duration) external onlyOwner {
        require(finishAt < block.timestamp, "Reward duration not finished");
        duration = _duration;
    }

    // Start the Staking Event (Epoch) or Add more rewards to an active one
    function notifyRewardAmount(
        uint256 _amount
    ) external onlyOwner updateReward(address(0)) {
        if (block.timestamp >= finishAt) {
            // If the old event is over, start a fresh one
            rewardRate = _amount / duration;
        } else {
            // If event is running, add new rewards to the remaining time
            uint256 remainingRewards = (finishAt - block.timestamp) *
                rewardRate;
            rewardRate = (_amount + remainingRewards) / duration;
        }

        // Safety check: Ensure rate isn't too high for the balance
        require(rewardRate > 0, "Reward rate too low");
        require(
            rewardRate * duration <= rewardsToken.balanceOf(address(this)),
            "Reward amount > balance"
        );

        // finishAt = block.timestamp + duration;
        // updatedAt = block.timestamp;
        // Cast the calculation result to uint32
        finishAt = uint32(block.timestamp + duration);

        // Cast the current timestamp to uint32
        updatedAt = uint32(block.timestamp);

        emit RewardAdded(_amount);
    }
}
