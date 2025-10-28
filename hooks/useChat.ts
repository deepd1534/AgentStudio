import { useState, useRef, useEffect, useMemo, useCallback, MouseEvent, ChangeEvent } from 'react';
import { Message, Attachment, Agent, Team, ChatSession, Workflow } from '../types';
import { getAgentColorClasses, getTeamColorClasses, getWorkflowColorClasses } from '../utils/chatUtils';

const API_BASE_URL = 'http://localhost:7777';

export const useChat = () => {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageToSend, setMessageToSend] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeTarget, setActiveTarget] = useState<{ type: 'agent' | 'team' | 'workflow', data: Agent | Team | Workflow } | null>(null);
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [activeTeamSuggestionIndex, setActiveTeamSuggestionIndex] = useState(0);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [showWorkflowSuggestions, setShowWorkflowSuggestions] = useState(false);
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState('');
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflowSuggestionIndex, setActiveWorkflowSuggestionIndex] = useState(0);

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
      if (defaultAgent) {
        setActiveTarget({ type: 'agent', data: defaultAgent });
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'bot', text: 'Error: Could not fetch AI agents.'}]);
    }
  }, []);

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
  
  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows`);
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data: Workflow[] = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'bot', text: 'Error: Could not fetch AI workflows.'}]);
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
    fetchTeams();
    fetchWorkflows();
    fetchSessions();
    return () => attachmentUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, [fetchAgents, fetchTeams, fetchWorkflows, fetchSessions]);

  const updateMessageToSendState = useCallback(() => {
    if (!inputRef.current) {
      setMessageToSend('');
      setCharacterCount(0);
      return;
    }
    const nodes = Array.from(inputRef.current.childNodes);
    let text = '';

    nodes.forEach((node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.agentName) {
          text += `@[${el.dataset.agentName}]`;
        } else if (el.dataset.teamName) {
          text += `/[${el.dataset.teamName}]`;
        } else if (el.dataset.workflowName) {
          text += `![${el.dataset.workflowName}]`;
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

  useEffect(() => {
    if (showWorkflowSuggestions) {
      const lowercasedQuery = workflowSearchQuery.toLowerCase();
      setFilteredWorkflows(
        workflows.filter(
          (workflow) =>
            workflow.name.toLowerCase().includes(lowercasedQuery) ||
            workflow.id.toLowerCase().includes(lowercasedQuery)
        )
      );
    }
  }, [workflowSearchQuery, workflows, showWorkflowSuggestions]);

  const handleResetTarget = useCallback(() => {
    const defaultAgent = agents.find((agent) => agent.name === 'Chat Agent') || agents[0] || null;
    if (defaultAgent) {
      setActiveTarget({ type: 'agent', data: defaultAgent });
    }
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
    if (defaultAgent) {
        setActiveTarget({ type: 'agent', data: defaultAgent });
    }

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

  const createWorkflowChip = (workflow: Workflow): HTMLElement => {
    const colorClasses = getWorkflowColorClasses(workflow.id);
    const chip = document.createElement('span');
    chip.className = `inline-flex items-center gap-2 ${colorClasses.chipBg} ${colorClasses.chipText} rounded-lg px-2 py-1 text-sm font-semibold mx-0.5 align-middle`;
    chip.contentEditable = 'false';
    chip.dataset.workflowId = workflow.id;
    chip.dataset.workflowName = workflow.name;

    const text = document.createElement('span');
    text.innerText = workflow.name;
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

  const handleWorkflowSelect = useCallback(
    (workflow: Workflow) => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !inputRef.current?.contains(sel.anchorNode)) return;

      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      const offset = range.startOffset;

      if (node.nodeType !== Node.TEXT_NODE) return;

      const textBefore = node.textContent?.substring(0, offset) || '';
      const bangMatch = textBefore.match(/![\w\s]*$/);
      if (!bangMatch) return;

      const startIndex = bangMatch.index!;

      const mentionRange = document.createRange();
      mentionRange.setStart(node, startIndex);
      mentionRange.setEnd(node, offset);
      mentionRange.deleteContents();

      const chip = createWorkflowChip(workflow);
      mentionRange.insertNode(chip);

      const spaceNode = document.createTextNode('\u00A0');
      chip.parentNode!.insertBefore(spaceNode, chip.nextSibling);

      range.setStartAfter(spaceNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);

      setShowWorkflowSuggestions(false);
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

  const runTeam = useCallback(async (team: Team, userMessage: Message, isRegeneration: boolean, teamMessageIdToUpdate?: string) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    const mainTeamMessageIdRef = { current: teamMessageIdToUpdate || null };
    const currentAgentMessageIdRef = { current: null as string | null };

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
                        if (eventType === 'TeamRunError') {
                            const errorMessage: Message = {
                                id: crypto.randomUUID(),
                                sender: 'bot',
                                team,
                                userMessageId: userMessage.id,
                                text: '',
                                error: data.error || 'An unknown error occurred.',
                            };
                            setMessages(prev => [
                                ...prev.map(m => (m.userMessageId === userMessage.id && m.isStreaming) ? {...m, isStreaming: false} : m),
                                errorMessage
                            ]);
                            currentAgentMessageIdRef.current = null;
                            mainTeamMessageIdRef.current = null;
                        } else if (eventType === 'RunStarted' && data.run_id && !data.agent_id) {
                            setCurrentRunId(data.run_id);
                        } else if (eventType === 'TeamToolCallStarted') {
                            const toolCallData = data.tool;
                            const delegatedAgent = agents.find(a => a.id === toolCallData.tool_args.member_id);

                            const toolCallMessage: Message = {
                                id: crypto.randomUUID(),
                                sender: 'bot',
                                team,
                                userMessageId: userMessage.id,
                                text: '',
                                toolCall: {
                                    toolCallId: toolCallData.tool_call_id,
                                    toolName: toolCallData.tool_name,
                                    toolArgs: toolCallData.tool_args,
                                    delegatedToAgentName: delegatedAgent?.name || toolCallData.tool_args.member_id,
                                }
                            };
                            if (currentAgentMessageIdRef.current) {
                                setMessages(prev => prev.map(m => m.id === currentAgentMessageIdRef.current ? { ...m, isStreaming: false } : m));
                                currentAgentMessageIdRef.current = null;
                            }
                            setMessages(prev => [...prev, toolCallMessage]);
                        } else if (eventType === 'RunStarted' && data.agent_id) {
                            mainTeamMessageIdRef.current = null; // Reset team message, forcing a new one if the team speaks again
                            const agentMessageIdToStop = currentAgentMessageIdRef.current;
                            
                            const agent: Agent = { id: data.agent_id, name: data.agent_name };
                            const newAgentMessage: Message = {
                                id: crypto.randomUUID(),
                                sender: 'bot',
                                agent,
                                team,
                                userMessageId: userMessage.id,
                                text: '',
                                isStreaming: true,
                                versions: [{ text: '' }],
                                activeVersionIndex: 0,
                            };
                            currentAgentMessageIdRef.current = newAgentMessage.id;
                        
                            setMessages(prev => {
                                const updatedPrev = agentMessageIdToStop
                                    ? prev.map(m => m.id === agentMessageIdToStop ? { ...m, isStreaming: false } : m)
                                    : prev;
                                return [...updatedPrev, newAgentMessage];
                            });
                        } else if (eventType === 'RunContent' && data.content) {
                            if (currentAgentMessageIdRef.current) {
                                setMessages(prev => prev.map(msg => {
                                    if (msg.id !== currentAgentMessageIdRef.current) return msg;
                                    const newVersions = [...(msg.versions || [])];
                                    const activeIdx = msg.activeVersionIndex ?? newVersions.length - 1;
                                    if (activeIdx < 0 || activeIdx >= newVersions.length) return msg;
                                    newVersions[activeIdx] = {
                                        ...newVersions[activeIdx],
                                        text: (newVersions[activeIdx].text || '') + data.content,
                                    };
                                    return { ...msg, text: newVersions[activeIdx].text, versions: newVersions };
                                }));
                            }
                        } else if (eventType === 'TeamRunContent' && data.content) {
                            const agentMessageIdToStop = currentAgentMessageIdRef.current;
                            if (agentMessageIdToStop) {
                                currentAgentMessageIdRef.current = null;
                            }

                            if (!mainTeamMessageIdRef.current) {
                                const newTeamMessage: Message = {
                                    id: crypto.randomUUID(),
                                    sender: 'bot',
                                    team,
                                    userMessageId: userMessage.id,
                                    text: data.content,
                                    isStreaming: true,
                                    versions: [{ text: data.content }],
                                    activeVersionIndex: 0,
                                };
                                mainTeamMessageIdRef.current = newTeamMessage.id;
                                setMessages(prev => {
                                    const updatedPrev = agentMessageIdToStop
                                        ? prev.map(m => m.id === agentMessageIdToStop ? { ...m, isStreaming: false } : m)
                                        : prev;
                                    return [...updatedPrev, newTeamMessage];
                                });
                            } else {
                                setMessages(prev => prev.map(msg => {
                                    let updatedMsg = msg;
                                    if (msg.id === mainTeamMessageIdRef.current) {
                                        const newVersions = [...(msg.versions || [])];
                                        const activeIdx = msg.activeVersionIndex ?? newVersions.length - 1;
                                        if (activeIdx >= 0 && activeIdx < newVersions.length) {
                                            newVersions[activeIdx] = {
                                                ...newVersions[activeIdx],
                                                text: (newVersions[activeIdx].text || '') + data.content,
                                            };
                                            updatedMsg = { ...updatedMsg, text: newVersions[activeIdx].text, versions: newVersions, isStreaming: true };
                                        }
                                    }
                                    if (agentMessageIdToStop && msg.id === agentMessageIdToStop) {
                                        updatedMsg = { ...updatedMsg, isStreaming: false };
                                    }
                                    return updatedMsg;
                                }));
                            }
                        } else if (eventType === 'TeamRunCompleted') {
                            setMessages(prev => prev.map(msg => 
                                (msg.userMessageId === userMessage.id && msg.isStreaming) 
                                    ? { ...msg, isStreaming: false } 
                                    : msg
                            ));
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
            const finalMessageId = mainTeamMessageIdRef.current;
            setMessages(prev => prev.map(msg => finalMessageId && msg.id === finalMessageId ? { ...msg, text: `Error: Failed to get response from ${team.name}.`, isStreaming: false } : msg));
        }
    } finally {
        if (!signal.aborted) {
            const finalMessageId = mainTeamMessageIdRef.current;
            setMessages(prev => prev.map(msg => ( (finalMessageId && msg.id === finalMessageId) || msg.id === currentAgentMessageIdRef.current) ? { ...msg, isStreaming: false } : msg));
            setCurrentRunId(null);
        }
    }
  }, [sessionId, agents]);

  const runWorkflow = useCallback(async (workflow: Workflow, userMessage: Message, botMessageId: string) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
        const formData = new URLSearchParams();
        formData.append('message', userMessage.text);
        formData.append('stream', 'true');
        if (sessionId) {
            formData.append('session_id', sessionId);
        }

        const response = await fetch(`${API_BASE_URL}/workflows/${workflow.id}/runs`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
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
                        setMessages(prev => prev.map(msg => {
                            if (msg.id !== botMessageId) return msg;

                            let workflowRun = msg.workflowRun ? { ...msg.workflowRun, steps: [...msg.workflowRun.steps] } : {
                                workflow,
                                status: 'running',
                                steps: [],
                                finalContent: '',
                            };

                            switch (eventType) {
                                case 'RunStarted':
                                    setCurrentRunId(data.run_id);
                                    workflowRun.status = 'running';
                                    break;
                                case 'StepStarted':
                                case 'StepExecutorRunStarted':
                                    workflowRun.steps.push({ name: data.step_name || data.name || `Step ${workflowRun.steps.length + 1}`, status: 'running', content: '' });
                                    break;
                                case 'RunContent':
                                    if (data.step_name) {
                                        const step = workflowRun.steps.find(s => s.name === data.step_name && s.status === 'running');
                                        if (step) {
                                            step.content += data.content;
                                        }
                                    } else {
                                        workflowRun.finalContent += data.content;
                                    }
                                    break;
                                case 'StepCompleted':
                                case 'StepExecutorRunCompleted':
                                    const stepToComplete = workflowRun.steps.find(s => (s.name === data.step_name || s.name === data.name) && s.status === 'running');
                                    if (stepToComplete) {
                                        stepToComplete.status = 'completed';
                                    }
                                    break;
                                case 'WorkflowRunCompleted':
                                case 'RunCompleted':
                                    workflowRun.status = 'completed';
                                    break;
                                default:
                                    // console.log("Unhandled workflow event:", eventType, data);
                            }
                            return { ...msg, workflowRun };
                        }));

                    } catch (e) {
                        console.error('Failed to parse workflow SSE data chunk:', dataStr, e);
                    }
                }
            }
            buffer = eventChunks[eventChunks.length - 1];
        }
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            console.error(`Error running workflow ${workflow.name}:`, error);
            setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: `Error: Failed to get response from workflow ${workflow.name}.`, isStreaming: false } : msg));
        }
    } finally {
        if (!signal.aborted) {
            setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false, workflowRun: msg.workflowRun ? { ...msg.workflowRun, status: 'completed' } : undefined } : msg));
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

    let workflowsToSendTo: Workflow[] = [];
    const workflowNameMatches = [...messageToSend.matchAll(/!\[([^\]]+)\]/g)];

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

    if (workflowNameMatches.length > 0) {
      for (const match of workflowNameMatches) {
        const taggedWorkflow = workflows.find((workflow) => workflow.name === match[1]);
        if (taggedWorkflow && !workflowsToSendTo.some((w) => w.id === taggedWorkflow.id)) {
          workflowsToSendTo.push(taggedWorkflow);
        }
      }
    }

    if (agentsToSendTo.length === 0 && teamsToSendTo.length === 0 && workflowsToSendTo.length === 0) {
        if (activeTarget) {
            if(activeTarget.type === 'agent') {
                agentsToSendTo.push(activeTarget.data as Agent);
            } else if (activeTarget.type === 'team') {
                teamsToSendTo.push(activeTarget.data as Team);
            } else {
                workflowsToSendTo.push(activeTarget.data as Workflow);
            }
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

    const botWorkflowMessagePlaceholders: Message[] = workflowsToSendTo.map((workflow) => ({
      id: crypto.randomUUID(),
      text: '',
      sender: 'bot',
      isStreaming: true,
      workflowRun: {
        workflow,
        status: 'running',
        steps: [],
        finalContent: '',
      },
      userMessageId: userMessage.id,
    }));

    setMessages((prev) => [...prev, userMessage, ...botAgentMessagePlaceholders, ...botWorkflowMessagePlaceholders]);
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

    // Update activeTarget for next message
    if (agentsToSendTo.length === 1 && teamsToSendTo.length === 0 && workflowsToSendTo.length === 0) {
        setActiveTarget({ type: 'agent', data: agentsToSendTo[0] });
    } else if (agentsToSendTo.length === 0 && teamsToSendTo.length === 1 && workflowsToSendTo.length === 0) {
        setActiveTarget({ type: 'team', data: teamsToSendTo[0] });
    } else if (agentsToSendTo.length === 0 && teamsToSendTo.length === 0 && workflowsToSendTo.length === 1) {
        setActiveTarget({ type: 'workflow', data: workflowsToSendTo[0] });
    } else if (agentsToSendTo.length > 0 || teamsToSendTo.length > 0 || workflowsToSendTo.length > 0) {
        // Multiple recipients, or a mix, reset to default
        const defaultAgent = agents.find((agent) => agent.name === 'Chat Agent') || agents.find((agent) => agent.id === 'main-agent') || agents[0] || null;
        if (defaultAgent) {
            setActiveTarget({ type: 'agent', data: defaultAgent });
        }
    }

    agentsToSendTo.forEach(async (agent, index) => {
      await runAgent(agent, userMessage, botAgentMessagePlaceholders[index].id, false);
    });
    
    teamsToSendTo.forEach(async (team) => {
      await runTeam(team, userMessage, false);
    });

    workflowsToSendTo.forEach(async (workflow, index) => {
      await runWorkflow(workflow, userMessage, botWorkflowMessagePlaceholders[index].id);
    });
  }, [messageToSend, attachments, isGenerating, agents, teams, workflows, activeTarget, sessionId, isNewSession, updateMessageToSendState, runAgent, runTeam, runWorkflow]);

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
        await runTeam(botMsg.team, messageToRegenerate, true, botMsg.id);
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

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
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
    currentRunId, agents, activeTarget, showAgentSuggestions, agentSearchQuery,
    filteredAgents, activeSuggestionIndex, isInitialView, isGenerating,
    sessions, isNewSession,
    
    messagesEndRef, fileInputRef, inputRef,

    setMessages, setMessageToSend, setAttachments, setCharacterCount,
    setCurrentRunId, setAgents, setActiveTarget, setShowAgentSuggestions,
    setAgentSearchQuery, setFilteredAgents, setActiveSuggestionIndex,
    fetchAgents, updateMessageToSendState, handleResetTarget,
    handleNewSession, handleCancel, createAgentChip, handleAgentSelect,
    handleSelectSession, handleDeleteSession,

    handleSend, handlePromptClick, handleFileChange, handleRemoveAttachment,
    handleRegenerate, handleVersionChange,

    teams, fetchTeams, showTeamSuggestions, setShowTeamSuggestions,
    setTeamSearchQuery, filteredTeams, activeTeamSuggestionIndex,
    setActiveTeamSuggestionIndex, handleTeamSelect,
    
    workflows, fetchWorkflows, showWorkflowSuggestions, setShowWorkflowSuggestions,
    setWorkflowSearchQuery, filteredWorkflows, activeWorkflowSuggestionIndex,
    setActiveWorkflowSuggestionIndex, handleWorkflowSelect,
  };
};