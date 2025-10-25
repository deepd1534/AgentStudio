import { useState, useRef, useEffect, useMemo, useCallback, MouseEvent, ChangeEvent } from 'react';
// FIX: Add Team to imports
import { Message, Attachment, Agent, Team, ChatSession } from '../types';
// FIX: Add getTeamColorClasses to imports
import { getAgentColorClasses, getTeamColorClasses } from '../utils/chatUtils';

const API_BASE_URL = 'http://localhost:7777';

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

  // FIX: Add team-related state
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [activeTeamSuggestionIndex, setActiveTeamSuggestionIndex] = useState(0);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isNewSession, setIsNewSession] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const attachmentUrlsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  const isInitialView = useMemo(() => messages.length === 0, [messages]);
  const isGenerating = useMemo(() => messages.some((m) => m.isStreaming), [messages]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data: Agent[] = await response.json();
      setAgents(data);
      const defaultAgent = data.find((agent) => agent.name === 'Chat Agent') || data.find((agent) => agent.id === 'main-agent') || data[0] || null;
      setActiveAgent(defaultAgent);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'bot', text: 'Error: Could not fetch AI agents.'}]);
    }
  }, []);

  // FIX: Add fetchTeams function
  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data: Team[] = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'bot', text: 'Error: Could not fetch teams.'}]);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }, []);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
    fetchAgents();
    fetchSessions();
    return () => attachmentUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, [fetchAgents, fetchSessions]);

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

    // FIX: Changed for...of to forEach with explicit typing for `node` to resolve TS errors.
    nodes.forEach((node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.agentName) {
          text += `@[${el.dataset.agentName}]`;
        // FIX: Add handling for team chips
        } else if (el.dataset.teamName) {
          text += `/[${el.dataset.teamName}]`;
        } else if (el.tagName === 'BR') {
          text += '\n';
        } else {
          text += el.textContent;
        }
      }
    });

    const cleanText = text.replace(/\u00A0/g, ' ').trim();
    setMessageToSend(cleanText);
    setCharacterCount(cleanText.length);
  }, []);

  useEffect(() => {
    if (showAgentSuggestions) {
      const lowercasedQuery = agentSearchQuery.toLowerCase();
      setFilteredAgents(
        agents.filter(
          (agent) =>
            agent.name.toLowerCase().includes(lowercasedQuery) ||
            agent.id.toLowerCase().includes(lowercasedQuery)
        )
      );
    }
  }, [agentSearchQuery, agents, showAgentSuggestions]);

  // FIX: Add useEffect for filtering teams
  useEffect(() => {
    if (showTeamSuggestions) {
      const lowercasedQuery = teamSearchQuery.toLowerCase();
      setFilteredTeams(
        teams.filter(
          (team) =>
            team.name.toLowerCase().includes(lowercasedQuery) ||
            team.id.toLowerCase().includes(lowercasedQuery)
        )
      );
    }
  }, [teamSearchQuery, teams, showTeamSuggestions]);

  const handleDeselectAgent = useCallback(() => {
    const defaultAgent = agents.find((agent) => agent.name === 'Chat Agent') || agents[0] || null;
    setActiveAgent(defaultAgent);
  }, [agents]);

  const handleNewSession = useCallback(() => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setMessageToSend('');

    attachmentUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    attachmentUrlsRef.current.clear();
    setAttachments([]);

    if (inputRef.current) inputRef.current.innerHTML = '';

    updateMessageToSendState();

    const defaultAgent = agents.find((agent) => agent.name === 'Chat Agent') || agents.find((agent) => agent.id === 'main-agent') || agents[0] || null;
    setActiveAgent(defaultAgent);

    setCurrentRunId(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsNewSession(true);
  }, [agents, updateMessageToSendState]);

  const handleSelectSession = useCallback(async (newSessionId: string) => {
    if (newSessionId === sessionId && !isNewSession) return;

    // Reset state before loading new session
    setMessages([]);
    setMessageToSend('');
    setAttachments([]);
    if (inputRef.current) inputRef.current.innerHTML = '';
    updateMessageToSendState();
    setCurrentRunId(null);
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }

    setIsNewSession(false);
    setSessionId(newSessionId);
    
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${newSessionId}`);
        if (!response.ok) throw new Error('Failed to fetch session messages');
        const sessionDetails = await response.json();
        const history = sessionDetails.chat_history || [];

        const loadedMessages: Message[] = history
          .filter((item: any) => item.role === 'user' || item.role === 'assistant')
          .map((item: any) => ({
            id: crypto.randomUUID(),
            sender: item.role === 'assistant' ? 'bot' : 'user',
            text: item.content || '',
          }));
        
        setMessages(loadedMessages);
    } catch (error) {
        console.error('Failed to fetch session messages:', error);
        setMessages([{id: crypto.randomUUID(), sender: 'bot', text: 'Sorry, I was unable to load the conversation history.'}]);
    }
  }, [sessionId, isNewSession, updateMessageToSendState]);

  // FIX: Changed e: React.MouseEvent to e: MouseEvent after importing MouseEvent from react.
  const handleDeleteSession = useCallback(async (sessionIdToDelete: string, e: MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete session');
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionIdToDelete));
      if (sessionId === sessionIdToDelete) {
        handleNewSession();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [sessionId, handleNewSession]);

  const handleCancel = useCallback(async () => {
    abortControllerRef.current?.abort();
    setMessages(prev => prev.map(msg => msg.isStreaming ? { ...msg, text: msg.text + "\n\n-- Generation stopped --", isStreaming: false } : msg));
    setCurrentRunId(null);
  }, []);

  const createAgentChip = (agent: Agent): HTMLElement => {
    const colorClasses = getAgentColorClasses(agent.id);
    const chip = document.createElement('span');
    chip.className = `inline-flex items-center gap-2 ${colorClasses.chipBg} ${colorClasses.chipText} rounded-lg px-2 py-1 text-sm font-semibold mx-0.5 align-middle`;
    chip.contentEditable = 'false';
    chip.dataset.agentId = agent.id;
    chip.dataset.agentName = agent.name;

    const text = document.createElement('span');
    text.innerText = agent.name;
    chip.appendChild(text);

    const removeBtn = document.createElement('button');
    removeBtn.className = `${colorClasses.chipRemove} hover:text-white focus:outline-none`;
    removeBtn.innerHTML = '&times;';
    removeBtn.type = 'button';
    removeBtn.onclick = () => {
      chip.remove();
      inputRef.current?.focus();
      inputRef.current?.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    };
    chip.appendChild(removeBtn);

    return chip;
  };

  const handleAgentSelect = useCallback(
    (agent: Agent) => {
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
    },
    [updateMessageToSendState]
  );
  
  // FIX: Add createTeamChip and handleTeamSelect
  const createTeamChip = (team: Team): HTMLElement => {
    const colorClasses = getTeamColorClasses(team.id);
    const chip = document.createElement('span');
    chip.className = `inline-flex items-center gap-2 ${colorClasses.chipBg} ${colorClasses.chipText} rounded-lg px-2 py-1 text-sm font-semibold mx-0.5 align-middle`;
    chip.contentEditable = 'false';
    chip.dataset.teamId = team.id;
    chip.dataset.teamName = team.name;

    const text = document.createElement('span');
    text.innerText = team.name;
    chip.appendChild(text);

    const removeBtn = document.createElement('button');
    removeBtn.className = `${colorClasses.chipRemove} hover:text-white focus:outline-none`;
    removeBtn.innerHTML = '&times;';
    removeBtn.type = 'button';
    removeBtn.onclick = () => {
      chip.remove();
      inputRef.current?.focus();
      inputRef.current?.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    };
    chip.appendChild(removeBtn);

    return chip;
  };

  const handleTeamSelect = useCallback(
    (team: Team) => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !inputRef.current?.contains(sel.anchorNode)) return;

      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      const offset = range.startOffset;

      if (node.nodeType !== Node.TEXT_NODE) return;

      const textBefore = node.textContent?.substring(0, offset) || '';
      const slashMatch = textBefore.match(/\/[\w]*$/);
      if (!slashMatch) return;

      const startIndex = slashMatch.index!;

      const mentionRange = document.createRange();
      mentionRange.setStart(node, startIndex);
      mentionRange.setEnd(node, offset);
      mentionRange.deleteContents();

      const chip = createTeamChip(team);
      mentionRange.insertNode(chip);

      const spaceNode = document.createTextNode('\u00A0');
      chip.parentNode!.insertBefore(spaceNode, chip.nextSibling);

      range.setStartAfter(spaceNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      setShowTeamSuggestions(false);
      updateMessageToSendState();
      inputRef.current?.focus();
    },
    [updateMessageToSendState]
  );

  const runAgent = useCallback(async (agent: Agent, userMessage: Message, botMessageId: string, isRegeneration: boolean) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const formData = new FormData();
      formData.append('message', userMessage.text);
      formData.append('stream', 'true');
      if (sessionId) {
        formData.append('session_id', sessionId);
      }
      userMessage.attachments?.forEach(att => formData.append('files', att.file));

      const response = await fetch(`${API_BASE_URL}/agents/${agent.id}/runs`, {
        method: 'POST',
        body: formData,
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${errorText}`);
      }
      if (!response.body) throw new Error('Response has no body');

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const eventChunks = buffer.split('\n\n');
        
        for (let i = 0; i < eventChunks.length - 1; i++) {
          const chunk = eventChunks[i];
          let eventType = '';
          let dataStr = '';

          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.substring(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.substring(6).trim();
            }
          }
          
          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (eventType === 'RunStarted' && data.run_id) {
                setCurrentRunId(data.run_id);
              } else if (eventType === 'RunContent' && data.content) {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== botMessageId) return msg;

                    const newVersions = [...(msg.versions || [])];
                    const activeIdx = msg.activeVersionIndex ?? newVersions.length - 1;

                    if (activeIdx < 0 || activeIdx >= newVersions.length) return msg;

                    newVersions[activeIdx] = {
                      ...newVersions[activeIdx],
                      text: (newVersions[activeIdx].text || '') + data.content,
                    };
                    
                    return { ...msg, text: newVersions[activeIdx].text, versions: newVersions };
                  })
                );
              }
            } catch (e) {
              console.error('Failed to parse SSE data chunk:', dataStr);
            }
          }
        }
        buffer = eventChunks[eventChunks.length - 1];
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error(`Error running agent ${agent.name}:`, error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, text: `Error: Failed to get response from ${agent.name}.`, isStreaming: false }
              : msg
          )
        );
      }
    } finally {
      if (!signal.aborted) {
        setMessages((prev) => prev.map((msg) => (msg.id === botMessageId ? { ...msg, isStreaming: false } : msg)));
        setCurrentRunId(null);
      }
    }
  }, [sessionId]);

  // FIX: Add runTeam function
  const runTeam = useCallback(async (team: Team, userMessage: Message, botMessageId: string, isRegeneration: boolean) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const formData = new FormData();
      formData.append('message', userMessage.text);
      formData.append('stream', 'true');
      if (sessionId) {
        formData.append('session_id', sessionId);
      }
      userMessage.attachments?.forEach(att => formData.append('files', att.file));

      const response = await fetch(`${API_BASE_URL}/teams/${team.id}/runs`, {
        method: 'POST',
        body: formData,
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${errorText}`);
      }
      if (!response.body) throw new Error('Response has no body');

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const eventChunks = buffer.split('\n\n');

        for (let i = 0; i < eventChunks.length - 1; i++) {
          const chunk = eventChunks[i];
          let eventType = '';
          let dataStr = '';

          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.substring(7).trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.substring(6).trim();
            }
          }

          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (eventType === 'RunStarted' && data.run_id) {
                setCurrentRunId(data.run_id);
              } else if (eventType === 'RunContent' && data.content) {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== botMessageId) return msg;

                    const newVersions = [...(msg.versions || [])];
                    const activeIdx = msg.activeVersionIndex ?? newVersions.length - 1;

                    if (activeIdx < 0 || activeIdx >= newVersions.length) return msg;

                    newVersions[activeIdx] = {
                      ...newVersions[activeIdx],
                      text: (newVersions[activeIdx].text || '') + data.content,
                    };

                    return { ...msg, text: newVersions[activeIdx].text, versions: newVersions };
                  })
                );
              }
            } catch (e) {
              console.error('Failed to parse SSE data chunk:', dataStr);
            }
          }
        }
        buffer = eventChunks[eventChunks.length - 1];
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error(`Error running team ${team.name}:`, error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, text: `Error: Failed to get response from ${team.name}.`, isStreaming: false }
              : msg
          )
        );
      }
    } finally {
      if (!signal.aborted) {
        setMessages((prev) => prev.map((msg) => (msg.id === botMessageId ? { ...msg, isStreaming: false } : msg)));
        setCurrentRunId(null);
      }
    }
  }, [sessionId]);

  const handleSend = useCallback(async () => {
    if ((messageToSend.trim() === '' && attachments.length === 0) || isGenerating) return;

    let agentsToSendTo: Agent[] = [];
    const agentNameMatches = [...messageToSend.matchAll(/@\[([^\]]+)\]/g)];

    let teamsToSendTo: Team[] = [];
    const teamNameMatches = [...messageToSend.matchAll(/\/\[([^\]]+)\]/g)];

    if (agentNameMatches.length > 0) {
      for (const match of agentNameMatches) {
        const taggedAgent = agents.find((agent) => agent.name === match[1]);
        if (taggedAgent && !agentsToSendTo.some((a) => a.id === taggedAgent.id)) {
          agentsToSendTo.push(taggedAgent);
        }
      }
    }
    
    if (teamNameMatches.length > 0) {
      for (const match of teamNameMatches) {
        const taggedTeam = teams.find((team) => team.name === match[1]);
        if (taggedTeam && !teamsToSendTo.some((t) => t.id === taggedTeam.id)) {
          teamsToSendTo.push(taggedTeam);
        }
      }
    }

    if (agentsToSendTo.length === 0 && teamsToSendTo.length === 0) {
        if (activeAgent) {
            agentsToSendTo.push(activeAgent);
        } else {
            console.error("No valid agent to send to.");
            setMessages(prev => [...prev, {id: crypto.randomUUID(), sender: 'bot', text: 'Error: Could not determine which agent to use.'}]);
            return;
        }
    }

    const userMessage: Message = { id: crypto.randomUUID(), text: messageToSend, sender: 'user', attachments };
    const botAgentMessagePlaceholders: Message[] = agentsToSendTo.map((agent) => ({
      id: crypto.randomUUID(),
      text: '',
      sender: 'bot',
      isStreaming: true,
      agent,
      userMessageId: userMessage.id,
      versions: [{ text: '', attachments: [] }],
      activeVersionIndex: 0,
    }));

    const botTeamMessagePlaceholders: Message[] = teamsToSendTo.map((team) => ({
      id: crypto.randomUUID(),
      text: '',
      sender: 'bot',
      isStreaming: true,
      team,
      userMessageId: userMessage.id,
      versions: [{ text: '', attachments: [] }],
      activeVersionIndex: 0,
    }));

    const botMessagePlaceholders = [...botAgentMessagePlaceholders, ...botTeamMessagePlaceholders];

    setMessages((prev) => [...prev, userMessage, ...botMessagePlaceholders]);
    if (inputRef.current) inputRef.current.innerHTML = '';
    updateMessageToSendState();
    setAttachments([]);

    if (isNewSession) {
      const newSession: ChatSession = {
        session_id: sessionId,
        session_name: userMessage.text.substring(0, 40) || 'New Conversation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setIsNewSession(false);
    }

    agentsToSendTo.forEach(async (agent, index) => {
      await runAgent(agent, userMessage, botAgentMessagePlaceholders[index].id, false);
    });
    
    teamsToSendTo.forEach(async (team, index) => {
      await runTeam(team, userMessage, botTeamMessagePlaceholders[index].id, false);
    });
  }, [messageToSend, attachments, isGenerating, agents, teams, activeAgent, sessionId, isNewSession, updateMessageToSendState, runAgent, runTeam]);

  const handleRegenerate = useCallback(async (messageToRegenerate: Message) => {
    if (isGenerating) return;
    const userMessageId = messageToRegenerate.id;

    const botMessagesToUpdate = messages.filter((m) => m.sender === 'bot' && m.userMessageId === userMessageId);
    if (botMessagesToUpdate.length === 0) return;

    setMessages((prev) =>
      prev.map((msg) => {
        if (botMessagesToUpdate.some((bm) => bm.id === msg.id)) {
          const newVersionIndex = msg.versions ? msg.versions.length : 1;
          const newVersions = msg.versions
            ? [...msg.versions, { text: '' }]
            : [{ text: msg.text || '', attachments: msg.attachments }, { text: '' }];
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
      })
    );

    botMessagesToUpdate.forEach(async (botMsg) => {
      if (botMsg.agent) {
        await runAgent(botMsg.agent, messageToRegenerate, botMsg.id, true);
      } else if (botMsg.team) {
        await runTeam(botMsg.team, messageToRegenerate, botMsg.id, true);
      }
    });
  }, [isGenerating, messages, runAgent, runTeam]);

  const handleVersionChange = useCallback((messageId: string, newIndex: number) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
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
      })
    );
  }, []);

  const handlePromptClick = useCallback((prompt: string) => {
    if (inputRef.current) {
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

  // FIX: Changed e: React.ChangeEvent to e: ChangeEvent after importing ChangeEvent from react.
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // FIX: Added explicit type `File` to the `file` parameter to resolve TS errors.
      const newFiles = Array.from(e.target.files).map((file: File) => {
        const isImage = file.type.startsWith('image/');
        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
        if (previewUrl) attachmentUrlsRef.current.add(previewUrl);
        return { id: crypto.randomUUID(), file, previewUrl };
      });
      setAttachments((prev) => [...prev, ...newFiles]);
    }
    if (e.target) e.target.value = '';
  }, []);

  const handleRemoveAttachment = useCallback((idToRemove: string) => {
    const attachment = attachments.find((att) => att.id === idToRemove);
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
      attachmentUrlsRef.current.delete(attachment.previewUrl);
    }
    setAttachments((prev) => prev.filter((att) => att.id !== idToRemove));
  }, [attachments]);

  return {
    sessionId, messages, messageToSend, attachments, characterCount,
    currentRunId, agents, activeAgent, showAgentSuggestions, agentSearchQuery,
    filteredAgents, activeSuggestionIndex, isInitialView, isGenerating,
    sessions, isNewSession,
    
    messagesEndRef, fileInputRef, inputRef,

    setMessages, setMessageToSend, setAttachments, setCharacterCount,
    setCurrentRunId, setAgents, setActiveAgent, setShowAgentSuggestions,
    setAgentSearchQuery, setFilteredAgents, setActiveSuggestionIndex,
    fetchAgents, updateMessageToSendState, handleDeselectAgent,
    handleNewSession, handleCancel, createAgentChip, handleAgentSelect,
    handleSelectSession, handleDeleteSession,

    handleSend, handlePromptClick, handleFileChange, handleRemoveAttachment,
    handleRegenerate, handleVersionChange,

    // FIX: export team-related properties
    teams, fetchTeams, showTeamSuggestions, setShowTeamSuggestions,
    setTeamSearchQuery, filteredTeams, activeTeamSuggestionIndex,
    setActiveTeamSuggestionIndex, handleTeamSelect,
  };
};
