import React, { useState } from 'react';

function ActionsPanel({ account }) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [minAPY, setMinAPY] = useState('3.0');
  const [maxSlippage, setMaxSlippage] = useState('0.5');
  const [maxGas, setMaxGas] = useState('50');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid deposit amount' });
      return;
    }

    try {
      // In production, this would call the smart contract
      console.log('Depositing:', depositAmount, 'USDC');
      setMessage({ 
        type: 'success', 
        text: `Successfully deposited ${depositAmount} USDC!` 
      });
      setDepositAmount('');
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Deposit failed. Please try again.' });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid withdrawal amount' });
      return;
    }

    try {
      // In production, this would call the smart contract
      console.log('Withdrawing:', withdrawAmount, 'USDC');
      setMessage({ 
        type: 'success', 
        text: `Successfully withdrew ${withdrawAmount} USDC!` 
      });
      setWithdrawAmount('');
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Withdrawal failed. Please try again.' });
    }
  };

  const handleSetGuardrails = async () => {
    try {
      // In production, this would call the smart contract
      console.log('Setting guardrails:', { minAPY, maxSlippage, maxGas });
      setMessage({ 
        type: 'success', 
        text: 'Guardrails updated successfully!' 
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update guardrails.' });
    }
  };

  const handleEmergencyWithdraw = async () => {
    if (!window.confirm('Are you sure you want to emergency withdraw all funds?')) {
      return;
    }

    try {
      // In production, this would call the smart contract
      console.log('Emergency withdraw initiated');
      setMessage({ 
        type: 'success', 
        text: 'Emergency withdrawal completed!' 
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Emergency withdrawal failed.' });
    }
  };

  return (
    <div className="card actions-card">
      <h2>
        <span className="card-icon">⚡</span>
        Actions & Settings
      </h2>

      {message.text && (
        <div className={message.type}>
          {message.text}
        </div>
      )}

      {/* Deposit Section */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>Deposit Funds</h3>
        <div className="input-group">
          <label>Amount (USDC)</label>
          <input
            type="number"
            placeholder="Enter amount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleDeposit}>
          Deposit USDC
        </button>
      </div>

      {/* Withdraw Section */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>Withdraw Funds</h3>
        <div className="input-group">
          <label>Amount (USDC)</label>
          <input
            type="number"
            placeholder="Enter amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={handleWithdraw}>
          Withdraw USDC
        </button>
      </div>

      {/* Guardrails Section */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>
          Set Your Guardrails
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
          Define your risk parameters for automatic rebalancing
        </p>
        
        <div className="guardrails-form">
          <div className="input-group">
            <label>Minimum APY (%)</label>
            <input
              type="number"
              step="0.1"
              value={minAPY}
              onChange={(e) => setMinAPY(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <label>Max Slippage (%)</label>
            <input
              type="number"
              step="0.1"
              value={maxSlippage}
              onChange={(e) => setMaxSlippage(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <label>Max Gas (Gwei)</label>
            <input
              type="number"
              value={maxGas}
              onChange={(e) => setMaxGas(e.target.value)}
            />
          </div>
        </div>
        
        <button className="btn btn-primary" onClick={handleSetGuardrails}>
          Update Guardrails
        </button>
      </div>

      {/* Emergency Actions */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#ef4444' }}>
          Emergency Actions
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
          Use only in case of protocol issues or emergency situations
        </p>
        <button className="btn btn-danger" onClick={handleEmergencyWithdraw}>
          🚨 Emergency Withdraw All
        </button>
      </div>

      {/* Info Box */}
      <div className="info-box" style={{ marginTop: '30px' }}>
        <p><strong>How it works:</strong></p>
        <p>1. Set your guardrails (minimum APY, slippage, gas limits)</p>
        <p>2. Deposit your stablecoins</p>
        <p>3. The system automatically rebalances weekly to the best APY</p>
        <p>4. Withdraw anytime with no lock-up period</p>
      </div>
    </div>
  );
}

export default ActionsPanel;

