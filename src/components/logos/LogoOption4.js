import React from 'react';

const LogoOption4 = ({ width = 200, height = 60, className = "" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 60" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      
      {/* Modern Geometric Icon */}
      <g transform="translate(10, 10)">
        {/* Main Circle */}
        <circle cx="20" cy="20" r="18" fill="url(#gradient4)" />
        
        {/* Plus Symbol */}
        <line x1="20" y1="10" x2="20" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="10" y1="20" x2="30" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />
        
        {/* Comparison Dots */}
        <circle cx="5" cy="35" r="3" fill="#ff6b6b" />
        <circle cx="20" cy="35" r="3" fill="#4caf50" />
        <circle cx="35" cy="35" r="3" fill="#667eea" />
      </g>
      
      {/* Brand Text */}
      <text x="55" y="22" fill="#333" fontSize="18" fontWeight="700" fontFamily="Inter, sans-serif">
        Add&Compare
      </text>
      <text x="55" y="38" fill="#667eea" fontSize="11" fontWeight="500" fontFamily="Inter, sans-serif">
        Smart Price Comparison
      </text>
    </svg>
  );
};

export default LogoOption4;