import React, { useRef, ReactNode } from 'react';

interface AgentCardProps {
  name: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ name, description, icon, onClick, disabled = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;

    const rotateX = (y / height) * -20;
    const rotateY = (x / width) * 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    const card = cardRef.current;
    if (card) {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={!disabled ? onClick : undefined}
      className={`w-80 h-96 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl shadow-blue-500/10 transition-all duration-300 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="p-8 flex flex-col items-center justify-between h-full" style={{ transform: 'translateZ(40px)' }}>
        <div className="flex flex-col items-center text-center">
            {icon}
          <h2 className="text-3xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">{name}</h2>
          <p className="text-gray-400 mt-2">{description}</p>
        </div>
        <div className="mt-auto">
          <span className={`font-semibold ${disabled ? 'text-gray-500' : 'text-blue-400 group-hover:underline'}`}>
            {disabled ? 'Coming Soon' : 'Open Workspace →'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;