import React from 'react';

function ProtocolsList() {
  // Mock protocol data
  const protocols = [
    { name: 'Aave V3', apy: '5.24', tvl: '$1.2B', active: true },
    { name: 'Compound V3', apy: '4.87', tvl: '$890M', active: false },
    { name: 'Yearn Finance', apy: '5.12', tvl: '$450M', active: false },
    { name: 'Convex Finance', apy: '4.95', tvl: '$320M', active: false },
  ];

  return (
    <div className="card">
      <h2>
        <span className="card-icon">🔄</span>
        Available Protocols
      </h2>
      <div className="protocols-list">
        {protocols.map((protocol, index) => (
          <div className="protocol-item" key={index}>
            <div>
              <span className="protocol-name">{protocol.name}</span>
              {protocol.active && (
                <span className="protocol-badge">Active</span>
              )}
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                TVL: {protocol.tvl}
              </div>
            </div>
            <div>
              <span className="protocol-apy">{protocol.apy}%</span>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>APY</div>
            </div>
          </div>
        ))}
      </div>
      <div className="info-box" style={{ marginTop: '20px' }}>
        <p>
          🔄 Automatic rebalancing checks weekly for better opportunities
        </p>
      </div>
    </div>
  );
}

export default ProtocolsList;

