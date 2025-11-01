# 🚀 Adaptive Yield Router

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)
![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)

**Automated yield optimization protocol that routes stablecoins to the best APY with user-defined guardrails**

## 🎯 Overview

Adaptive Yield Router is a DeFi protocol that automatically moves your idle stablecoins to the best available yield opportunities across multiple lending protocols. Users set their risk parameters once (minimum APY, maximum slippage, gas ceiling), and the system handles weekly rebalancing checks to optimize returns while respecting those guardrails.

### Key Features

- ✅ **Automatic Rebalancing** - Weekly checks for better yield opportunities
- ✅ **User Guardrails** - Set your own risk parameters (min APY, slippage, gas limits)
- ✅ **Multi-Protocol Support** - Integrates with Aave, Compound, Yearn, and more
- ✅ **Gas Optimization** - Only rebalances when profit exceeds gas costs
- ✅ **Emergency Withdraw** - Instant access to your funds anytime
- ✅ **Chainlink Automation** - Decentralized keeper network for reliable rebalancing
- ✅ **Risk Scoring** - Display protocol risk metrics and TVL

## 🏗️ Architecture

### Smart Contracts

```
contracts/
├── YieldVault.sol          # Main vault holding user deposits
├── YieldRouter.sol         # Routing logic and rebalancing
├── AutomationKeeper.sol    # Chainlink Automation integration
├── MockStablecoin.sol      # Mock USDC for testing
├── interfaces/
│   ├── IYieldProtocol.sol  # Standard interface for adapters
│   └── IAavePool.sol       # Aave V3 interface
└── integrations/
    ├── AaveAdapter.sol     # Aave V3 adapter
    └── CompoundAdapter.sol # Compound V3 adapter
```

### Component Breakdown

#### 1. YieldVault
- Holds user stablecoins
- Tracks deposits and shares
- Manages user guardrails
- Handles deposits/withdrawals
- Emergency withdraw functionality

#### 2. YieldRouter
- Finds best APY across protocols
- Checks rebalancing conditions
- Executes rebalancing transactions
- Manages protocol whitelist
- Gas cost estimation

#### 3. AutomationKeeper
- Chainlink Automation compatible
- Performs weekly upkeep checks
- Executes automatic rebalancing
- Owner-controlled pause mechanism

#### 4. Protocol Adapters
- Standardized interface for all protocols
- Protocol-specific logic encapsulation
- Easy to add new protocols

## 📋 Prerequisites

- Node.js v18+ and npm
- MetaMask or another Web3 wallet
- Git

## 🚀 Getting Started

### 1. Clone and Setup

```bash
cd /Users/amrendravikramsingh/Desktop/projects/web3Project

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Network RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Private key for deployment
PRIVATE_KEY=your_private_key_here

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Gas Reporter
REPORT_GAS=true
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Run Tests

```bash
npx hardhat test
```

For detailed gas reporting:

```bash
REPORT_GAS=true npx hardhat test
```

### 5. Deploy to Local Network

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### 6. Deploy to Testnet (Sepolia)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 7. Run Frontend

```bash
cd frontend
npm start
```

The frontend will open at `http://localhost:3000`

## 📝 Usage Guide

### For Users

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve MetaMask connection

2. **Set Guardrails**
   - Minimum APY: Lowest acceptable yield (e.g., 3%)
   - Max Slippage: Maximum acceptable slippage (e.g., 0.5%)
   - Max Gas: Highest gas price you'll pay (e.g., 50 gwei)

3. **Deposit Stablecoins**
   - Enter amount (minimum 10 USDC)
   - Approve token spending
   - Confirm deposit transaction

4. **Automated Optimization**
   - System checks weekly for better yields
   - Automatically rebalances if:
     - Better APY available (>0.5% improvement)
     - Gas costs don't eat profits
     - All guardrails satisfied

5. **Withdraw Anytime**
   - Enter withdrawal amount
   - Confirm transaction
   - Receive funds + earned yield

### For Developers

#### Adding a New Protocol

1. Create adapter contract implementing `IYieldProtocol`:

```solidity
contract NewProtocolAdapter is IYieldProtocol {
    function deposit(uint256 amount) external override returns (uint256) {
        // Protocol-specific deposit logic
    }
    
    function withdraw(uint256 amount) external override returns (uint256) {
        // Protocol-specific withdrawal logic
    }
    
    function getAPY() external view override returns (uint256) {
        // Return current APY in basis points
    }
    
    // ... implement other interface functions
}
```

2. Deploy adapter
3. Whitelist in YieldRouter
4. Add to vault's approved protocols

#### Interacting with Contracts

```javascript
const { ethers } = require("hardhat");

// Get contracts
const vault = await ethers.getContractAt("YieldVault", VAULT_ADDRESS);
const router = await ethers.getContractAt("YieldRouter", ROUTER_ADDRESS);

// Set guardrails
await vault.setGuardrails(
    500,  // 5% min APY
    100,  // 1% max slippage  
    50    // 50 gwei max gas
);

// Deposit
const amount = ethers.parseUnits("1000", 6); // 1000 USDC
await stablecoin.approve(VAULT_ADDRESS, amount);
await vault.deposit(amount);

// Check best protocol
const [bestProtocol, bestAPY] = await router.getBestProtocol();
console.log(`Best protocol: ${bestProtocol}, APY: ${bestAPY / 100}%`);
```

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Specific Test File

```bash
npx hardhat test test/YieldVault.test.js
```

### Test Coverage

```bash
npx hardhat coverage
```

### Test Structure

- `test/YieldVault.test.js` - Vault functionality tests
- `test/YieldRouter.test.js` - Router and rebalancing tests
- `test/AutomationKeeper.test.js` - Automation keeper tests

## 🔐 Security Considerations

### Smart Contract Security

- ✅ Reentrancy guards on all external functions
- ✅ SafeERC20 for token transfers
- ✅ Ownable pattern for admin functions
- ✅ Emergency withdraw mechanism
- ✅ Protocol whitelist system
- ✅ Input validation and bounds checking

### Recommended Audits

Before mainnet deployment:
- [ ] Internal security review
- [ ] External smart contract audit
- [ ] Economic model review
- [ ] Integration testing with real protocols
- [ ] Bug bounty program

### Known Limitations

1. **Gas Costs** - Small deposits may not be profitable due to gas costs
2. **Protocol Risk** - Dependent on underlying protocol security
3. **Slippage** - Large rebalances may experience slippage
4. **Keeper Reliability** - Depends on Chainlink Automation uptime

## 📊 Gas Optimization

The protocol includes several gas optimizations:

- Batch processing of multiple user deposits
- Only rebalances when profit > 2x gas cost
- Efficient storage patterns
- Minimal external calls

## 🛣️ Roadmap

### Phase 1: MVP (Current)
- [x] Core vault and router contracts
- [x] Basic protocol adapters (Aave, Compound)
- [x] Chainlink Automation integration
- [x] Frontend dashboard
- [x] Test suite

### Phase 2: Enhancement
- [ ] Risk scoring system
- [ ] Historical performance tracking
- [ ] Multiple stablecoin support
- [ ] Batch deposits for gas savings
- [ ] Advanced analytics dashboard

### Phase 3: Expansion
- [ ] Multi-chain deployment (Polygon, Arbitrum, Optimism)
- [ ] More protocol integrations
- [ ] Social features (copy strategies)
- [ ] Insurance integration
- [ ] DAO governance

### Phase 4: Advanced Features
- [ ] LP token yield optimization
- [ ] Automated tax reporting
- [ ] Mobile app
- [ ] API for developers

## 📈 Performance Metrics

Track these metrics for optimization:

- **Average APY**: Mean yield across all protocols
- **Rebalancing Frequency**: How often rebalances occur
- **Gas Efficiency**: Gas cost vs profit ratio
- **User Satisfaction**: Withdrawals vs deposits
- **Protocol Diversity**: Distribution across protocols

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Solidity style guide
- Write tests for new features
- Update documentation
- Run linter before committing
- Keep gas costs in mind

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Chainlink for automation infrastructure
- Aave, Compound, Yearn for yield protocols
- Hardhat for development framework

## 📞 Support

- **Discord**: [Join our community](#)
- **Twitter**: [@AdaptiveYield](#)
- **Email**: support@adaptiveyield.xyz
- **Documentation**: [docs.adaptiveyield.xyz](#)

## 🎓 Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Chainlink Automation](https://docs.chain.link/chainlink-automation)
- [Aave V3 Docs](https://docs.aave.com/)
- [Compound V3 Docs](https://docs.compound.finance/)

## ⚠️ Disclaimer

This software is provided "as is", without warranty of any kind. Use at your own risk. This is experimental DeFi software and has not been audited. Never invest more than you can afford to lose.

---

**Built with ❤️ for the DeFi community**

*Hackathon Project - Adaptive Yield Router*

