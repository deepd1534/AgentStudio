import React, { useState } from 'react';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  Bars3BottomLeftIcon, 
  Cog6ToothIcon, 
  ArrowPathIcon 
} from '../IconComponents';

const PROMPTS = [
  { text: 'Write a to-do list for a personal project or task', icon: <UserCircleIcon className="w-5 h-5 text-gray-400" /> },
  { text: 'Generate an email reply to a job offer', icon: <EnvelopeIcon className="w-5 h-5 text-gray-400" /> },
  { text: 'Summarise this article or text for me in one paragraph', icon: <Bars3BottomLeftIcon className="w-5 h-5 text-gray-400" /> },
  { text: 'How does AI work in a technical capacity', icon: <Cog6ToothIcon className="w-5 h-5 text-gray-400" /> },
];

const InitialContent: React.FC<{ onPromptClick: (prompt: string) => void; isVisible: boolean }> = ({ onPromptClick, isVisible }) => {
  const [prompts, setPrompts] = useState(PROMPTS);
  const handleRefresh = () => setPrompts([...prompts].sort(() => Math.random() - 0.5));

  return (
    <div className={`text-center transition-all duration-500 ease-in-out overflow-hidden ${isVisible ? 'max-h-[40rem] opacity-100' : 'max-h-0 opacity-0'}`}>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-200">Hi Deep!</h1>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-400 mt-2 mb-6">What would you like to know?</h2>
      <p className="text-gray-500 mb-8">Use one of the most common prompts below or use your own to begin</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-left">
        {prompts.map((prompt, index) => (
          <button key={index} onClick={() => onPromptClick(prompt.text)} className="flex flex-col p-4 bg-gray-800/50 border border-white/10 rounded-lg hover:bg-gray-700/70 transition-colors group">
            <p className="text-sm text-gray-300 group-hover:text-white transition-colors flex-grow">{prompt.text}</p>
            <div className="pt-4 mt-auto text-gray-500 flex justify-center">{prompt.icon}</div>
          </button>
        ))}
      </div>
      <button onClick={handleRefresh} className="flex items-center gap-2 text-gray-400 hover:text-white mx-auto text-sm transition-colors">
        <ArrowPathIcon className="w-4 h-4" /> Refresh Prompts
      </button>
    </div>
  );
};

export default InitialContent;