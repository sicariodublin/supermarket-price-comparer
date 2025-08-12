import React from 'react';

const LogoOption3 = ({ width = 200, height = 60, className = "" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 60" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      
      {/* Balance Scale */}
      <g transform="translate(15, 10)">
        {/* Scale Base */}
        <line x1="15" y1="35" x2="15" y2="10" stroke="url(#gradient3)" strokeWidth="3" />
        <line x1="5" y1="35" x2="25" y2="35" stroke="url(#gradient3)" strokeWidth="3" strokeLinecap="round" />
        
        {/* Scale Beam */}
        <line x1="0" y1="15" x2="30" y2="15" stroke="url(#gradient3)" strokeWidth="2" />
        
        {/* Left Pan (Higher Price) */}
        <path 
          d="M0 15 L-5 25 L5 25 Z" 
          fill="#ff6b6b" 
          stroke="#fff" 
          strokeWidth="1"
        />
        <text x="0" y="22" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">€€</text>
        
        {/* Right Pan (Lower Price) */}
        <path 
          d="M30 15 L25 20 L35 20 Z" 
          fill="#4caf50" 
          stroke="#fff" 
          strokeWidth="1"
        />
        <text x="30" y="18" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">€</text>
      </g>
      
      {/* Brand Text */}
      <text x="55" y="25" fill="#333" fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">
        Add&Compare
      </text>
      <text x="55" y="40" fill="#667eea" fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">
        Balance Your Budget
      </text>
    </svg>
  );
};

export default LogoOption3;