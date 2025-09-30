import React from 'react';
import AgentCard from '../components/AgentCard';
import { PencilSquareIcon, CodeBracketSquareIcon, ChartBarIcon } from '../components/IconComponents';

interface DashboardProps {
  onSelectAgent: (agent: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectAgent }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-7xl mx-auto p-8 md:p-16 rounded-3xl bg-black/20 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-blue-500/10">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 animate-pulse py-4">
            Agent Studio
          </h1>
          <p className="text-gray-400 mb-16 text-lg">Your futuristic hub for AI agent management.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AgentCard
              name="Blog Agent"
              description="Generate comprehensive blog posts."
              icon={<PencilSquareIcon className="w-16 h-16 text-cyan-300" />}
              onClick={() => onSelectAgent('blogAgent')}
            />
            <AgentCard
              name="Code Agent"
              description="Generate and debug code snippets."
              icon={<CodeBracketSquareIcon className="w-16 h-16 text-gray-500" />}
              onClick={() => {}}
              disabled
            />
            <AgentCard
              name="Stock Agent"
              description="Analyze market trends and data."
              icon={<ChartBarIcon className="w-16 h-16 text-gray-500" />}
              onClick={() => {}}
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;