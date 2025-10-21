import React from 'react';
import AgentCard from '../components/AgentCard';
import { 
  PencilSquareIcon, 
  CodeBracketSquareIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  PhotoIcon,
  MusicNoteIcon,
  BrainCircuitIcon,
  ChatAgentIcon
} from '../components/IconComponents';

interface DashboardProps {
  onSelectAgent: (agent: string) => void;
}

const allAgents = [
  {
    id: 'chat',
    name: 'Chat',
    description: 'Engage in a direct, creative conversation.',
    icon: <ChatAgentIcon className="w-16 h-16 text-cyan-200" />,
    disabled: false,
  },
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


const Dashboard: React.FC<DashboardProps> = ({ onSelectAgent }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-7xl mx-auto p-8 md:p-16">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 animate-pulse px-4 py-2">
            Agent Studio
          </h1>
          <p className="text-gray-400 mb-16 text-lg text-center">Unleash creativity and productivity with our suite of AI agents.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
            {allAgents.map(agent => (
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

          <footer className="mt-16 text-center text-gray-600">
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