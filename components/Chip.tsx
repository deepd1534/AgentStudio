import React from 'react';

interface ChipProps {
  text: string;
}

const Chip: React.FC<ChipProps> = ({ text }) => {
  return (
    <span className="cursor-pointer px-4 py-1.5 text-sm font-medium text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 rounded-full hover:bg-cyan-500/20 transition-colors">
      {text}
    </span>
  );
};

export default Chip;
