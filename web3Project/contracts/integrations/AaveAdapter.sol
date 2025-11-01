// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IYieldProtocol.sol";
import "../interfaces/IAavePool.sol";

/**
 * @title AaveAdapter
 * @notice Adapter for Aave V3 lending protocol
 */
contract AaveAdapter is IYieldProtocol {
    using SafeERC20 for IERC20;

    IAavePool public immutable aavePool;
    IERC20 public immutable stablecoin;
    IERC20 public immutable aToken;

    constructor(address _aavePool, address _stablecoin, address _aToken) {
        aavePool = IAavePool(_aavePool);
        stablecoin = IERC20(_stablecoin);
        aToken = IERC20(_aToken);
    }

    function deposit(uint256 amount) external override returns (uint256) {
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        stablecoin.approve(address(aavePool), amount);
        
        aavePool.supply(address(stablecoin), amount, address(this), 0);
        
        return amount;
    }

    function withdraw(uint256 amount) external override returns (uint256) {
        return aavePool.withdraw(address(stablecoin), amount, msg.sender);
    }

    function getAPY() external view override returns (uint256) {
        (, , uint128 currentLiquidityRate, , , , , , , , , , , , ) = 
            aavePool.getReserveData(address(stablecoin));
        
        // Convert Aave rate to basis points
        return uint256(currentLiquidityRate) / 1e23; // Aave uses ray (27 decimals)
    }

    function balanceOf(address user) external view override returns (uint256) {
        return aToken.balanceOf(user);
    }

    function getTVL() external view override returns (uint256) {
        return stablecoin.balanceOf(address(aavePool));
    }
}

