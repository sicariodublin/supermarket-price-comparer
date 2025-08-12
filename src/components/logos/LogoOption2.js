import React from 'react';

const LogoOption2 = ({ width = 200, height = 60, className = "" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 60" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      
      {/* Shopping Basket */}
      <g transform="translate(8, 12)">
        <path 
          d="M5 15 L25 15 L23 30 L7 30 Z" 
          fill="url(#gradient2)" 
          stroke="#fff" 
          strokeWidth="1"
          rx="2"
        />
        <path 
          d="M8 15 L8 8 Q8 5 11 5 L19 5 Q22 5 22 8 L22 15" 
          fill="none" 
          stroke="url(#gradient2)" 
          strokeWidth="2"
        />
        
        {/* Items in basket */}
        <circle cx="12" cy="20" r="2" fill="#ff6b6b" />
        <circle cx="18" cy="22" r="2" fill="#4caf50" />
      </g>
      
      {/* Comparison Arrows */}
      <g transform="translate(35, 20)">
        {/* Up Arrow (Better Price) */}
        <path 
          d="M0 10 L5 5 L10 10" 
          fill="none" 
          stroke="#4caf50" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        <line x1="5" y1="5" x2="5" y2="15" stroke="#4caf50" strokeWidth="2" />
        
        {/* Down Arrow (Higher Price) */}
        <path 
          d="M0 0 L5 5 L10 0" 
          fill="none" 
          stroke="#ff6b6b" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
      </g>
      
      {/* Brand Text */}
      <text x="55" y="25" fill="#333" fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">
        Add&Compare
      </text>
      <text x="55" y="40" fill="#667eea" fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">
        Find Better Prices
      </text>
    </svg>
  );
};

export default LogoOption2;