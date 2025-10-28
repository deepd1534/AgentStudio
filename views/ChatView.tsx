// FIX: Import `useEffect` from React to resolve 'Cannot find name' error.
import React, { useCallback, useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import { 
  BotIcon, BrainCircuitIcon, DocumentIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon, UsersIcon
} from '../components/IconComponents';
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar';
import BotMessageContent from '../components/chat/BotMessageContent';
import UserMessageContent from '../components/chat/UserMessageContent';
import InitialContent from '../components/chat/InitialContent';
import { useChat } from '../hooks/useChat';
import ChatInputArea from '../components/chat/ChatInputArea';
import ChatSidebar from '../components/chat/ChatSidebar';
import { formatFileSize, getAgentColorClasses, getTeamColorClasses } from '../utils/chatUtils';
import ToolCallCard from '../components/chat/ToolCallCard';
import ThinkingIndicator from '../components/chat/ThinkingIndicator';
import TeamRunError from '../components/chat/TeamRunError';

// --- Main ChatView Component ---
const ChatView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    messages, isInitialView, isGenerating, activeTarget, showAgentSuggestions, 
    filteredAgents, activeSuggestionIndex, attachments, characterCount, 
    currentRunId, messageToSend, sessionId, sessions, isNewSession,
    
    inputRef, messagesEndRef, fileInputRef,

    handleNewSession, handleResetTarget, handleAgentSelect, handleRemoveAttachment,
    updateMessageToSendState, setActiveSuggestionIndex, handleFileChange, handleSend,
    handleCancel, handlePromptClick, createAgentChip, handleRegenerate,
    handleVersionChange, handleSelectSession, handleDeleteSession,
    
    agents, fetchAgents, setShowAgentSuggestions, setAgentSearchQuery,

    teams, fetchTeams, showTeamSuggestions, setShowTeamSuggestions, setTeamSearchQuery,
    filteredTeams, activeTeamSuggestionIndex, setActiveTeamSuggestionIndex, handleTeamSelect,
  } = useChat();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollThreshold = 100; // If user is within 100px of the bottom, we'll auto-scroll
      const isAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + scrollThreshold;
      shouldScrollRef.current = isAtBottom;
    }
  }, [messages]);

  useEffect(() => {
    if (shouldScrollRef.current && !isInitialView) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInitialView]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
        setShowAgentSuggestions(false);
        setShowTeamSuggestions(false);
    } else {
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        if (node.nodeType === Node.TEXT_NODE) {
            const textBeforeCursor = node.textContent?.substring(0, offset) || '';
            const agentAtMatch = textBeforeCursor.match(/(?:\s|^)@(\w*)$/);
            const teamSlashMatch = textBeforeCursor.match(/(?:\s|^)\/(\w*)$/);

            if (agentAtMatch) {
                if (!agents.length) fetchAgents();
                const query = agentAtMatch[1];
                setAgentSearchQuery(query);
                setShowAgentSuggestions(true);
                setShowTeamSuggestions(false);
                setActiveSuggestionIndex(0);
            } else if (teamSlashMatch) {
                if (!teams.length) fetchTeams();
                const query = teamSlashMatch[1];
                setTeamSearchQuery(query);
                setShowTeamSuggestions(true);
                setShowAgentSuggestions(false);
                setActiveTeamSuggestionIndex(0);
            } else {
                setShowAgentSuggestions(false);
                setShowTeamSuggestions(false);
            }
        } else {
            setShowAgentSuggestions(false);
            setShowTeamSuggestions(false);
        }
    }
    updateMessageToSendState();
  }, [updateMessageToSendState, agents, fetchAgents, setAgentSearchQuery, setShowAgentSuggestions, setActiveSuggestionIndex, teams, fetchTeams, setTeamSearchQuery, setShowTeamSuggestions, setActiveTeamSuggestionIndex]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showAgentSuggestions && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev: number) => (prev + 1) % filteredAgents.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev: number) => (prev - 1 + filteredAgents.length) % filteredAgents.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleAgentSelect(filteredAgents[activeSuggestionIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAgentSuggestions(false);
      }
    } else if (showTeamSuggestions && filteredTeams.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveTeamSuggestionIndex((prev: number) => (prev + 1) % filteredTeams.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveTeamSuggestionIndex((prev: number) => (prev - 1 + filteredTeams.length) % filteredTeams.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            handleTeamSelect(filteredTeams[activeTeamSuggestionIndex]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowTeamSuggestions(false);
        }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (!sel || !sel.isCollapsed || !inputRef.current) return;
        
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;
        const checkAndRemoveChip = (prevNode: ChildNode | null) => {
            if (prevNode && prevNode.nodeType === Node.ELEMENT_NODE) {
                const el = prevNode as HTMLElement;
                if (el.dataset.agentName || el.dataset.teamName) {
                    e.preventDefault();
                    el.parentNode?.removeChild(el);
                    updateMessageToSendState();
                    return true;
                }
            }
            return false;
        };

        if (offset === 0 && node.previousSibling) {
            checkAndRemoveChip(node.previousSibling);
        } else if (node.nodeType === Node.TEXT_NODE && offset === 1 && node.textContent === '\u00A0' && node.previousSibling) {
            if (checkAndRemoveChip(node.previousSibling)) {
                node.parentNode?.removeChild(node);
            }
        }
    }
  }, [
    showAgentSuggestions, filteredAgents, activeSuggestionIndex, handleAgentSelect, setShowAgentSuggestions, 
    showTeamSuggestions, filteredTeams, activeTeamSuggestionIndex, handleTeamSelect, setShowTeamSuggestions, 
    handleSend, updateMessageToSendState, inputRef, setActiveSuggestionIndex, setActiveTeamSuggestionIndex
  ]);

  return (
    <div className="grid h-screen max-h-screen w-full bg-black/20 backdrop-blur-lg overflow-hidden transition-all duration-300"
      style={{ gridTemplateColumns: isSidebarCollapsed ? '80px 1fr' : '320px 1fr' }}>
      <ChatSidebar
        sessions={sessions}
        currentSessionId={sessionId}
        isNewSession={isNewSession}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onBack={onBack}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className="relative flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="w-10"></div> {/* Spacer for alignment */}
          <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full"><BrainCircuitIcon className="w-6 h-6 text-white" /></div>
              <h1 className="text-xl font-bold text-white">Agent Chat</h1>
          </div>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </header>
        
        <div className={`flex-1 flex flex-col transition-all duration-700 ease-in-out overflow-hidden ${isInitialView ? 'justify-center' : 'justify-end'}`}>
          <div ref={scrollContainerRef} className={`space-y-6 overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out ${isInitialView ? 'opacity-0' : 'flex-1 p-6 opacity-100'}`}>
            {messages.map((msg, index) => (
              <React.Fragment key={msg.id}>
                {msg.sender === 'user' ? (
                  <div className="flex flex-col items-end animate-fade-in group">
                    <div className="flex items-start gap-4 justify-end w-full">
                      <div className="max-w-md rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 rounded-br-none overflow-hidden">
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`p-2 grid grid-cols-2 sm:grid-cols-3 gap-2 ${msg.text.trim() ? 'border-b border-white/20' : ''}`}>
                            {msg.attachments.map(att => <div key={att.id} className="bg-black/20 rounded-lg overflow-hidden relative group">{att.previewUrl ? <img src={att.previewUrl} alt={att.file.name} className="w-full h-auto object-cover" /> : <div className="p-2 flex items-center gap-2 overflow-hidden aspect-square justify-center"><div className="flex-1 min-w-0 text-center"><DocumentIcon className="w-6 h-6 text-gray-200 mx-auto" /><p className="text-white text-xs font-medium break-all mt-1" title={att.file.name}>{att.file.name}</p><p className="text-gray-300 text-[10px]">{formatFileSize(att.file.size)}</p></div></div>}</div>)}
                          </div>
                        )}
                        {msg.text.trim() && <div className="p-4"><UserMessageContent text={msg.text} /></div>}
                      </div>
                      <Avatar><AvatarImage src={`https://api.dicebear.com/8.x/personas/svg?seed=Alex`} alt="User Avatar" /><AvatarFallback>U</AvatarFallback></Avatar>
                    </div>
                    <div className="pr-[56px] pt-2"> {/* 56px = 40px avatar width + 16px gap */}
                      <button
                          onClick={() => handleRegenerate(msg)}
                          disabled={isGenerating}
                          className="p-1 rounded-full text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Regenerate response"
                      >
                          <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in w-full">
                    <div className="flex items-start gap-4">
                      {msg.team ? (
                          <Avatar><AvatarFallback className="bg-emerald-800"><UsersIcon className="w-5 h-5 text-emerald-300"/></AvatarFallback></Avatar>
                      ) : msg.agent ? (
                        <Avatar><AvatarFallback>{msg.agent.name.substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                      ) : (
                        <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10"><BotIcon className="w-6 h-6 text-cyan-300" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        {(msg.agent || msg.team) && (
                          <div className="pt-1.5 pb-1">
                            {msg.agent ? (
                              <p className={`font-bold text-sm ${getAgentColorClasses(msg.agent.id).text}`}>{msg.agent.name}</p>
                            ) : msg.team ? (
                              <p className={`font-bold text-sm ${getTeamColorClasses(msg.team.id).text}`}>{msg.team.name} Leader</p>
                            ) : null}
                            {msg.isStreaming && <ThinkingIndicator />}
                          </div>
                        )}
                        <div className={!msg.agent && !msg.team ? 'pt-2' : ''}>
                          {msg.error ? (
                            <TeamRunError error={msg.error} />
                          ) : msg.toolCall && msg.team ? (
                            <ToolCallCard toolCall={msg.toolCall} team={msg.team} />
                          ) : (
                            <>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mb-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {msg.attachments.map(att => 
                                    <div key={att.id} className="bg-gray-800/70 border border-white/10 rounded-lg overflow-hidden relative group">
                                      {att.previewUrl ? 
                                        <img src={att.previewUrl} alt={att.file.name} className="w-full h-full object-cover aspect-square" /> : 
                                        <div className="p-2 flex items-center gap-2 overflow-hidden aspect-square justify-center">
                                            <div className="flex-1 min-w-0 text-center">
                                              <DocumentIcon className="w-6 h-6 text-gray-200 mx-auto" />
                                              <p className="text-white text-xs font-medium break-all mt-1" title={att.file.name}>{att.file.name}</p>
                                              <p className="text-gray-300 text-[10px]">{formatFileSize(att.file.size)}</p>
                                            </div>
                                        </div>
                                      }
                                    </div>
                                  )}
                                </div>
                              )}
                              {(msg.text || msg.isStreaming) && <BotMessageContent text={msg.text} />}
                            </>
                          )}
                          
                          {msg.versions && msg.versions.length > 1 && !msg.isStreaming && !msg.toolCall && (
                            <div className="flex items-center gap-1 mt-2">
                              <button
                                onClick={() => handleVersionChange(msg.id, msg.activeVersionIndex! - 1)}
                                disabled={msg.activeVersionIndex === 0}
                                className="p-1 rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Previous version"
                              >
                                <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
                              </button>
                              <span className="text-xs text-gray-500 font-semibold select-none">
                                {msg.activeVersionIndex! + 1} / {msg.versions.length}
                              </span>
                              <button
                                onClick={() => handleVersionChange(msg.id, msg.activeVersionIndex! + 1)}
                                disabled={msg.activeVersionIndex === msg.versions.length - 1}
                                className="p-1 rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Next version"
                              >
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {msg.sender === 'bot' && index < messages.length - 1 && messages[index + 1].sender === 'user' && (
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                )}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={`w-full ${isInitialView ? 'max-w-3xl mx-auto' : ''} px-4 pb-4 transition-all duration-700 ease-in-out`}>
            <InitialContent onPromptClick={handlePromptClick} isVisible={isInitialView} />
            <ChatInputArea
              isInitialView={isInitialView}
              activeTarget={activeTarget}
              onResetTarget={handleResetTarget}
              showAgentSuggestions={showAgentSuggestions}
              filteredAgents={filteredAgents}
              activeAgentSuggestionIndex={activeSuggestionIndex}
              onAgentSelect={handleAgentSelect}
              onMouseEnterAgentSuggestion={setActiveSuggestionIndex}
              showTeamSuggestions={showTeamSuggestions}
              filteredTeams={filteredTeams}
              activeTeamSuggestionIndex={activeTeamSuggestionIndex}
              onTeamSelect={handleTeamSelect}
              onMouseEnterTeamSuggestion={setActiveSuggestionIndex}
              attachments={attachments}
              onRemoveAttachment={handleRemoveAttachment}
              inputRef={inputRef}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              characterCount={characterCount}
              isGenerating={isGenerating}
              currentRunId={currentRunId}
              onCancel={handleCancel}
              onSend={handleSend}
              messageToSend={messageToSend}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;