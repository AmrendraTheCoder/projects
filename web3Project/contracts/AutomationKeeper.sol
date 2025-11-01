// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./YieldRouter.sol";

/**
 * @title AutomationKeeper
 * @notice Chainlink Automation compatible keeper for automatic rebalancing
 * @dev Checks rebalancing conditions and executes when profitable
 */
contract AutomationKeeper is AutomationCompatibleInterface {
    YieldRouter public immutable router;
    address public immutable owner;
    
    uint256 public lastUpkeepTime;
    uint256 public upkeepCount;
    bool public paused;

    event UpkeepPerformed(uint256 indexed upkeepId, uint256 gasUsed);
    event KeeperPaused(bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _router) {
        router = YieldRouter(_router);
        owner = msg.sender;
        lastUpkeepTime = block.timestamp;
    }

    /**
     * @notice Check if upkeep is needed
     * @dev Called by Chainlink Automation nodes
     * @return upkeepNeeded Whether upkeep should be performed
     * @return performData Encoded data for performUpkeep
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        if (paused) {
            return (false, "");
        }

        (bool needsRebalance, YieldRouter.RebalanceParams memory params) = router.checkRebalance();
        
        if (needsRebalance) {
            performData = abi.encode(params);
            return (true, performData);
        }

        return (false, "");
    }

    /**
     * @notice Perform the upkeep
     * @dev Called by Chainlink Automation nodes when upkeep is needed
     * @param performData Encoded rebalance parameters
     */
    function performUpkeep(bytes calldata performData) external override {
        require(!paused, "Keeper paused");
        
        uint256 startGas = gasleft();

        // Decode parameters
        YieldRouter.RebalanceParams memory params = abi.decode(
            performData,
            (YieldRouter.RebalanceParams)
        );

        // Execute rebalance
        router.executeRebalance(params);

        lastUpkeepTime = block.timestamp;
        upkeepCount++;

        uint256 gasUsed = startGas - gasleft();
        emit UpkeepPerformed(upkeepCount, gasUsed);
    }

    /**
     * @notice Pause/unpause the keeper
     * @param _paused Pause status
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit KeeperPaused(_paused);
    }

    /**
     * @notice Get keeper statistics
     * @return Last upkeep time and total count
     */
    function getStats() external view returns (uint256, uint256) {
        return (lastUpkeepTime, upkeepCount);
    }
}

