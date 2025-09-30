import React from 'react';
import AgentCard from '../components/AgentCard';
import { BrainCircuitIcon } from '../components/IconComponents';

interface DashboardProps {
  onSelectAgent: (agent: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectAgent }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 animate-pulse">
        Agent Studio
      </h1>
      <p className="text-gray-400 mb-16 text-lg">Your futuristic hub for AI agent management.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AgentCard
          name="Blog Agent"
          description="Generate comprehensive blog posts."
          icon={<BrainCircuitIcon className="w-16 h-16 text-cyan-300" />}
          onClick={() => onSelectAgent('blogAgent')}
        />
        {/* Future agents can be added here */}
      </div>
    </div>
  );
};

export default Dashboard;
