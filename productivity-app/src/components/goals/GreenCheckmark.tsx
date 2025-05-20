import React from 'react';

interface GreenCheckmarkProps {
  size?: number;
  className?: string;
}

const GreenCheckmark: React.FC<GreenCheckmarkProps> = ({ size = 24, className = '' }) => (
  <span
    className={`d-inline-flex align-items-center justify-content-center green-checkmark ${className}`}
    style={{
      width: size,
      height: size,
      background: '#198754',
      borderRadius: 4,
      color: 'white',
      fontWeight: 'bold',
      fontSize: size * 0.7,
      boxShadow: '0 0 0 1.5px #198754',
    }}
  >
    &#10003;
  </span>
);

export default GreenCheckmark; 