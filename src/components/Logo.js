
import React from 'react';

// Logo Option 1: Shopping Cart with Price Tag
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

// Logo Option 2: Comparison Arrows with Shopping Basket
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

// Logo Option 3: Modern Minimalist with Scale/Balance
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

// Logo Option 4: Modern Geometric with Plus Symbol
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

// Main Logo Component
const Logo = ({ 
  variant = "option1", 
  width = 200, 
  height = 60, 
  className = "" 
}) => {
  const logoComponents = {
    option1: LogoOption1,
    option2: LogoOption2,
    option3: LogoOption3,
    option4: LogoOption4
  };

  const LogoComponent = logoComponents[variant] || LogoOption1;

  return (
    <LogoComponent 
      width={width} 
      height={height} 
      className={className} 
    />
  );
};

export default Logo;