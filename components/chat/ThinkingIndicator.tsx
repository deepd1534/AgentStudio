import React, { useState, useEffect } from 'react';

const ThinkingIndicator: React.FC = () => {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const intervalId = setInterval(() => setDots(prev => prev.length >= 3 ? '.' : prev + '.'), 400);
    return () => clearInterval(intervalId);
  }, []);
  return <span className="inline-block ml-1 text-gray-400 italic">thinking{dots}</span>;
};

export default ThinkingIndicator;
