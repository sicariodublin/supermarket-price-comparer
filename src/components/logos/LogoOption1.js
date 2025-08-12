import React from 'react';

const LogoOption1 = ({ width = 200, height = 60, className = "" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 60" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      
      {/* Shopping Cart Icon */}
      <g transform="translate(10, 10)">
        {/* Cart Body */}
        <path 
          d="M5 8 L35 8 L32 28 L8 28 Z" 
          fill="url(#gradient1)" 
          stroke="#fff" 
          strokeWidth="1"
          rx="2"
        />
        
        {/* Cart Handle */}
        <path 
          d="M2 2 L8 2 L10 8" 
          fill="none" 
          stroke="url(#gradient1)" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        
        {/* Cart Wheels */}
        <circle cx="12" cy="35" r="3" fill="url(#gradient1)" />
        <circle cx="28" cy="35" r="3" fill="url(#gradient1)" />
        
        {/* Price Tag */}
        <g transform="translate(20, 5)">
          <path 
            d="M0 0 L15 0 L20 8 L15 16 L0 16 Z" 
            fill="#ff6b6b" 
            stroke="#fff" 
            strokeWidth="1"
          />
          <text x="7" y="10" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">€</text>
        </g>
      </g>
      
      {/* Brand Text */}
      <text x="55" y="25" fill="#333" fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">
        Add&Compare
      </text>
      <text x="55" y="40" fill="#667eea" fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">
        Smart Shopping Ireland
      </text>
    </svg>
  );
};

export default LogoOption1;