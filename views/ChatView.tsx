import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowLeftIcon, PaperAirplaneIcon, BotIcon, BrainCircuitIcon, PaperClipIcon, 
  DocumentIcon, XMarkIcon, StopIcon
} from '../components/IconComponents';
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar';
import BotMessageContent from '../components/chat/BotMessageContent';
import UserMessageContent from '../components/chat/UserMessageContent';
import InitialContent from '../components/chat/InitialContent';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isStreaming?: boolean;
  attachments?: Attachment[];
}

interface Attachment {
  id:string;
  file: File;
  previewUrl?: string;
}

interface Agent {
  id: string;
  name: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
};

// --- Main ChatView Component ---
const ChatView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageToSend, setMessageToSend] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const isInitialView = messages.length === 0;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const attachmentUrlsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:7777/agents');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Agent[] = await response.json();
      setAgents(data);
      const defaultAgent = data.find(agent => agent.id === 'ChatAgent');
      setActiveAgent(defaultAgent || data[0] || null);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  useEffect(() => {
    setSessionId(crypto.randomUUID());
    fetchAgents();
    return () => attachmentUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, isTyping]);

  const updateMessageToSendState = () => {
    if (!inputRef.current) {
        setMessageToSend('');
        setCharacterCount(0);
        return;
    }
    const nodes = Array.from(inputRef.current.childNodes);
    let text = '';
    
    for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.dataset.agentName) {
                text += `@[${el.dataset.agentName}]`;
            } else if (el.tagName === 'BR') {
                text += '\n';
            } else {
                text += el.textContent;
            }
        }
    }

    const cleanText = text.replace(/\u00A0/g, ' ').trim();
    setMessageToSend(cleanText);
    setCharacterCount(cleanText.length);
  };

  useEffect(() => {
    if (showAgentSuggestions) {
      const lowercasedQuery = agentSearchQuery.toLowerCase();
      setFilteredAgents(
        agents.filter(agent =>
          agent.name.toLowerCase().includes(lowercasedQuery) ||
          agent.id.toLowerCase().includes(lowercasedQuery)
        )
      );
    }
  }, [agentSearchQuery, agents, showAgentSuggestions]);
  
  const handleDeselectAgent = () => {
    const defaultAgent = agents.find(agent => agent.id === 'ChatAgent') || agents[0] || null;
    setActiveAgent(defaultAgent);
  };
  
  const handleCancel = async () => {
    if (!currentRunId || !activeAgent?.id) return;

    try {
      abortControllerRef.current?.abort();
      await fetch(`http://localhost:7777/agents/${activeAgent.id}/runs/${currentRunId}/cancel`, {
        method: 'POST',
      });
    } catch (error) {
      console.error("Failed to cancel run:", error);
    }
  };

  const handleSend = async () => {
    if (messageToSend.trim() === '' && attachments.length === 0) return;

    let agentToSendTo: Agent | null = activeAgent;
    let cleanMessage = messageToSend;
    const userMessageText = messageToSend; // Keep original for display in UI

    const agentNameMatch = messageToSend.match(/@\[([^\]]+)\]/);
    if (agentNameMatch) {
        const taggedAgentName = agentNameMatch[1];
        const taggedAgent = agents.find(agent => agent.name === taggedAgentName);

        if (taggedAgent) {
            agentToSendTo = taggedAgent;
            setActiveAgent(taggedAgent); // Set new active agent
            cleanMessage = messageToSend.replace(/@\[[^\]]+\]\s*/, '').trim();
        } else {
            const errorMessage: Message = {
                id: crypto.randomUUID(),
                text: `Error: Agent "${taggedAgentName}" not found. Please select a valid agent.`,
                sender: 'bot',
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }
    }

    if (!agentToSendTo) {
        const errorMessage: Message = {
            id: crypto.randomUUID(),
            text: 'Error: No active agent. Please select an agent to start the conversation.',
            sender: 'bot',
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
    }
    
    const agentId = agentToSendTo.id;
    const userMessage: Message = { id: crypto.randomUUID(), text: userMessageText, sender: 'user', attachments };
    const botMessageId = crypto.randomUUID();
    const botMessagePlaceholder: Message = { id: botMessageId, text: '', sender: 'bot', isStreaming: true };

    setMessages(prev => [...prev, userMessage, botMessagePlaceholder]);
    if (inputRef.current) inputRef.current.innerHTML = '';
    updateMessageToSendState();
    setAttachments([]);
    setIsTyping(true);
    setCurrentRunId(null);
    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('agent_id', agentId);
    formData.append('message', cleanMessage);
    formData.append('stream', 'true');
    formData.append('session_id', sessionId);
    formData.append('user_id', 'deep');
    attachments.forEach(attachment => formData.append('files', attachment.file));

    try {
      const response = await fetch(`http://localhost:7777/agents/${agentId}/runs`, { method: 'POST', body: formData, signal: abortControllerRef.current.signal });
      if (!response.ok || !response.body) throw new Error(`HTTP error! status: ${response.status}`);

      setIsTyping(false);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        const { done, value } = await reader.read();
        if (done) {
          setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          let eventName = 'message';
          const dataLines = part.split('\n').filter(line => line.startsWith('data: ')).map(line => line.substring('data: '.length));
          part.split('\n').forEach(line => { if (line.startsWith('event: ')) eventName = line.substring('event: '.length).trim(); });
          
          if (dataLines.length > 0) {
            try {
              const jsonData: unknown = JSON.parse(dataLines.join('\n'));
              
              if (eventName === 'RunStarted' && typeof jsonData === 'object' && jsonData !== null) {
                  const data = jsonData as { run_id?: string };
                  if (data.run_id) {
                    setCurrentRunId(data.run_id);
                  }
              } else if (eventName === 'RunContent' && typeof jsonData === 'object' && jsonData !== null) {
                const data = jsonData as Record<string, any>;
            
                if (data.type === 'image' && typeof data.content === 'string' && typeof data.mime_type === 'string') {
                  const content = data.content;
                  const mimeType = data.mime_type;
                  const filename = typeof data.filename === 'string' ? data.filename : 'image.png';

                  const b64toFile = async () => {
                    const res = await fetch(`data:${mimeType};base64,${content}`);
                    const blob = await res.blob();
                    return new File([blob], filename, { type: mimeType });
                  };
            
                  b64toFile().then(file => {
                    const previewUrl = URL.createObjectURL(file);
                    attachmentUrlsRef.current.add(previewUrl);
            
                    const newAttachment: Attachment = {
                      id: crypto.randomUUID(),
                      file: file,
                      previewUrl: previewUrl,
                    };
            
                    setMessages(prev => prev.map(msg => {
                      if (msg.id === botMessageId) {
                        return {
                          ...msg,
                          attachments: [...(msg.attachments || []), newAttachment]
                        };
                      }
                      return msg;
                    }));
                  });
                } else if (typeof data.content === 'string') {
                  setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: msg.text + data.content } : msg));
                }
              } else if (eventName === 'RunCompleted') {
                setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
                return; // End stream processing
              }
            } catch (e) { console.error('Error parsing SSE data:', dataLines.join('\n'), e); }
          }
        }
        await processStream();
      };
      await processStream();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('Fetch aborted.');
            setMessages(prev => prev.map(msg => ({ ...msg, isStreaming: false })));
        } else {
            console.error("Failed to fetch chat response:", error);
            setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: "Sorry, I couldn't connect to the agent. Please ensure your local server is running.", isStreaming: false } : msg));
        }
    } finally {
      setIsTyping(false);
      setCurrentRunId(null);
      abortControllerRef.current = null;
    }
  };
  
  const createAgentChip = (agent: Agent): HTMLElement => {
      const chip = document.createElement('span');
      chip.className = "inline-flex items-center gap-2 bg-blue-600/50 text-blue-200 rounded-lg px-2 py-1 text-sm font-semibold mx-0.5 align-middle";
      chip.contentEditable = 'false';
      chip.dataset.agentId = agent.id;
      chip.dataset.agentName = agent.name;
      
      const text = document.createElement('span');
      text.innerText = agent.name;
      chip.appendChild(text);

      const removeBtn = document.createElement('button');
      removeBtn.className = "text-blue-300 hover:text-white focus:outline-none";
      removeBtn.innerHTML = '&times;';
      removeBtn.type = "button";
      removeBtn.onclick = () => {
        chip.remove();
        inputRef.current?.focus();
        inputRef.current?.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      };
      chip.appendChild(removeBtn);

      return chip;
  };

  const handlePromptClick = (prompt: string) => {
    if(inputRef.current) {
        inputRef.current.focus();
        inputRef.current.innerText = prompt;
        const range = document.createRange();
        const sel = window.getSelection();
        if (sel) {
          range.selectNodeContents(inputRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
    }
    updateMessageToSendState();
  };

  const handleAgentSelect = (agent: Agent) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !inputRef.current?.contains(sel.anchorNode)) return;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const offset = range.startOffset;

    if (node.nodeType !== Node.TEXT_NODE) return;

    const textBefore = node.textContent?.substring(0, offset) || '';
    const atMatch = textBefore.match(/@\w*$/);
    if (!atMatch) return;

    const startIndex = atMatch.index!;
    
    const mentionRange = document.createRange();
    mentionRange.setStart(node, startIndex);
    mentionRange.setEnd(node, offset);
    mentionRange.deleteContents();
    
    const chip = createAgentChip(agent);
    mentionRange.insertNode(chip);
    
    const spaceNode = document.createTextNode('\u00A0');
    chip.parentNode!.insertBefore(spaceNode, chip.nextSibling);

    range.setStartAfter(spaceNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    setShowAgentSuggestions(false);
    updateMessageToSendState();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showAgentSuggestions && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % filteredAgents.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + filteredAgents.length) % filteredAgents.length);
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
        if (!sel || !sel.isCollapsed) return;
        
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
  };
  
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => {
        const isImage = file.type.startsWith('image/');
        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
        if (previewUrl) attachmentUrlsRef.current.add(previewUrl);
        return { id: crypto.randomUUID(), file, previewUrl };
      });
      setAttachments(prev => [...prev, ...newFiles]);
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveAttachment = (idToRemove: string) => {
    const attachment = attachments.find(att => att.id === idToRemove);
    if (attachment?.previewUrl) { URL.revokeObjectURL(attachment.previewUrl); attachmentUrlsRef.current.delete(attachment.previewUrl); }
    setAttachments(prev => prev.filter(att => att.id !== idToRemove));
  };

  const isGenerating = isTyping || messages.some(m => m.isStreaming);

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
        <div className="w-40" />
      </header>
      
      <div className={`flex-1 flex flex-col transition-all duration-700 ease-in-out overflow-hidden ${isInitialView ? 'justify-center' : 'justify-end'}`}>
        <div className={`space-y-6 overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out ${isInitialView ? 'opacity-0' : 'flex-1 p-6 opacity-100'}`}>
          {messages.map((msg) => msg.sender === 'user' ? (
            <div key={msg.id} className="flex items-start gap-4 animate-fade-in justify-end">
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
          ) : (
            <div key={msg.id} className="animate-fade-in w-full">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10"><BotIcon className="w-6 h-6 text-cyan-300" /></div>
                <div className="flex-1 pt-2 min-w-0">
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
                </div>
              </div>
            </div>
          ))}
          {isTyping && !messages.some(m => m.isStreaming) && <div key="typing-indicator" className="flex items-start gap-4 animate-fade-in"><div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10"><BotIcon className="w-6 h-6 text-cyan-300" /></div><div className="py-4 px-2 flex items-center gap-2"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span></div></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className={`w-full ${isInitialView ? 'max-w-3xl mx-auto' : ''} px-4 pb-4 transition-all duration-700 ease-in-out`}>
          <InitialContent onPromptClick={handlePromptClick} isVisible={isInitialView} />
          <div className={`relative mt-4 transition-all duration-700 ease-in-out`}>
            {activeAgent && !isInitialView && (
              <div className="group absolute bottom-full mb-2 left-0 flex items-center gap-2 text-xs text-gray-400 bg-gray-900/80 pl-3 pr-2 py-1.5 rounded-t-lg border-t border-l border-r border-white/10 shadow-lg z-10">
                <span>Talking to: <span className="font-bold text-cyan-400">{activeAgent.name}</span></span>
                {activeAgent.id !== 'ChatAgent' && (
                  <button
                    onClick={handleDeselectAgent}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"
                    aria-label="Deselect agent and default to Chat Agent"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            {showAgentSuggestions && filteredAgents.length > 0 && (
              <div className="absolute bottom-full mb-2 w-full max-w-md bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-2xl z-50 animate-fade-in">
                <ul className="max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredAgents.map((agent, index) => (
                    <li key={agent.id}>
                      <button
                        onClick={() => handleAgentSelect(agent)}
                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                        className={`w-full text-left px-4 py-3 transition-colors text-white ${activeSuggestionIndex === index ? 'bg-blue-500/30' : 'hover:bg-white/10'}`}
                      >
                        <span className="font-bold">{agent.name}</span>
                        <span className="text-sm text-gray-400 ml-2">({agent.id})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-800/50 border border-white/10 rounded-t-lg">
                {attachments.map(att => <div key={att.id} className="group relative bg-gray-700/50 border border-white/10 rounded-lg animate-fade-in overflow-hidden w-24 h-24">{att.previewUrl ? <img src={att.previewUrl} alt={att.file.name} title={att.file.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center"><DocumentIcon className="w-8 h-8 text-gray-300" /><p className="text-white text-xs font-medium truncate mt-2 w-full" title={att.file.name}>{att.file.name}</p></div>}<div className="absolute bottom-0 left-0 w-full bg-black/60 p-1 text-center backdrop-blur-sm"><p className="text-gray-300 text-[10px]">{formatFileSize(att.file.size)}</p></div><button onClick={() => handleRemoveAttachment(att.id)} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all" aria-label={`Remove ${att.file.name}`}><XMarkIcon className="w-3.5 h-3.5" /></button></div>)}
              </div>
            )}
            <div className={`bg-gray-800/80 border border-white/10 overflow-hidden transition-all duration-300 ${attachments.length > 0 ? 'rounded-b-lg' : 'rounded-lg'} ${isInitialView ? 'shadow-2xl shadow-blue-500/10' : ''}`}>
              <div 
                ref={inputRef}
                contentEditable
                onInput={handleInput} 
                onKeyDown={handleKeyDown} 
                data-placeholder="Ask whatever you want..."
                className={`chat-input w-full bg-transparent p-4 focus:outline-none custom-scrollbar transition-all duration-500 ease-in-out text-white ${isInitialView ? 'h-20' : 'h-14'} min-h-[56px]`} 
                style={{maxHeight: '150px'}} 
              />
              <div className="flex justify-between items-center p-2 border-t border-white/10">
                <div className="flex items-center gap-1"><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple /><button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors p-2 rounded-md"><PaperClipIcon className="w-5 h-5" /> <span className="hidden sm:inline">Add Attachment</span></button></div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{characterCount}/1000</span>
                  {isGenerating && currentRunId ? (
                    <button 
                      onClick={handleCancel}
                      className="p-2 rounded-full bg-red-600 hover:bg-red-500 transition-colors animate-pulse-red"
                      aria-label="Stop generating"
                    >
                      <StopIcon className="w-5 h-5 text-white" />
                    </button>
                  ) : (
                    <button 
                      onClick={handleSend} 
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
        </div>
      </div>
    </div>
  );
};

export default ChatView;