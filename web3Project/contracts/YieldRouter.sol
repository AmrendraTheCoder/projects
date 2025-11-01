// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IYieldProtocol.sol";
import "./YieldVault.sol";

/**
 * @title YieldRouter
 * @notice Handles routing logic and rebalancing between different yield protocols
 * @dev Integrates with Chainlink Automation for periodic checks
 */
contract YieldRouter is Ownable {
    using SafeERC20 for IERC20;

    // Structs
    struct ProtocolInfo {
        address adapter;
        uint256 currentAPY;
        uint256 tvl;
        uint256 lastUpdate;
        bool isActive;
    }

    struct RebalanceParams {
        address fromProtocol;
        address toProtocol;
        uint256 amount;
        uint256 minAmountOut;
        uint256 estimatedGas;
    }

    // State variables
    YieldVault public immutable vault;
    IERC20 public immutable stablecoin;
    
    mapping(address => ProtocolInfo) public protocols;
    address[] public protocolList;
    
    uint256 public constant GAS_BUFFER = 50000; // Extra gas for safety
    uint256 public constant MIN_IMPROVEMENT = 50; // 0.5% minimum improvement
    uint256 public lastRebalanceTime;
    uint256 public rebalanceInterval = 7 days;
    
    // Events
    event ProtocolAdded(address indexed protocol, address adapter);
    event ProtocolUpdated(address indexed protocol, uint256 newAPY);
    event Rebalanced(
        address indexed fromProtocol,
        address indexed toProtocol,
        uint256 amount,
        uint256 gasUsed
    );
    event APYUpdated(address indexed protocol, uint256 oldAPY, uint256 newAPY);

    constructor(address _vault, address _stablecoin) Ownable(msg.sender) {
        vault = YieldVault(_vault);
        stablecoin = IERC20(_stablecoin);
    }

    /**
     * @notice Add a new protocol to the router
     * @param protocol Protocol identifier
     * @param adapter Adapter contract address
     */
    function addProtocol(address protocol, address adapter) external onlyOwner {
        require(adapter != address(0), "Invalid adapter");
        require(!protocols[protocol].isActive, "Protocol already exists");

        protocols[protocol] = ProtocolInfo({
            adapter: adapter,
            currentAPY: 0,
            tvl: 0,
            lastUpdate: block.timestamp,
            isActive: true
        });

        protocolList.push(protocol);
        emit ProtocolAdded(protocol, adapter);
    }

    /**
     * @notice Update APY for a protocol
     * @param protocol Protocol address
     * @param newAPY New APY in basis points
     */
    function updateAPY(address protocol, uint256 newAPY) external {
        require(protocols[protocol].isActive, "Protocol not active");
        
        uint256 oldAPY = protocols[protocol].currentAPY;
        protocols[protocol].currentAPY = newAPY;
        protocols[protocol].lastUpdate = block.timestamp;

        emit APYUpdated(protocol, oldAPY, newAPY);
    }

    /**
     * @notice Check if rebalancing is needed and profitable
     * @return needsRebalance Whether rebalancing should occur
     * @return params Rebalance parameters if needed
     */
    function checkRebalance() external view returns (bool needsRebalance, RebalanceParams memory params) {
        // Check if enough time has passed
        if (block.timestamp < lastRebalanceTime + rebalanceInterval) {
            return (false, params);
        }

        // Find current best protocol
        (address bestProtocol, uint256 bestAPY) = getBestProtocol();
        
        // Find current allocation
        (address currentProtocol, uint256 currentAmount, uint256 currentAPY) = getCurrentAllocation();
        
        if (currentProtocol == address(0) || currentAmount == 0) {
            return (false, params);
        }

        // Calculate improvement
        if (bestAPY <= currentAPY) {
            return (false, params);
        }

        uint256 improvement = ((bestAPY - currentAPY) * 10000) / currentAPY;
        
        if (improvement < MIN_IMPROVEMENT) {
            return (false, params);
        }

        // Estimate gas cost
        uint256 estimatedGas = estimateRebalanceGas();
        uint256 gasCost = estimatedGas * tx.gasprice;
        
        // Calculate expected profit
        uint256 expectedProfit = (currentAmount * improvement) / 10000;
        
        // Only rebalance if profit > gas cost
        if (expectedProfit <= gasCost * 2) { // 2x buffer
            return (false, params);
        }

        params = RebalanceParams({
            fromProtocol: currentProtocol,
            toProtocol: bestProtocol,
            amount: currentAmount,
            minAmountOut: currentAmount * 9950 / 10000, // 0.5% slippage
            estimatedGas: estimatedGas
        });

        return (true, params);
    }

    /**
     * @notice Execute rebalancing
     * @param params Rebalance parameters
     */
    function executeRebalance(RebalanceParams memory params) external {
        uint256 startGas = gasleft();
        
        require(protocols[params.fromProtocol].isActive, "From protocol not active");
        require(protocols[params.toProtocol].isActive, "To protocol not active");

        // Withdraw from current protocol
        IYieldProtocol fromAdapter = IYieldProtocol(protocols[params.fromProtocol].adapter);
        uint256 withdrawn = fromAdapter.withdraw(params.amount);
        
        require(withdrawn >= params.minAmountOut, "Slippage too high");

        // Deposit to new protocol
        IYieldProtocol toAdapter = IYieldProtocol(protocols[params.toProtocol].adapter);
        stablecoin.approve(protocols[params.toProtocol].adapter, withdrawn);
        toAdapter.deposit(withdrawn);

        lastRebalanceTime = block.timestamp;
        uint256 gasUsed = startGas - gasleft();

        emit Rebalanced(params.fromProtocol, params.toProtocol, withdrawn, gasUsed);
    }

    /**
     * @notice Get the protocol with highest APY
     * @return protocol Address of best protocol
     * @return apy Highest APY
     */
    function getBestProtocol() public view returns (address protocol, uint256 apy) {
        uint256 bestAPY = 0;
        address bestProtocol = address(0);

        for (uint256 i = 0; i < protocolList.length; i++) {
            address proto = protocolList[i];
            if (protocols[proto].isActive && protocols[proto].currentAPY > bestAPY) {
                bestAPY = protocols[proto].currentAPY;
                bestProtocol = proto;
            }
        }

        return (bestProtocol, bestAPY);
    }

    /**
     * @notice Get current allocation info
     * @return protocol Current protocol
     * @return amount Amount allocated
     * @return apy Current APY
     */
    function getCurrentAllocation() public view returns (
        address protocol,
        uint256 amount,
        uint256 apy
    ) {
        // Simplified - in production, track actual allocations
        address[] memory activeProtocols = vault.getActiveProtocols();
        if (activeProtocols.length > 0) {
            protocol = activeProtocols[0];
            amount = stablecoin.balanceOf(address(vault));
            apy = protocols[protocol].currentAPY;
        }
    }

    /**
     * @notice Estimate gas for rebalancing
     * @return Estimated gas units
     */
    function estimateRebalanceGas() public pure returns (uint256) {
        return 300000 + GAS_BUFFER; // Rough estimate
    }

    /**
     * @notice Get all protocols with their info
     * @return Array of protocol addresses and their info
     */
    function getAllProtocols() external view returns (address[] memory, ProtocolInfo[] memory) {
        ProtocolInfo[] memory infos = new ProtocolInfo[](protocolList.length);
        
        for (uint256 i = 0; i < protocolList.length; i++) {
            infos[i] = protocols[protocolList[i]];
        }
        
        return (protocolList, infos);
    }

    /**
     * @notice Update rebalance interval
     * @param newInterval New interval in seconds
     */
    function setRebalanceInterval(uint256 newInterval) external onlyOwner {
        require(newInterval >= 1 days, "Interval too short");
        rebalanceInterval = newInterval;
    }
}

