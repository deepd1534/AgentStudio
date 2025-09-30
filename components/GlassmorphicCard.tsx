import React, { ReactNode } from 'react';

interface GlassmorphicCardProps {
  children: ReactNode;
  className?: string;
}

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 ${className}`}>
      {children}
    </div>
  );
};

export default GlassmorphicCard;
