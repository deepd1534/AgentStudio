import React, { useState, useRef, useEffect } from 'react';
import { Agent, Attachment, Team } from '../../types';
import { XMarkIcon, PlusCircleIcon, StopIcon, PaperAirplaneIcon, DocumentIcon, PaperClipIcon, ArrowPathIcon } from '../IconComponents';
import { formatFileSize, getAgentColorClasses } from '../../utils/chatUtils';

interface ChatInputAreaProps {
  isInitialView: boolean;
  activeAgent: Agent | null;
  onDeselectAgent: () => void;
  showAgentSuggestions: boolean;
  filteredAgents: Agent[];
  activeAgentSuggestionIndex: number;
  onAgentSelect: (agent: Agent) => void;
  onMouseEnterAgentSuggestion: (index: number) => void;
  showTeamSuggestions: boolean;
  filteredTeams: Team[];
  activeTeamSuggestionIndex: number;
  onTeamSelect: (team: Team) => void;
  onMouseEnterTeamSuggestion: (index: number) => void;
  attachments: Attachment[];
  onRemoveAttachment: (id: string) => void;
  inputRef: React.RefObject<HTMLDivElement>;
  onInput: (e: React.FormEvent<HTMLDivElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  characterCount: number;
  isGenerating: boolean;
  currentRunId: string | null;
  onCancel: () => void;
  onSend: () => void;
  messageToSend: string;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  isInitialView, activeAgent, onDeselectAgent, showAgentSuggestions, filteredAgents,
  activeAgentSuggestionIndex, onAgentSelect, onMouseEnterAgentSuggestion, 
  showTeamSuggestions, filteredTeams, activeTeamSuggestionIndex, onTeamSelect, onMouseEnterTeamSuggestion,
  attachments, onRemoveAttachment, inputRef, onInput, onKeyDown, fileInputRef, onFileChange, characterCount,
  isGenerating, currentRunId, onCancel, onSend, messageToSend
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative mt-4 transition-all duration-700 ease-in-out`}>
      {activeAgent && !isInitialView && (
        <div className="group absolute bottom-full mb-2 left-0 flex items-center gap-2 text-xs text-gray-400 bg-gray-900/80 pl-3 pr-2 py-1.5 rounded-t-lg border-t border-l border-r border-white/10 shadow-lg z-10">
          <span>Talking to: <span className={`font-bold ${getAgentColorClasses(activeAgent.id).text}`}>{activeAgent.name}</span></span>
          {activeAgent.id !== 'ChatAgent' && (
            <button
              onClick={onDeselectAgent}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"
              aria-label="Deselect agent and default to Chat Agent"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-2 mb-2 w-60 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-50 animate-fade-in p-2 space-y-1"
        >
          <button
            onClick={() => { fileInputRef.current?.click(); setShowMenu(false); }}
            className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-white/10 transition-colors"
          >
            <PaperClipIcon className="w-5 h-5 text-gray-400" />
            <span>Attach</span>
          </button>
          <label htmlFor="autonomous-toggle" className="w-full flex items-center justify-between gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
            <span>Autonomous Mode</span>
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="autonomous-toggle"
                checked={isAutonomous} 
                onChange={() => setIsAutonomous(!isAutonomous)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>
        </div>
      )}


      {showAgentSuggestions && filteredAgents.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full max-w-md bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-2xl z-50 animate-fade-in">
          <ul className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredAgents.map((agent, index) => (
              <li key={agent.id}>
                <button
                  onClick={() => onAgentSelect(agent)}
                  onMouseEnter={() => onMouseEnterAgentSuggestion(index)}
                  className={`w-full text-left px-4 py-3 transition-colors text-white ${activeAgentSuggestionIndex === index ? 'bg-blue-500/30' : 'hover:bg-white/10'}`}
                >
                  <span className="font-bold">{agent.name}</span>
                  <span className="text-sm text-gray-400 ml-2">({agent.id})</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showTeamSuggestions && filteredTeams.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full max-w-md bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-2xl z-50 animate-fade-in">
          <div className="px-4 py-2 bg-black/20 text-xs font-semibold text-gray-400 uppercase">TEAMS</div>
          <ul className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredTeams.map((team, index) => (
              <li key={team.id}>
                <button
                  onClick={() => onTeamSelect(team)}
                  onMouseEnter={() => onMouseEnterTeamSuggestion(index)}
                  className={`w-full text-left px-4 py-3 transition-colors text-white ${activeTeamSuggestionIndex === index ? 'bg-emerald-500/30' : 'hover:bg-white/10'}`}
                >
                  <span className="font-bold">{team.name}</span>
                  <span className="text-sm text-gray-400 ml-2">({team.id})</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-800/50 border border-white/10 rounded-t-lg">
          {attachments.map(att => (
            <div key={att.id} className="group relative bg-gray-700/50 border border-white/10 rounded-lg animate-fade-in overflow-hidden w-24 h-24">
              {att.previewUrl ? <img src={att.previewUrl} alt={att.file.name} title={att.file.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center"><DocumentIcon className="w-8 h-8 text-gray-300" /><p className="text-white text-xs font-medium truncate mt-2 w-full" title={att.file.name}>{att.file.name}</p></div>}
              <div className="absolute bottom-0 left-0 w-full bg-black/60 p-1 text-center backdrop-blur-sm"><p className="text-gray-300 text-[10px]">{formatFileSize(att.file.size)}</p></div>
              <button onClick={() => onRemoveAttachment(att.id)} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all" aria-label={`Remove ${att.file.name}`}><XMarkIcon className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      <div className={`bg-gray-800/80 border border-white/10 overflow-hidden transition-all duration-300 ${attachments.length > 0 ? 'rounded-b-lg' : 'rounded-lg'} ${isInitialView ? 'shadow-2xl shadow-blue-500/10' : ''}`}>
        <div
          ref={inputRef}
          contentEditable
          onInput={onInput}
          onKeyDown={onKeyDown}
          data-placeholder="Ask whatever you want... (@ for agents, / for teams)"
          className={`chat-input w-full bg-transparent p-4 focus:outline-none custom-scrollbar transition-all duration-500 ease-in-out text-white ${isInitialView ? 'h-20' : 'h-14'} min-h-[56px]`}
          style={{ maxHeight: '150px' }}
        />
        <div className="flex justify-between items-center p-2 border-t border-white/10">
          <div className="flex items-center">
            <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" multiple />
            <button ref={buttonRef} onClick={() => setShowMenu(!showMenu)} className="rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="More options">
              <PlusCircleIcon className="w-8 h-8" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{characterCount}/1000</span>
            {isGenerating && currentRunId ? (
              <button
                onClick={onCancel}
                className="p-2 rounded-full bg-red-600 hover:bg-red-500 transition-colors animate-pulse-red"
                aria-label="Stop generating"
              >
                <StopIcon className="w-5 h-5 text-white" />
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={(messageToSend.trim() === '' && attachments.length === 0) || isGenerating}
                className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;