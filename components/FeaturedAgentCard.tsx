import React, { useRef, ReactNode } from 'react';
import { ArrowRightIcon } from './IconComponents';

interface FeaturedAgentCardProps {
  name: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

const FeaturedAgentCard: React.FC<FeaturedAgentCardProps> = ({ name, description, icon, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;

    const rotateX = (y / height) * -15;
    const rotateY = (x / width) * 15;

    card.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = `perspective(1500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="group w-full rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl shadow-cyan-500/10 transition-all duration-300 cursor-pointer hover:shadow-cyan-400/30 mb-16"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between h-full" style={{ transform: 'translateZ(50px)' }}>
        <div className="flex items-center text-center md:text-left">
          <div className="flex-shrink-0 mr-8 p-4 bg-cyan-500/10 rounded-full border border-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">{name}</h2>
            <p className="text-gray-400 mt-2 text-lg">{description}</p>
          </div>
        </div>
        <div className="mt-8 md:mt-0">
            <div className="p-4 rounded-full bg-white/10 group-hover:bg-blue-500 transition-colors duration-300">
                <ArrowRightIcon className="w-8 h-8 text-white" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedAgentCard;
