import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Message, Attachment, Agent } from '../types';

export const useChat = () => {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageToSend, setMessageToSend] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const attachmentUrlsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const isInitialView = useMemo(() => messages.length === 0, [messages]);
  const isGenerating = useMemo(() => messages.some(m => m.isStreaming), [messages]);

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

  useEffect(() => {
    if (!isInitialView) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInitialView]);

  const updateMessageToSendState = useCallback(() => {
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
  }, []);

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
  
  const handleDeselectAgent = useCallback(() => {
    const defaultAgent = agents.find(agent => agent.id === 'ChatAgent') || agents[0] || null;
    setActiveAgent(defaultAgent);
  }, [agents]);
  
  const handleNewSession = useCallback(() => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setMessageToSend('');

    attachmentUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    attachmentUrlsRef.current.clear();
    setAttachments([]);

    if (inputRef.current) inputRef.current.innerHTML = '';
    
    updateMessageToSendState();
    
    const defaultAgent = agents.find(agent => agent.id === 'ChatAgent') || agents[0] || null;
    setActiveAgent(defaultAgent);
    
    setCurrentRunId(null);
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
  }, [agents, updateMessageToSendState]);

  const handleCancel = useCallback(async () => {
    if (!currentRunId || !activeAgent?.id) return;

    try {
      abortControllerRef.current?.abort();
      await fetch(`http://localhost:7777/agents/${activeAgent.id}/runs/${currentRunId}/cancel`, {
        method: 'POST',
      });
    } catch (error) {
      console.error("Failed to cancel run:", error);
    }
  }, [currentRunId, activeAgent]);

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

  const handleAgentSelect = useCallback((agent: Agent) => {
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
  }, [updateMessageToSendState]);

  const handleSend = useCallback(async () => {
    if (messageToSend.trim() === '' && attachments.length === 0) return;

    let agentsToSendTo: Agent[] = [];
    let cleanMessage = messageToSend;
    const userMessageText = messageToSend;

    const agentNameMatches = [...messageToSend.matchAll(/@\[([^\]]+)\]/g)];
    
    if (agentNameMatches.length > 0) {
        for (const match of agentNameMatches) {
            const taggedAgentName = match[1];
            const taggedAgent = agents.find(agent => agent.name === taggedAgentName);

            if (taggedAgent) {
                if (!agentsToSendTo.some(a => a.id === taggedAgent.id)) agentsToSendTo.push(taggedAgent);
            } else {
                setMessages(prev => [...prev, { id: crypto.randomUUID(), text: `Error: Agent "${taggedAgentName}" not found.`, sender: 'bot' }]);
                return;
            }
        }
        cleanMessage = messageToSend.replace(/@\[[^\]]+\]\s*/g, '').trim();
    } else if (activeAgent) {
        agentsToSendTo.push(activeAgent);
    }

    if (agentsToSendTo.length === 0) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), text: 'Error: No active agent.', sender: 'bot' }]);
        return;
    }
    
    const userMessage: Message = { id: crypto.randomUUID(), text: userMessageText, sender: 'user', attachments };
    const botMessagePlaceholders: Message[] = agentsToSendTo.map(agent => ({ 
      id: crypto.randomUUID(), 
      text: '', 
      sender: 'bot', 
      isStreaming: true, 
      agent,
      userMessageId: userMessage.id,
      versions: [{ text: '', attachments: [] }],
      activeVersionIndex: 0,
    }));

    setMessages(prev => [...prev, userMessage, ...botMessagePlaceholders]);
    if (inputRef.current) inputRef.current.innerHTML = '';
    updateMessageToSendState();
    setAttachments([]);
    
    if (agentsToSendTo.length === 1) abortControllerRef.current = new AbortController();
    else { setCurrentRunId(null); abortControllerRef.current = null; }

    agentsToSendTo.forEach(async (agent, index) => {
        const botMessageId = botMessagePlaceholders[index].id;
        const formData = new FormData();
        formData.append('agent_id', agent.id);
        formData.append('message', cleanMessage);
        formData.append('stream', 'true');
        formData.append('session_id', sessionId);
        formData.append('user_id', 'deep');
        attachments.forEach(attachment => formData.append('files', attachment.file));

        try {
          const response = await fetch(`http://localhost:7777/agents/${agent.id}/runs`, { method: 'POST', body: formData, signal: agentsToSendTo.length === 1 ? abortControllerRef.current?.signal : undefined });
          if (!response.ok || !response.body) throw new Error(`HTTP error! status: ${response.status}`);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const processStream = async () => {
            const { done, value } = await reader.read();
            if (done) {
              setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
              if (agentsToSendTo.length === 1) setCurrentRunId(null);
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
                  if (eventName === 'RunStarted' && typeof jsonData === 'object' && jsonData !== null) { if ((jsonData as { run_id?: string }).run_id && agentsToSendTo.length === 1) setCurrentRunId((jsonData as { run_id: string }).run_id); }
                  else if (eventName === 'RunContent' && typeof jsonData === 'object' && jsonData !== null) {
                    const data = jsonData as Record<string, any>;
                    if (data.type === 'image' && typeof data.content === 'string' && typeof data.mime_type === 'string') {
                      const { content, mime_type, filename = 'image.png' } = data;
                      fetch(`data:${mime_type};base64,${content}`).then(res => res.blob()).then(blob => new File([blob], filename, { type: mime_type })).then(file => {
                        const previewUrl = URL.createObjectURL(file);
                        attachmentUrlsRef.current.add(previewUrl);
                        setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, attachments: [...(msg.attachments || []), { id: crypto.randomUUID(), file, previewUrl }] } : msg));
                      });
                    } else if (typeof data.content === 'string') {
                      setMessages(prev => prev.map(msg => {
                          if (msg.id === botMessageId) {
                            const newVersions = [...(msg.versions || [])];
                            const lastVersionIndex = newVersions.length - 1;
                            newVersions[lastVersionIndex] = {
                              ...newVersions[lastVersionIndex],
                              text: newVersions[lastVersionIndex].text + data.content
                            };
                            return {
                              ...msg,
                              text: newVersions[lastVersionIndex].text,
                              versions: newVersions,
                            };
                          }
                          return msg;
                        }));
                    }
                  } else if (eventName === 'RunCompleted') {
                    setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
                    if (agentsToSendTo.length === 1) setCurrentRunId(null);
                    return;
                  }
                } catch (e) { console.error('Error parsing SSE data:', dataLines.join('\n'), e); }
              }
            }
            await processStream();
          };
          await processStream();
        } catch (error: any) {
            if (error.name === 'AbortError') setMessages(prev => prev.map(msg => ({ ...msg, isStreaming: false })));
            else setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: `Sorry, an error occurred with agent ${agent.name}.`, isStreaming: false } : msg));
        }
    });
  }, [messageToSend, attachments, agents, activeAgent, sessionId, updateMessageToSendState]);

  const handleRegenerate = useCallback(async (messageToRegenerate: Message) => {
    if (isGenerating) return;

    const userMessageId = messageToRegenerate.id;
    const userMessageText = messageToRegenerate.text;
    const messageAttachments = messageToRegenerate.attachments || [];
    const cleanMessage = userMessageText.replace(/@\[[^\]]+\]\s*/g, '').trim();

    let agentsToSendTo: Agent[] = [];
    const agentNameMatches = [...userMessageText.matchAll(/@\[([^\]]+)\]/g)];
    
    if (agentNameMatches.length > 0) {
      agentsToSendTo = agentNameMatches.map(match => agents.find(agent => agent.name === match[1])).filter(Boolean) as Agent[];
    } else if (activeAgent) {
      agentsToSendTo.push(activeAgent);
    }
    
    if (agentsToSendTo.length === 0) return;

    const botMessagesToUpdate = messages.filter(m => m.sender === 'bot' && m.userMessageId === userMessageId && agentsToSendTo.some(a => a.id === m.agent?.id));

    if (botMessagesToUpdate.length === 0) return;

    setMessages(prev => prev.map(msg => {
      if (botMessagesToUpdate.some(bm => bm.id === msg.id)) {
        const newVersionIndex = msg.versions ? msg.versions.length : 1;
        const newVersions = msg.versions ? [...msg.versions, { text: '' }] : [{ text: msg.text, attachments: msg.attachments }, { text: '' }];
        
        return {
          ...msg,
          isStreaming: true,
          versions: newVersions,
          activeVersionIndex: newVersionIndex,
          text: '',
          attachments: [],
        };
      }
      return msg;
    }));

    if (agentsToSendTo.length === 1) abortControllerRef.current = new AbortController();
    else { setCurrentRunId(null); abortControllerRef.current = null; }

    botMessagesToUpdate.forEach(async (botMsg) => {
        const botMessageId = botMsg.id;
        const agent = botMsg.agent;
        if (!agent) return;

        const formData = new FormData();
        formData.append('agent_id', agent.id);
        formData.append('message', cleanMessage);
        formData.append('stream', 'true');
        formData.append('session_id', sessionId);
        formData.append('user_id', 'deep');
        messageAttachments.forEach(attachment => formData.append('files', attachment.file));

        try {
          const response = await fetch(`http://localhost:7777/agents/${agent.id}/runs`, { method: 'POST', body: formData, signal: agentsToSendTo.length === 1 ? abortControllerRef.current?.signal : undefined });
          if (!response.ok || !response.body) throw new Error(`HTTP error! status: ${response.status}`);
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const processStream = async () => {
            const { done, value } = await reader.read();
            if (done) {
              setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
              if (agentsToSendTo.length === 1) setCurrentRunId(null);
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
                    if (eventName === 'RunStarted' && typeof jsonData === 'object' && jsonData !== null) { if ((jsonData as { run_id?: string }).run_id && agentsToSendTo.length === 1) setCurrentRunId((jsonData as { run_id: string }).run_id); }
                    else if (eventName === 'RunContent' && typeof jsonData === 'object' && jsonData !== null) {
                        const data = jsonData as Record<string, any>;
                        if (data.type === 'image' && typeof data.content === 'string' && typeof data.mime_type === 'string') {
                          // Handle image attachment regeneration if needed
                        } else if (typeof data.content === 'string') {
                            setMessages(prev => prev.map(msg => {
                                if (msg.id === botMessageId) {
                                const newVersions = [...(msg.versions!)];
                                const activeVersionIndex = msg.activeVersionIndex!;
                                newVersions[activeVersionIndex] = {
                                    ...newVersions[activeVersionIndex],
                                    text: newVersions[activeVersionIndex].text + data.content
                                };
                                return {
                                    ...msg,
                                    text: newVersions[activeVersionIndex].text,
                                    versions: newVersions,
                                };
                                }
                                return msg;
                            }));
                        }
                    } else if (eventName === 'RunCompleted') {
                        setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
                        if (agentsToSendTo.length === 1) setCurrentRunId(null);
                        return;
                    }
                    } catch (e) { console.error('Error parsing SSE data:', dataLines.join('\n'), e); }
                }
            }
            await processStream();
          };
          await processStream();
        } catch (error: any) {
          if (error.name === 'AbortError') setMessages(prev => prev.map(msg => ({ ...msg, isStreaming: false })));
          else setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: `Sorry, an error occurred with agent ${agent.name}.`, isStreaming: false } : msg));
        }
    });
  }, [agents, activeAgent, sessionId, isGenerating, messages]);

  const handleVersionChange = useCallback((messageId: string, newIndex: number) => {
    setMessages(prevMessages => prevMessages.map(msg => {
      if (msg.id === messageId && msg.versions && newIndex >= 0 && newIndex < msg.versions.length) {
        const newVersion = msg.versions[newIndex];
        return {
          ...msg,
          activeVersionIndex: newIndex,
          text: newVersion.text,
          attachments: newVersion.attachments || [],
        };
      }
      return msg;
    }));
  }, []);

  const handlePromptClick = useCallback((prompt: string) => {
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
  }, [updateMessageToSendState]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const handleRemoveAttachment = useCallback((idToRemove: string) => {
    const attachment = attachments.find(att => att.id === idToRemove);
    if (attachment?.previewUrl) { URL.revokeObjectURL(attachment.previewUrl); attachmentUrlsRef.current.delete(attachment.previewUrl); }
    setAttachments(prev => prev.filter(att => att.id !== idToRemove));
  }, [attachments]);

  return {
    // State
    sessionId, messages, messageToSend, attachments, characterCount,
    currentRunId, agents, activeAgent, showAgentSuggestions, agentSearchQuery,
    filteredAgents, activeSuggestionIndex, isInitialView, isGenerating,
    
    // Refs
    messagesEndRef, fileInputRef, inputRef,

    // Setters & Handlers
    setMessages, setMessageToSend, setAttachments, setCharacterCount,
    setCurrentRunId, setAgents, setActiveAgent, setShowAgentSuggestions,
    setAgentSearchQuery, setFilteredAgents, setActiveSuggestionIndex,
    fetchAgents, updateMessageToSendState, handleDeselectAgent,
    handleNewSession, handleCancel, createAgentChip, handleAgentSelect,

    handleSend, handlePromptClick, handleFileChange, handleRemoveAttachment,
    handleRegenerate, handleVersionChange,
  };
};