import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ActionsPanel from './components/ActionsPanel';
import ProtocolsList from './components/ProtocolsList';

function App() {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userBalance, setUserBalance] = useState('0');
  const [userDeposit, setUserDeposit] = useState('0');
  const [estimatedYield, setEstimatedYield] = useState('0');

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Mock data for demonstration
        setUserBalance('5000');
        setUserDeposit('2500');
        setEstimatedYield('125');
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('Please install MetaMask or another Web3 wallet!');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setUserBalance('0');
    setUserDeposit('0');
    setEstimatedYield('0');
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });
    }
  }, []);

  return (
    <div className="app">
      <div className="header">
        <h1>🚀 Adaptive Yield Router</h1>
        <p>Automated yield optimization for your stablecoins</p>
        
        {!isConnected ? (
          <button className="connect-button" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
            </p>
            <button 
              className="connect-button" 
              onClick={disconnectWallet}
              style={{ background: '#ef4444' }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {isConnected ? (
        <div className="container">
          <Dashboard 
            userBalance={userBalance}
            userDeposit={userDeposit}
            estimatedYield={estimatedYield}
          />
          
          <div className="dashboard">
            <ProtocolsList />
            <ActionsPanel account={account} />
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Welcome to Adaptive Yield Router</h2>
            <p style={{ margin: '20px 0', color: '#666' }}>
              Connect your wallet to start optimizing your stablecoin yields automatically.
            </p>
            <div className="info-box">
              <p>✅ Automatic rebalancing to highest APY</p>
              <p>✅ User-defined risk guardrails</p>
              <p>✅ Gas-optimized transactions</p>
              <p>✅ Multi-protocol integration</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

