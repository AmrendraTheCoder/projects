// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IYieldProtocol
 * @notice Interface for yield protocol adapters
 * @dev All protocol adapters must implement this interface
 */
interface IYieldProtocol {
    /**
     * @notice Deposit tokens into the yield protocol
     * @param amount Amount to deposit
     * @return shares Number of shares/tokens received
     */
    function deposit(uint256 amount) external returns (uint256 shares);

    /**
     * @notice Withdraw tokens from the yield protocol
     * @param amount Amount to withdraw
     * @return withdrawn Actual amount withdrawn
     */
    function withdraw(uint256 amount) external returns (uint256 withdrawn);

    /**
     * @notice Get current APY of the protocol
     * @return apy Current APY in basis points
     */
    function getAPY() external view returns (uint256 apy);

    /**
     * @notice Get user's balance in the protocol
     * @param user User address
     * @return balance User's current balance
     */
    function balanceOf(address user) external view returns (uint256 balance);

    /**
     * @notice Get total value locked in the protocol
     * @return tvl Total value locked
     */
    function getTVL() external view returns (uint256 tvl);
}

