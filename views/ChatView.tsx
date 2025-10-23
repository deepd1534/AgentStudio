import React, { useCallback } from 'react';
import { 
  ArrowLeftIcon, BotIcon, BrainCircuitIcon, PlusCircleIcon, DocumentIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon
} from '../components/IconComponents';
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar';
import BotMessageContent from '../components/chat/BotMessageContent';
import UserMessageContent from '../components/chat/UserMessageContent';
import InitialContent from '../components/chat/InitialContent';
import { useChat } from '../hooks/useChat';
import ChatInputArea from '../components/chat/ChatInputArea';
import { formatFileSize } from '../utils/chatUtils';

// --- Main ChatView Component ---
const ChatView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    messages, isInitialView, isGenerating, activeAgent, showAgentSuggestions, 
    filteredAgents, activeSuggestionIndex, attachments, characterCount, 
    currentRunId, messageToSend,
    
    inputRef, messagesEndRef, fileInputRef,

    handleNewSession, handleDeselectAgent, handleAgentSelect, handleRemoveAttachment,
    updateMessageToSendState, setActiveSuggestionIndex, handleFileChange, handleSend,
    handleCancel, handlePromptClick, createAgentChip, handleRegenerate,
    handleVersionChange,
    
    agents, fetchAgents, setShowAgentSuggestions, setAgentSearchQuery
  } = useChat();

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
        setShowAgentSuggestions(false);
    } else {
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        if (node.nodeType === Node.TEXT_NODE) {
            const textBeforeCursor = node.textContent?.substring(0, offset) || '';
            const atMatch = textBeforeCursor.match(/(?:\s|^)@(\w*)$/);

            if (atMatch) {
                if (!agents.length) fetchAgents();
                const query = atMatch[1];
                setAgentSearchQuery(query);
                setShowAgentSuggestions(true);
                setActiveSuggestionIndex(0);
            } else {
                setShowAgentSuggestions(false);
            }
        } else {
            setShowAgentSuggestions(false);
        }
    }
    updateMessageToSendState();
  }, [updateMessageToSendState, agents, fetchAgents, setAgentSearchQuery, setShowAgentSuggestions, setActiveSuggestionIndex]);
  
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
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (!sel || !sel.isCollapsed || !inputRef.current) return;
        
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const offset = range.startOffset;

        if (offset === 0 && node.previousSibling) {
          const prevNode = node.previousSibling;
          if (prevNode.nodeType === Node.ELEMENT_NODE && (prevNode as HTMLElement).dataset.agentName) {
            e.preventDefault();
            prevNode.parentNode?.removeChild(prevNode);
            updateMessageToSendState();
          }
        }
        else if (node.nodeType === Node.TEXT_NODE && offset === 1 && node.textContent === '\u00A0' && node.previousSibling) {
          const prevNode = node.previousSibling;
          if (prevNode.nodeType === Node.ELEMENT_NODE && (prevNode as HTMLElement).dataset.agentName) {
            e.preventDefault();
            prevNode.parentNode?.removeChild(prevNode);
            node.parentNode?.removeChild(node);
            updateMessageToSendState();
          }
        }
    }
  }, [showAgentSuggestions, filteredAgents, activeSuggestionIndex, handleAgentSelect, setShowAgentSuggestions, handleSend, updateMessageToSendState, inputRef, setActiveSuggestionIndex]);

  return (
    <div className="relative flex flex-col h-screen max-h-screen w-full bg-black/20 backdrop-blur-lg overflow-hidden">
      {isInitialView && (
        <div className="absolute top-0 left-0 p-4 animate-fade-in z-20">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Studio</span>
            </button>
        </div>
      )}
      <header className={`flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 transition-all duration-500 ease-in-out ${isInitialView ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}>
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group w-40">
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Studio</span>
        </button>
        <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full"><BrainCircuitIcon className="w-6 h-6 text-white" /></div>
            <h1 className="text-xl font-bold text-white">Agent Studio</h1>
        </div>
        <div className="w-40 flex justify-end">
          <button onClick={handleNewSession} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <PlusCircleIcon className="w-6 h-6" />
            <span>New Session</span>
          </button>
        </div>
      </header>
      
      <div className={`flex-1 flex flex-col transition-all duration-700 ease-in-out overflow-hidden ${isInitialView ? 'justify-center' : 'justify-end'}`}>
        <div className={`space-y-6 overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out ${isInitialView ? 'opacity-0' : 'flex-1 p-6 opacity-100'}`}>
          {messages.map((msg) => msg.sender === 'user' ? (
            <div key={msg.id} className="flex flex-col items-end animate-fade-in group">
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
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Regenerate response"
                >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                </button>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="animate-fade-in w-full">
              <div className="flex items-start gap-4">
                {msg.agent ? (
                  <Avatar><AvatarFallback>{msg.agent.name.substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                ) : (
                  <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10"><BotIcon className="w-6 h-6 text-cyan-300" /></div>
                )}
                <div className="flex-1 min-w-0">
                  {msg.agent && <p className="font-bold text-sm text-cyan-400 pt-1.5 pb-1">{msg.agent.name}</p>}
                  <div className={!msg.agent ? 'pt-2' : ''}>
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
                    {(msg.text || msg.isStreaming) && <BotMessageContent text={msg.text} isStreaming={msg.isStreaming} />}
                     {msg.versions && msg.versions.length > 1 && !msg.isStreaming && (
                      <div className="flex items-center gap-4 mt-2 pl-1">
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
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={`w-full ${isInitialView ? 'max-w-3xl mx-auto' : ''} px-4 pb-4 transition-all duration-700 ease-in-out`}>
          <InitialContent onPromptClick={handlePromptClick} isVisible={isInitialView} />
          <ChatInputArea
            isInitialView={isInitialView}
            activeAgent={activeAgent}
            // Fix: Pass the correct handler function for deselecting an agent.
            onDeselectAgent={handleDeselectAgent}
            showAgentSuggestions={showAgentSuggestions}
            filteredAgents={filteredAgents}
            activeSuggestionIndex={activeSuggestionIndex}
            onAgentSelect={handleAgentSelect}
            onMouseEnterSuggestion={setActiveSuggestionIndex}
            attachments={attachments}
            onRemoveAttachment={handleRemoveAttachment}
            inputRef={inputRef}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            fileInputRef={fileInputRef}
            // Fix: Pass the correct handler function for file changes.
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
  );
};

export default ChatView;