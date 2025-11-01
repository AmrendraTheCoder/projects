# 🏗️ Architecture Documentation

## System Overview

Adaptive Yield Router is a sophisticated DeFi protocol designed to maximize yields on stablecoins through automated rebalancing across multiple lending protocols.

## Core Components

### 1. Smart Contract Layer

#### YieldVault.sol
**Purpose**: Central vault for user deposits and fund management

**Key Functions**:
- `deposit(uint256 amount)` - Accept user deposits
- `withdraw(uint256 shares)` - Allow withdrawals based on shares
- `setGuardrails(...)` - User risk parameter configuration
- `emergencyWithdraw()` - Emergency fund recovery
- `whitelistProtocol(address, bool)` - Admin protocol management

**State Management**:
```solidity
struct UserDeposit {
    uint256 amount;
    uint256 shares;
    uint256 depositTime;
    uint256 lastRebalanceTime;
}

struct UserGuardrails {
    uint256 minAPY;
    uint256 maxSlippage;
    uint256 maxGasPrice;
    bool isActive;
}
```

**Security Features**:
- ReentrancyGuard on all external functions
- SafeERC20 for token operations
- Minimum deposit requirements
- Mandatory guardrail setup

#### YieldRouter.sol
**Purpose**: Routing logic and rebalancing orchestration

**Key Functions**:
- `checkRebalance()` - Evaluate rebalancing opportunities
- `executeRebalance(...)` - Perform fund reallocation
- `getBestProtocol()` - Identify highest APY protocol
- `addProtocol(...)` - Add new yield sources
- `updateAPY(...)` - Refresh protocol rates

**Rebalancing Logic**:
```
1. Check time since last rebalance (>= 7 days)
2. Find current allocation and best available protocol
3. Calculate improvement percentage
4. Estimate gas costs
5. Only proceed if: improvement > 0.5% AND profit > 2x gas cost
6. Execute withdrawal → deposit transaction
```

**Gas Optimization**:
- Estimated gas: ~300,000 units per rebalance
- Minimum improvement: 0.5% (50 basis points)
- Profit buffer: 2x gas costs

#### AutomationKeeper.sol
**Purpose**: Chainlink Automation integration for decentralized execution

**Key Functions**:
- `checkUpkeep(bytes)` - Called by Chainlink nodes to check conditions
- `performUpkeep(bytes)` - Execute rebalancing when conditions met
- `setPaused(bool)` - Emergency pause mechanism

**Automation Flow**:
```
Chainlink Node → checkUpkeep() → conditions met?
    ↓ yes
performUpkeep() → router.executeRebalance()
    ↓
Update metrics & emit events
```

### 2. Protocol Adapters

Each yield protocol has a dedicated adapter implementing `IYieldProtocol`:

```solidity
interface IYieldProtocol {
    function deposit(uint256 amount) external returns (uint256 shares);
    function withdraw(uint256 amount) external returns (uint256 withdrawn);
    function getAPY() external view returns (uint256 apy);
    function balanceOf(address user) external view returns (uint256 balance);
    function getTVL() external view returns (uint256 tvl);
}
```

#### Current Adapters

**AaveAdapter.sol**
- Integrates with Aave V3 lending pool
- Converts APY from ray (27 decimals) to basis points
- Handles aToken receipt and redemption

**CompoundAdapter.sol**
- Integrates with Compound V3 (Comet)
- Calculates supply rate based on utilization
- Manages cToken interactions

### 3. Frontend Architecture

#### Technology Stack
- **React 18** - UI framework
- **Web3/Ethers.js** - Blockchain interaction
- **CSS3** - Styling and animations

#### Component Structure

```
App.js (Main container)
├── Header (Wallet connection)
├── Dashboard (User statistics)
│   ├── Balance Card
│   ├── Position Card
│   └── Returns Card
├── ProtocolsList (Available protocols)
└── ActionsPanel (User interactions)
    ├── Deposit Section
    ├── Withdraw Section
    ├── Guardrails Configuration
    └── Emergency Actions
```

#### State Management
```javascript
{
  account: string,           // Connected wallet address
  isConnected: boolean,      // Connection status
  userBalance: string,       // Available USDC
  userDeposit: string,       // Deposited amount
  estimatedYield: string,    // Annual projected yield
}
```

## Data Flow

### Deposit Flow
```
1. User enters amount in frontend
2. Frontend requests token approval
3. User approves in MetaMask
4. Frontend calls vault.deposit(amount)
5. Vault transfers tokens from user
6. Vault calculates and mints shares
7. Vault updates state
8. Frontend updates display
```

### Rebalancing Flow
```
1. Weekly: Chainlink node calls checkUpkeep()
2. Keeper checks:
   - Time elapsed >= 7 days?
   - Better protocol available?
   - Improvement >= 0.5%?
   - Profit > 2x gas cost?
3. If all true: performUpkeep() executes
4. Router withdraws from current protocol
5. Router deposits to best protocol
6. Events emitted for tracking
7. Frontend displays updated allocation
```

### Withdrawal Flow
```
1. User enters withdrawal amount
2. Frontend calls vault.withdraw(shares)
3. Vault calculates token amount
4. Vault burns user shares
5. Vault transfers tokens to user
6. Frontend updates balances
```

## Security Model

### Access Control

```
Owner-Only Functions:
- whitelistProtocol()
- addProtocol()
- setRebalanceInterval()
- setPaused()

User Functions:
- deposit()
- withdraw()
- setGuardrails()
- emergencyWithdraw()

View Functions:
- Public read access to state
```

### Risk Mitigation

1. **Protocol Whitelisting**
   - Only admin-approved protocols
   - Thorough vetting before addition
   - Can blacklist if compromised

2. **User Guardrails**
   - Minimum APY requirements
   - Slippage protection
   - Gas price limits
   - Per-user customization

3. **Emergency Mechanisms**
   - Emergency withdraw function
   - Keeper pause functionality
   - Owner emergency controls

4. **Gas Safety**
   - Only rebalance when profitable
   - Minimum improvement thresholds
   - Gas estimation before execution

## Economic Model

### Fee Structure (Future Implementation)
```
Performance Fee: 10% of yield
Management Fee: 1% annually
Gas Subsidy: Protocol may subsidize gas for larger deposits
```

### Share Calculation
```
First Deposit: shares = amount
Subsequent Deposits: shares = (amount * totalShares) / totalDeposits

Withdrawal: amount = (shares * totalDeposits) / totalShares
```

### Profitability Calculation
```
expectedProfit = depositAmount * apyImprovement / 100
gasCost = estimatedGas * gasPrice * ethPrice / usdcPrice
rebalanceIf: expectedProfit > (gasCost * 2)
```

## Integration Points

### Chainlink Integration
- **Automation**: Weekly upkeep checks
- **Price Feeds** (future): ETH/USD for gas calculations
- **VRF** (future): Random selection for equal APY protocols

### Protocol Integrations

#### Aave V3
- Pool address: Mainnet specific
- Requires: Asset address, aToken address
- APY source: `getReserveData()` → currentLiquidityRate

#### Compound V3
- Comet address: Per market
- Requires: Base asset address
- APY source: `getSupplyRate(utilization)`

### Future Integrations
- Yearn Finance vaults
- Convex Finance
- Curve Finance
- Beefy Finance
- Stargate

## Deployment Strategy

### Testnet Deployment
1. Deploy contracts to Sepolia
2. Deploy mock protocols for testing
3. Register Chainlink Automation upkeep
4. Fund keeper with LINK
5. Test full flow end-to-end

### Mainnet Deployment
1. Security audit completion
2. Deploy contracts with Timelock
3. Verify contracts on Etherscan
4. Initialize with conservative limits
5. Gradual protocol whitelisting
6. Monitored beta period
7. Full public launch

## Monitoring & Analytics

### Key Metrics
- Total Value Locked (TVL)
- Average APY
- Rebalancing frequency
- Gas costs per rebalance
- User growth rate
- Protocol distribution

### Event Logging
```solidity
event Deposited(address indexed user, uint256 amount, uint256 shares);
event Withdrawn(address indexed user, uint256 amount, uint256 shares);
event Rebalanced(address from, address to, uint256 amount, uint256 gas);
event GuardrailsUpdated(address user, ...params);
event ProtocolWhitelisted(address protocol, bool status);
```

### Off-Chain Monitoring
- Subgraph for historical data
- Alert system for anomalies
- Dashboard for analytics
- API for integrations

## Scalability Considerations

### Current Limitations
- Single chain (Ethereum)
- Limited to stablecoins
- Manual APY updates
- Gas costs on L1

### Future Improvements
1. **Multi-Chain**
   - Deploy on L2s (Arbitrum, Optimism)
   - Cross-chain messaging (LayerZero)
   - Chain-specific optimization

2. **Asset Expansion**
   - Support multiple stablecoins
   - LP token optimization
   - Interest-bearing asset strategies

3. **Automation Enhancement**
   - On-chain APY oracles
   - More frequent checks on L2
   - Dynamic rebalancing thresholds

4. **Gas Optimization**
   - Batch user deposits
   - Flash loans for rebalancing
   - Meta-transactions for users

## Testing Strategy

### Unit Tests
- Individual function testing
- Edge case coverage
- Negative test cases
- Gas consumption tests

### Integration Tests
- Multi-contract interactions
- Full deposit-rebalance-withdraw flow
- Keeper automation simulation
- Multiple user scenarios

### Security Tests
- Reentrancy attack vectors
- Integer overflow/underflow
- Access control bypasses
- Economic exploits

## Conclusion

This architecture provides a robust, secure, and scalable foundation for automated yield optimization. The modular design allows easy protocol integration, while comprehensive security measures protect user funds. The system balances automation with user control through customizable guardrails.

