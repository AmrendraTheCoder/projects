// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IYieldProtocol.sol";

/**
 * @title CompoundAdapter
 * @notice Adapter for Compound V3 (Comet) protocol
 * @dev Simplified implementation for demonstration
 */
contract CompoundAdapter is IYieldProtocol {
    using SafeERC20 for IERC20;

    address public immutable comet;
    IERC20 public immutable stablecoin;

    // Simplified Comet interface
    interface IComet {
        function supply(address asset, uint amount) external;
        function withdraw(address asset, uint amount) external;
        function balanceOf(address account) external view returns (uint256);
        function getSupplyRate(uint utilization) external view returns (uint64);
        function getUtilization() external view returns (uint);
    }

    constructor(address _comet, address _stablecoin) {
        comet = _comet;
        stablecoin = IERC20(_stablecoin);
    }

    function deposit(uint256 amount) external override returns (uint256) {
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        stablecoin.approve(comet, amount);
        
        IComet(comet).supply(address(stablecoin), amount);
        
        return amount;
    }

    function withdraw(uint256 amount) external override returns (uint256) {
        IComet(comet).withdraw(address(stablecoin), amount);
        stablecoin.safeTransfer(msg.sender, amount);
        return amount;
    }

    function getAPY() external view override returns (uint256) {
        uint utilization = IComet(comet).getUtilization();
        uint64 supplyRate = IComet(comet).getSupplyRate(utilization);
        
        // Convert to basis points (assuming rate is in per second)
        return uint256(supplyRate) * 365 days / 1e14; // Approximate conversion
    }

    function balanceOf(address user) external view override returns (uint256) {
        return IComet(comet).balanceOf(user);
    }

    function getTVL() external view override returns (uint256) {
        return stablecoin.balanceOf(comet);
    }
}

