import React from 'react';
import { ChatSession } from '../../types';
import { ArrowLeftIcon, Cog6ToothIcon, EditIcon, SidebarCollapseIcon, TrashIcon } from '../IconComponents';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isNewSession: boolean;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onBack: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Tooltip: React.FC<{ text: string, children: React.ReactNode }> = ({ text, children }) => (
    <div className="relative group flex justify-center">
        {children}
        <div className="absolute left-full ml-4 w-auto min-w-max p-2 text-xs font-bold text-white bg-gray-800 rounded-md shadow-lg scale-0 group-hover:scale-100 transition-transform origin-left whitespace-nowrap z-50">
            {text}
        </div>
    </div>
);


const ChatSidebar: React.FC<ChatSidebarProps> = ({ sessions, currentSessionId, isNewSession, onSelectSession, onNewSession, onDeleteSession, onBack, isCollapsed, onToggleCollapse }) => {
  return (
    <div className="w-full h-full flex flex-col p-4 text-white bg-black/30 border-r border-white/10 transition-all duration-300">
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 flex-shrink-0 ${isCollapsed ? 'px-1.5' : ''}`}>
        {!isCollapsed && (
            <button onClick={onBack} className="flex items-center gap-3 text-gray-200 hover:text-white text-base font-semibold group transition-colors">
                <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Agent Studio
            </button>
        )}
        <button onClick={onToggleCollapse} className="text-gray-400 hover:text-white transition-colors p-2" title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
            <SidebarCollapseIcon className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {/* Conversations Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-6">
            {isCollapsed ? (
                 <Tooltip text="New Chat">
                    <button onClick={onNewSession} className={`w-full flex justify-center items-center h-12 rounded-lg transition-colors group ${isNewSession ? 'bg-white/10' : 'hover:bg-white/10'}`}>
                        <EditIcon className="w-5 h-5 flex-shrink-0 text-gray-200" />
                    </button>
                </Tooltip>
            ) : (
                <button onClick={onNewSession} className={`w-full text-left flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors group ${isNewSession ? 'bg-white/10' : 'hover:bg-white/10'}`}>
                    <EditIcon className="w-5 h-5 flex-shrink-0 text-gray-200" />
                    <span className="flex-1 truncate text-sm font-semibold">New Chat</span>
                </button>
            )}
        </div>

        {!isCollapsed && <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">Conversations</h2>}
        
        <div className="flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 -mr-2 pr-2">
            {isCollapsed ? (
                null
            ) : (
                <ul className="space-y-1">
                    {sessions.map(session => (
                        <li key={session.session_id}>
                        <button 
                            onClick={() => onSelectSession(session.session_id)}
                            className={`w-full text-left flex items-center p-2.5 rounded-lg transition-colors group ${currentSessionId === session.session_id && !isNewSession ? 'bg-blue-500/30' : 'hover:bg-white/10'}`}
                        >
                            <span className="flex-1 truncate text-sm">{session.session_name}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => onDeleteSession(session.session_id, e)}
                                    className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-white/10"
                                    title="Delete chat"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
      
      {/* Settings Footer */}
      <div className="flex-shrink-0 pt-4 border-t border-white/10">
        {isCollapsed ? (
          <Tooltip text="Settings">
            <button className="w-full flex justify-center items-center h-12 rounded-lg transition-colors hover:bg-white/10 group">
              <Cog6ToothIcon className="w-5 h-5 flex-shrink-0 text-gray-200 group-hover:rotate-45 transition-transform duration-300" />
            </button>
          </Tooltip>
        ) : (
          <button className="w-full text-left flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors hover:bg-white/10 group">
            <Cog6ToothIcon className="w-5 h-5 flex-shrink-0 text-gray-200 group-hover:rotate-45 transition-transform duration-300" />
            <span className="flex-1 truncate text-sm font-semibold">Settings</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;