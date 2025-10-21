import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowLeftIcon, PaperAirplaneIcon, BotIcon, BrainCircuitIcon, PaperClipIcon, 
  DocumentIcon, XMarkIcon, ClipboardCopyIcon, CheckIcon, UserCircleIcon, 
  EnvelopeIcon, Bars3BottomLeftIcon, Cog6ToothIcon, ArrowPathIcon 
} from '../components/IconComponents';
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar';

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

declare global {
  interface Window {
    hljs: any;
  }
}

// --- Markdown Parsers and Renderers ---
const parseMarkdown = (text: string) => {
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  const codeBlockRegex = /```([^\n]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', language: match[1].trim().split(/\s+/)[0] || 'plaintext', content: match[2].trim() });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }
  return parts;
};

const renderTextMarkdown = (text: string): string => {
  if (!text) return '';
  const processInlines = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`(.*?)`/g, '<code class="bg-gray-700/50 text-cyan-300 rounded px-1.5 py-1 font-mono text-sm">$1</code>');
  const blocks = text.split(/\n\s*\n/);
  return blocks.map(block => {
    if (!block.trim()) return '';
    const headingMatch = block.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) return `<h${headingMatch[1].length}>${processInlines(headingMatch[2].trim())}</h${headingMatch[1].length}>`;
    if (block.match(/^(\*\*\*|---|___)\s*$/)) return '<hr />';
    if (block.startsWith('>')) return `<blockquote>${processInlines(block.split('\n').map(line => line.replace(/^>\s?/, '')).join('\n')).replace(/\n/g, '<br />')}</blockquote>`;
    if (block.match(/^\s*(\*|-)\s/)) return `<ul>${block.split('\n').map(item => `<li>${processInlines(item.replace(/^\s*(\*|-)\s/, ''))}</li>`).join('')}</ul>`;
    return `<p>${processInlines(block).replace(/\n/g, '<br />')}</p>`;
  }).join('');
};

const TextContent: React.FC<{ content: string }> = ({ content }) => {
  const htmlContent = useMemo(() => renderTextMarkdown(content), [content]);
  return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

// --- Sub-components ---
const CodeBlock: React.FC<{ language: string; content: string }> = ({ language, content }) => {
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current && window.hljs) window.hljs.highlightElement(codeRef.current);
  }, [content, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-800/70 border border-white/10 rounded-lg my-4 overflow-hidden animate-fade-in">
      <div className="flex justify-between items-center px-4 py-2 bg-black/20">
        <span className="text-xs font-semibold text-gray-400 uppercase">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors disabled:opacity-50" disabled={isCopied}>
          {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardCopyIcon className="w-4 h-4" />}
          <span className="font-sans">{isCopied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto custom-scrollbar"><code ref={codeRef} className={`language-${language} text-sm`}>{content}</code></pre>
    </div>
  );
};

const ThinkingIndicator: React.FC = () => {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const intervalId = setInterval(() => setDots(prev => prev.length >= 3 ? '.' : prev + '.'), 400);
    return () => clearInterval(intervalId);
  }, []);
  return <span className="inline-block ml-1 text-gray-400 italic">thinking{dots}</span>;
};

const BotMessageContent: React.FC<{ text: string; isStreaming?: boolean }> = ({ text, isStreaming }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    if (!isStreaming) { setDisplayedText(text); return; }
    if (displayedText.length < text.length) {
      const timeoutId = setTimeout(() => setDisplayedText(text.slice(0, Math.min(text.length, displayedText.length + 50))), 5);
      return () => clearTimeout(timeoutId);
    }
  }, [text, displayedText, isStreaming]);

  const messageParts = useMemo(() => parseMarkdown(displayedText), [displayedText]);

  return (
    <div className="text-white break-words">
      {messageParts.map((part, index) => part.type === 'code' ? <CodeBlock key={index} language={part.language || 'code'} content={part.content} /> : <TextContent key={index} content={part.content} />)}
      {isStreaming && <ThinkingIndicator />}
    </div>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
};

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
      <h1 className="text-4xl md:text-5xl font-bold text-gray-200">Hi there!</h1>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-400 mt-2 mb-6">What would you like to know?</h2>
      <p className="text-gray-500 mb-8">Use one of the most common prompts below or use your own to begin</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-left">
        {prompts.map((prompt, index) => (
          <button key={index} onClick={() => onPromptClick(prompt.text)} className="p-4 bg-gray-800/50 border border-white/10 rounded-lg hover:bg-gray-700/70 transition-colors group">
            <p className="text-sm text-gray-300 group-hover:text-white transition-colors flex-grow">{prompt.text}</p>
            <div className="pt-4 mt-auto text-gray-500">{prompt.icon}</div>
          </button>
        ))}
      </div>
      <button onClick={handleRefresh} className="flex items-center gap-2 text-gray-400 hover:text-white mx-auto text-sm transition-colors">
        <ArrowPathIcon className="w-4 h-4" /> Refresh Prompts
      </button>
    </div>
  );
};

// --- Main ChatView Component ---
const ChatView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  const isInitialView = messages.length === 0;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const attachmentUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setSessionId(crypto.randomUUID());
    return () => attachmentUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, isTyping]);
  useEffect(() => setCharacterCount(input.length), [input]);

  const handleSend = async (messageText?: string | React.MouseEvent<HTMLButtonElement>) => {
    const textToSend = typeof messageText === 'string' ? messageText : input;
    if (textToSend.trim() === '' && attachments.length === 0) return;

    const userMessage: Message = { id: crypto.randomUUID(), text: textToSend, sender: 'user', attachments };
    const botMessageId = crypto.randomUUID();
    const botMessagePlaceholder: Message = { id: botMessageId, text: '', sender: 'bot', isStreaming: true };

    setMessages(prev => [...prev, userMessage, botMessagePlaceholder]);
    setInput('');
    setAttachments([]);
    setIsTyping(true);

    const formData = new FormData();
    formData.append('agent_id', 'ChatAgent');
    formData.append('message', textToSend);
    formData.append('stream', 'true');
    formData.append('session_id', sessionId);
    formData.append('user_id', 'deep');
    attachments.forEach(attachment => formData.append('files', attachment.file));

    try {
      const response = await fetch('http://localhost:7777/agents/ChatAgent/runs', { method: 'POST', body: formData });
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
              const jsonData = JSON.parse(dataLines.join('\n'));
              if (eventName === 'RunContent') {
                setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: msg.text + (jsonData.content || '') } : msg));
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
    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: "Sorry, I couldn't connect to the agent. Please ensure your local server is running.", isStreaming: false } : msg));
    } finally {
      setIsTyping(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
              <div className="max-w-md rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 rounded-br-none overflow-hidden">
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className={`p-2 grid grid-cols-2 sm:grid-cols-3 gap-2 ${msg.text.trim() ? 'border-b border-white/20' : ''}`}>
                    {msg.attachments.map(att => <div key={att.id} className="bg-black/20 rounded-lg overflow-hidden relative group">{att.previewUrl ? <img src={att.previewUrl} alt={att.file.name} className="w-full h-auto object-cover" /> : <div className="p-2 flex items-center gap-2 overflow-hidden aspect-square justify-center"><div className="flex-1 min-w-0 text-center"><DocumentIcon className="w-6 h-6 text-gray-200 mx-auto" /><p className="text-white text-xs font-medium break-all mt-1" title={att.file.name}>{att.file.name}</p><p className="text-gray-300 text-[10px]">{formatFileSize(att.file.size)}</p></div></div>}</div>)}
                  </div>
                )}
                {msg.text.trim() && <div className="p-4"><p className="text-white whitespace-pre-wrap">{msg.text}</p></div>}
              </div>
              <Avatar><AvatarImage src={`https://api.dicebear.com/8.x/personas/svg?seed=Alex`} alt="User Avatar" /><AvatarFallback>U</AvatarFallback></Avatar>
            </div>
          ) : (
            <div key={msg.id} className="animate-fade-in w-full">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10"><BotIcon className="w-6 h-6 text-cyan-300" /></div>
                <div className="flex-1 pt-2 min-w-0"><BotMessageContent text={msg.text} isStreaming={msg.isStreaming} /></div>
              </div>
            </div>
          ))}
          {isTyping && !messages.some(m => m.isStreaming) && <div key="typing-indicator" className="flex items-start gap-4 animate-fade-in"><div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10"><BotIcon className="w-6 h-6 text-cyan-300" /></div><div className="py-4 px-2 flex items-center gap-2"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span></div></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className={`w-full max-w-3xl mx-auto px-4 pb-4 transition-all duration-700 ease-in-out`}>
          <InitialContent onPromptClick={handlePromptClick} isVisible={isInitialView} />
          <div className={`relative mt-4 transition-all duration-700 ease-in-out`}>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-800/50 border border-white/10 rounded-t-lg">
                {attachments.map(att => <div key={att.id} className="group relative bg-gray-700/50 border border-white/10 rounded-lg animate-fade-in overflow-hidden w-24 h-24">{att.previewUrl ? <img src={att.previewUrl} alt={att.file.name} title={att.file.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center"><DocumentIcon className="w-8 h-8 text-gray-300" /><p className="text-white text-xs font-medium truncate mt-2 w-full" title={att.file.name}>{att.file.name}</p></div>}<div className="absolute bottom-0 left-0 w-full bg-black/60 p-1 text-center backdrop-blur-sm"><p className="text-gray-300 text-[10px]">{formatFileSize(att.file.size)}</p></div><button onClick={() => handleRemoveAttachment(att.id)} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all" aria-label={`Remove ${att.file.name}`}><XMarkIcon className="w-3.5 h-3.5" /></button></div>)}
              </div>
            )}
            <div className={`bg-gray-800/80 border border-white/10 overflow-hidden transition-all duration-300 ${attachments.length > 0 ? 'rounded-b-lg' : 'rounded-lg'} ${isInitialView ? 'shadow-2xl shadow-blue-500/10' : ''}`}>
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Ask whatever you want..." className={`w-full bg-transparent p-4 resize-none focus:outline-none custom-scrollbar transition-all duration-500 ease-in-out ${isInitialView ? 'h-28' : 'h-14'}`} style={{maxHeight: '150px'}} />
              <div className="flex justify-between items-center p-2 border-t border-white/10">
                <div className="flex items-center gap-1"><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple /><button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors p-2 rounded-md"><PaperClipIcon className="w-5 h-5" /> <span className="hidden sm:inline">Add Attachment</span></button></div>
                <div className="flex items-center gap-3"><span className="text-xs text-gray-500">{characterCount}/1000</span><button onClick={handleSend} disabled={(input.trim() === '' && attachments.length === 0) || isTyping} className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Send message"><PaperAirplaneIcon className="w-5 h-5 text-white" /></button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;