import React, { useState } from 'react';
import AgentCard from '../components/AgentCard';
import { 
  PencilSquareIcon, 
  CodeBracketSquareIcon, 
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  PhotoIcon,
  MusicNoteIcon,
  BrainCircuitIcon,
  SparklesIcon
} from '../components/IconComponents';

interface DashboardProps {
  onSelectAgent: (agent: string) => void;
}

const allAgents = [
  {
    id: 'blogAgent',
    name: 'Blog Agent',
    description: 'Generate comprehensive blog posts.',
    icon: <PencilSquareIcon className="w-16 h-16 text-cyan-300" />,
    disabled: false,
  },
  {
    id: 'codeAgent',
    name: 'Code Agent',
    description: 'Generate and debug code snippets.',
    icon: <CodeBracketSquareIcon className="w-16 h-16 text-gray-500" />,
    disabled: true,
  },
  {
    id: 'stockAgent',
    name: 'Stock Agent',
    description: 'Analyze market trends and data.',
    icon: <ChartBarIcon className="w-16 h-16 text-gray-500" />,
    disabled: true,
  },
  {
    id: 'researchAgent',
    name: 'Research Agent',
    description: 'Conduct in-depth research.',
    icon: <AcademicCapIcon className="w-16 h-16 text-gray-500" />,
    disabled: true,
  },
  {
    id: 'imageAgent',
    name: 'Image Agent',
    description: 'Create stunning visuals from text.',
    icon: <PhotoIcon className="w-16 h-16 text-gray-500" />,
    disabled: true,
  },
  {
    id: 'musicAgent',
    name: 'Music Agent',
    description: 'Compose original music scores.',
    icon: <MusicNoteIcon className="w-16 h-16 text-gray-500" />,
    disabled: true,
  },
];

const AGENTS_PER_PAGE = 3;


const Dashboard: React.FC<DashboardProps> = ({ onSelectAgent }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(allAgents.length / AGENTS_PER_PAGE);
  const startIndex = currentPage * AGENTS_PER_PAGE;
  const endIndex = startIndex + AGENTS_PER_PAGE;
  const displayedAgents = allAgents.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-7xl mx-auto p-8 md:p-16 rounded-3xl bg-black/20 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-blue-500/10">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 animate-pulse px-4 py-2">
            Agent Studio
          </h1>
          <p className="text-gray-400 mb-12 text-lg">Unleash creativity and productivity with our suite of AI agents.</p>
          
          <div 
            onClick={() => onSelectAgent('chat')}
            className="group w-full max-w-4xl mb-16 p-8 rounded-2xl bg-gradient-to-tr from-blue-900/40 to-cyan-800/20 backdrop-blur-md border border-white/10 shadow-2xl shadow-blue-500/20 transition-all duration-300 cursor-pointer hover:shadow-cyan-400/30 hover:border-cyan-400/50 hover:-translate-y-2"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="p-4 bg-white/10 rounded-full">
                <SparklesIcon className="w-16 h-16 text-cyan-200 group-hover:animate-pulse" />
              </div>
              <div>
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300 mb-2">Chat</h2>
                <p className="text-gray-400 text-lg">The foundational AI. Engage in a direct, creative conversation.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-row flex-wrap items-center justify-center gap-8 mb-12 min-h-[420px]">
            {displayedAgents.map(agent => (
              <AgentCard
                key={agent.id}
                name={agent.name}
                description={agent.description}
                icon={agent.icon}
                onClick={() => onSelectAgent(agent.id)}
                disabled={agent.disabled}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-6">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <span className="text-gray-400 font-semibold tracking-wider">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages - 1}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </div>
          )}

          <footer className="mt-12 text-center text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <BrainCircuitIcon className="w-4 h-4" />
              <p className="text-sm">Crafted with AI precision by Deep</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;