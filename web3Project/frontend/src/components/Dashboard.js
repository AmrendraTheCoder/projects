import React from 'react';

function Dashboard({ userBalance, userDeposit, estimatedYield }) {
  const calculateAPY = () => {
    if (parseFloat(userDeposit) === 0) return '0.00';
    return ((parseFloat(estimatedYield) / parseFloat(userDeposit)) * 100).toFixed(2);
  };

  return (
    <div className="dashboard">
      <div className="card">
        <h2>
          <span className="card-icon">💰</span>
          Your Balance
        </h2>
        <div className="stat">
          <div className="stat-label">Available USDC</div>
          <div className="stat-value large">${parseFloat(userBalance).toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <h2>
          <span className="card-icon">📊</span>
          Active Position
        </h2>
        <div className="stat">
          <div className="stat-label">Deposited Amount</div>
          <div className="stat-value">${parseFloat(userDeposit).toLocaleString()}</div>
          <div className="stat-change positive">
            ↑ Earning {calculateAPY()}% APY
          </div>
        </div>
      </div>

      <div className="card">
        <h2>
          <span className="card-icon">📈</span>
          Estimated Returns
        </h2>
        <div className="stat">
          <div className="stat-label">Annual Yield</div>
          <div className="stat-value">${parseFloat(estimatedYield).toLocaleString()}</div>
          <div className="stat-change positive">
            ↑ ${(parseFloat(estimatedYield) / 365 * 30).toFixed(2)} per month
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

