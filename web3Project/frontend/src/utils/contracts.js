// Contract addresses (update after deployment)
export const CONTRACTS = {
  VAULT: process.env.REACT_APP_VAULT_ADDRESS || '',
  ROUTER: process.env.REACT_APP_ROUTER_ADDRESS || '',
  KEEPER: process.env.REACT_APP_KEEPER_ADDRESS || '',
  STABLECOIN: process.env.REACT_APP_STABLECOIN_ADDRESS || '',
};

// ABI files would go here
export const VAULT_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 shares) external",
  "function setGuardrails(uint256 minAPY, uint256 maxSlippage, uint256 maxGasPrice) external",
  "function emergencyWithdraw() external",
  "function getUserValue(address user) external view returns (uint256)",
  "function userDeposits(address user) external view returns (uint256 amount, uint256 shares, uint256 depositTime, uint256 lastRebalanceTime)",
];

export const ROUTER_ABI = [
  "function getBestProtocol() external view returns (address protocol, uint256 apy)",
  "function getAllProtocols() external view returns (address[] memory, tuple(address adapter, uint256 currentAPY, uint256 tvl, uint256 lastUpdate, bool isActive)[] memory)",
];

export const STABLECOIN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

