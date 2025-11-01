// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IYieldProtocol.sol";

/**
 * @title YieldVault
 * @notice Main vault contract that holds user stablecoins and routes them to optimal yield sources
 * @dev Implements user guardrails, position tracking, and automated rebalancing
 */
contract YieldVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Structs
    struct UserDeposit {
        uint256 amount;
        uint256 shares;
        uint256 depositTime;
        uint256 lastRebalanceTime;
    }

    struct UserGuardrails {
        uint256 minAPY;              // Minimum acceptable APY (in basis points, e.g., 500 = 5%)
        uint256 maxSlippage;         // Max slippage tolerance (in basis points)
        uint256 maxGasPrice;         // Maximum gas price willing to pay
        bool isActive;
    }

    struct ProtocolAllocation {
        address protocol;
        uint256 amount;
        uint256 lastAPY;
        bool isActive;
    }

    // State variables
    IERC20 public immutable stablecoin;
    uint256 public totalDeposits;
    uint256 public totalShares;
    
    // Mappings
    mapping(address => UserDeposit) public userDeposits;
    mapping(address => UserGuardrails) public userGuardrails;
    mapping(address => bool) public whitelistedProtocols;
    mapping(address => ProtocolAllocation) public protocolAllocations;
    
    // Array to track all protocols
    address[] public activeProtocols;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_DEPOSIT = 10 * 10**6; // 10 USDC minimum
    uint256 public constant REBALANCE_THRESHOLD = 50; // 0.5% improvement needed
    
    // Events
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event Rebalanced(address indexed fromProtocol, address indexed toProtocol, uint256 amount);
    event GuardrailsUpdated(address indexed user, uint256 minAPY, uint256 maxSlippage, uint256 maxGasPrice);
    event ProtocolWhitelisted(address indexed protocol, bool status);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(address _stablecoin) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        stablecoin = IERC20(_stablecoin);
    }

    /**
     * @notice Deposit stablecoins into the vault
     * @param amount Amount of stablecoins to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount >= MIN_DEPOSIT, "Amount below minimum");
        require(userGuardrails[msg.sender].isActive, "Set guardrails first");

        // Calculate shares
        uint256 shares = totalShares == 0 ? amount : (amount * totalShares) / totalDeposits;

        // Update state
        userDeposits[msg.sender].amount += amount;
        userDeposits[msg.sender].shares += shares;
        userDeposits[msg.sender].depositTime = block.timestamp;
        totalDeposits += amount;
        totalShares += shares;

        // Transfer tokens
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, shares);
    }

    /**
     * @notice Withdraw stablecoins from the vault
     * @param shares Number of shares to redeem
     */
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "Invalid shares amount");
        require(userDeposits[msg.sender].shares >= shares, "Insufficient shares");

        // Calculate withdrawal amount
        uint256 amount = (shares * totalDeposits) / totalShares;

        // Update state
        userDeposits[msg.sender].amount -= amount;
        userDeposits[msg.sender].shares -= shares;
        totalDeposits -= amount;
        totalShares -= shares;

        // Transfer tokens
        stablecoin.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, shares);
    }

    /**
     * @notice Set user's investment guardrails
     * @param minAPY Minimum acceptable APY in basis points
     * @param maxSlippage Maximum slippage tolerance in basis points
     * @param maxGasPrice Maximum gas price in gwei
     */
    function setGuardrails(
        uint256 minAPY,
        uint256 maxSlippage,
        uint256 maxGasPrice
    ) external {
        require(minAPY <= BASIS_POINTS, "Invalid minAPY");
        require(maxSlippage <= BASIS_POINTS, "Invalid slippage");

        userGuardrails[msg.sender] = UserGuardrails({
            minAPY: minAPY,
            maxSlippage: maxSlippage,
            maxGasPrice: maxGasPrice,
            isActive: true
        });

        emit GuardrailsUpdated(msg.sender, minAPY, maxSlippage, maxGasPrice);
    }

    /**
     * @notice Emergency withdraw for users in case of protocol issues
     */
    function emergencyWithdraw() external nonReentrant {
        uint256 shares = userDeposits[msg.sender].shares;
        require(shares > 0, "No deposits");

        uint256 amount = (shares * totalDeposits) / totalShares;

        // Reset user state
        delete userDeposits[msg.sender];
        totalDeposits -= amount;
        totalShares -= shares;

        // Transfer tokens
        stablecoin.safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(msg.sender, amount);
    }

    /**
     * @notice Whitelist a yield protocol
     * @param protocol Address of the protocol adapter
     * @param status Whitelist status
     */
    function whitelistProtocol(address protocol, bool status) external onlyOwner {
        whitelistedProtocols[protocol] = status;
        
        if (status && !_isInActiveProtocols(protocol)) {
            activeProtocols.push(protocol);
        }

        emit ProtocolWhitelisted(protocol, status);
    }

    /**
     * @notice Get user's current position value
     * @param user User address
     * @return Current value of user's position
     */
    function getUserValue(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (userDeposits[user].shares * totalDeposits) / totalShares;
    }

    /**
     * @notice Get all active protocols
     * @return Array of active protocol addresses
     */
    function getActiveProtocols() external view returns (address[] memory) {
        return activeProtocols;
    }

    /**
     * @notice Check if protocol is in active list
     */
    function _isInActiveProtocols(address protocol) private view returns (bool) {
        for (uint256 i = 0; i < activeProtocols.length; i++) {
            if (activeProtocols[i] == protocol) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Receive function to accept ETH for gas refunds
     */
    receive() external payable {}
}

