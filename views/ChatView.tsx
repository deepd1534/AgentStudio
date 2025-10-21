import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon, BotIcon, BrainCircuitIcon, PaperClipIcon, DocumentIcon, XMarkIcon, ClipboardCopyIcon, CheckIcon } from '../components/IconComponents';
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

const parseMarkdown = (text: string) => {
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  const codeBlockRegex = /```([^\n]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    parts.push({
      type: 'code',
      language: match[1].trim().split(/\s+/)[0] || 'plaintext',
      content: match[2].trim(),
    });

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return parts;
};

const renderTextMarkdown = (text: string): string => {
  if (!text) return '';

  const processInlines = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700/50 text-cyan-300 rounded px-1.5 py-1 font-mono text-sm">$1</code>');
  };

  const blocks = text.split(/\n\s*\n/);

  const htmlBlocks = blocks.map(block => {
    if (!block.trim()) return '';

    // Headings
    const headingMatch = block.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = processInlines(headingMatch[2].trim());
      return `<h${level}>${content}</h${level}>`;
    }

    // Horizontal Rule
    if (block.match(/^(\*\*\*|---|___)\s*$/)) {
      return '<hr />';
    }
    
    // Blockquotes
    if (block.startsWith('>')) {
      const content = block.split('\n').map(line => line.replace(/^>\s?/, '')).join('\n');
      return `<blockquote>${processInlines(content).replace(/\n/g, '<br />')}</blockquote>`;
    }

    // Lists
    if (block.match(/^\s*(\*|-)\s/)) {
      const items = block.split('\n').map(item => {
        const content = processInlines(item.replace(/^\s*(\*|-)\s/, ''));
        return `<li>${content}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    }

    // Paragraphs
    return `<p>${processInlines(block).replace(/\n/g, '<br />')}</p>`;
  });

  return htmlBlocks.join('');
};


const TextContent: React.FC<{ content: string }> = ({ content }) => {
  const htmlContent = useMemo(() => renderTextMarkdown(content), [content]);
  return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

const CodeBlock: React.FC<{ language: string; content: string }> = ({ language, content }) => {
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current && window.hljs) {
      window.hljs.highlightElement(codeRef.current);
    }
  }, [content, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }, (err) => {
      console.error('Failed to copy: ', err);
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
    const intervalId = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '.';
        return prev + '.';
      });
    }, 400);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <span className="inline-block ml-1 text-gray-400 italic">
      thinking{dots}
    </span>
  );
};


const BotMessageContent: React.FC<{ text: string; isStreaming?: boolean }> = ({ text, isStreaming }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
      if (!isStreaming) {
        setDisplayedText(text);
        return;
      }
      
      if (displayedText.length < text.length) {
          const timeoutId = setTimeout(() => {
              const nextLength = Math.min(text.length, displayedText.length + 50);
              setDisplayedText(text.slice(0, nextLength));
          }, 5); // Typing speed: very fast
          return () => clearTimeout(timeoutId);
      }
    }, [text, displayedText, isStreaming]);
    
    const messageParts = useMemo(() => parseMarkdown(displayedText), [displayedText]);

    return (
        <div className="text-white break-words">
            {messageParts.map((part, index) => {
                if (part.type === 'code') {
                    return <CodeBlock key={index} language={part.language || 'code'} content={part.content} />;
                }
                return <TextContent key={index} content={part.content} />;
            })}
            {isStreaming && <ThinkingIndicator />}
        </div>
    );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const ChatView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      text: "Hello! I'm your AI Assistant. How can I help you be more creative or productive today?",
      sender: 'bot',
      isStreaming: false,
    }
  ]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setSessionId(crypto.randomUUID());

    // Cleanup object URLs on component unmount
    return () => {
      attachmentUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (input.trim() === '' && attachments.length === 0) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      sender: 'user',
      attachments: attachments,
    };

    const botMessageId = crypto.randomUUID();
    const botMessagePlaceholder: Message = { id: botMessageId, text: '', sender: 'bot', isStreaming: true };

    setMessages(prev => [...prev, userMessage, botMessagePlaceholder]);
    setInput('');
    setAttachments([]);
    setIsTyping(true);

    const formData = new FormData();
    formData.append('agent_id', 'ChatAgent');
    formData.append('message', input);
    formData.append('stream', 'true');
    formData.append('session_id', sessionId);
    formData.append('user_id', 'deep');
    attachments.forEach(attachment => {
      formData.append('files', attachment.file);
    });

    try {
      const response = await fetch('http://localhost:7777/agents/ChatAgent/runs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setIsTyping(false);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamingEnded = false;

      while (!streamingEnded) {
        const { done, value } = await reader.read();
        if (done) {
          streamingEnded = true;
          setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const messageParts = buffer.split('\n\n');
        buffer = messageParts.pop() || '';

        for (const part of messageParts) {
          if (!part.trim()) continue;

          let eventName = 'message';
          const dataLines: string[] = [];
          const lines = part.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.substring('event: '.length).trim();
            } else if (line.startsWith('data: ')) {
              dataLines.push(line.substring('data: '.length));
            }
          }
          
          const eventData = dataLines.join('\n');

          if (eventData) {
            try {
              const jsonData = JSON.parse(eventData);
              if (eventName === 'RunContent') {
                const content = jsonData.content || '';
                setMessages(prev => prev.map(msg =>
                  msg.id === botMessageId ? { ...msg, text: msg.text + content } : msg
                ));
              } else if (eventName === 'RunCompleted') {
                setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
                streamingEnded = true;
              } else if (eventName === 'RunStarted') {
                console.log('Run started:', jsonData);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', eventData, e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      console.error(
        "Hint: This error often occurs if the backend server at http://localhost:7777 is not running, or if there's a CORS issue. Please ensure your server is active and configured to accept requests from this origin."
      );
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId ? { ...msg, text: "Sorry, I couldn't connect to the agent. Please check if your local server is running correctly and try again.", isStreaming: false } : msg
      ));
    } finally {
      setIsTyping(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => {
        let previewUrl: string | undefined = undefined;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
          attachmentUrlsRef.current.add(previewUrl);
        }
        return {
          id: crypto.randomUUID(),
          file: file,
          previewUrl,
        };
      });
      setAttachments(prev => [...prev, ...newFiles]);
    }
    // Reset the input value to allow re-uploading the same file
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleRemoveAttachment = (idToRemove: string) => {
    const attachmentToRemove = attachments.find(att => att.id === idToRemove);
    if (attachmentToRemove?.previewUrl) {
      URL.revokeObjectURL(attachmentToRemove.previewUrl);
      attachmentUrlsRef.current.delete(attachmentToRemove.previewUrl);
    }
    setAttachments(prev => prev.filter(attachment => attachment.id !== idToRemove));
  };


  return (
    <div className="flex flex-col h-screen max-h-screen w-full bg-black/20 backdrop-blur-lg">
      <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group w-40">
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Studio</span>
        </button>
        <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full">
              <BrainCircuitIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Agent Studio</h1>
        </div>
        <div className="w-40" />
      </header>
      
      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-6">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex items-start gap-4 animate-fade-in justify-end">
                  <div className="max-w-md rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 rounded-br-none overflow-hidden">
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`p-2 grid grid-cols-2 sm:grid-cols-3 gap-2 ${msg.text.trim() ? 'border-b border-white/20' : ''}`}>
                        {msg.attachments.map(att => (
                          <div key={att.id} className="bg-black/20 rounded-lg overflow-hidden relative group">
                            {att.previewUrl ? (
                              <img src={att.previewUrl} alt={att.file.name} className="w-full h-auto object-cover" />
                            ) : (
                              <div className="p-2 flex items-center gap-2 overflow-hidden aspect-square justify-center">
                                <div className="flex-1 min-w-0 text-center">
                                  <DocumentIcon className="w-6 h-6 text-gray-200 mx-auto" />
                                  <p className="text-white text-xs font-medium break-all mt-1" title={att.file.name}>{att.file.name}</p>
                                  <p className="text-gray-300 text-[10px]">{formatFileSize(att.file.size)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.text.trim() && (
                      <div className="p-4">
                        <p className="text-white whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    )}
                  </div>
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/8.x/personas/svg?seed=Alex`} alt="User Avatar" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </div>
              );
            }
            
            return (
              <div key={msg.id} className="animate-fade-in w-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10">
                    <BotIcon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div className="flex-1 pt-2 min-w-0">
                    <BotMessageContent text={msg.text} isStreaming={msg.isStreaming} />
                  </div>
                </div>
              </div>
            );
          })}
           {isTyping && (
                <div key="typing-indicator" className="flex items-start gap-4 animate-fade-in">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10">
                    <BotIcon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div className="py-4 px-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/30 flex-shrink-0">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="group relative bg-gray-700/50 border border-white/10 rounded-lg animate-fade-in overflow-hidden w-24 h-24">
                {attachment.previewUrl ? (
                    <img src={attachment.previewUrl} alt={attachment.file.name} title={attachment.file.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                        <DocumentIcon className="w-8 h-8 text-gray-300" />
                        <p className="text-white text-xs font-medium truncate mt-2 w-full" title={attachment.file.name}>{attachment.file.name}</p>
                    </div>
                )}
                <div className="absolute bottom-0 left-0 w-full bg-black/60 p-1 text-center backdrop-blur-sm">
                    <p className="text-gray-300 text-[10px]">
                        {formatFileSize(attachment.file.size)}
                    </p>
                </div>
                <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                    aria-label={`Remove ${attachment.file.name}`}
                >
                    <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative">
           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
           <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Attach file"
            >
              <PaperClipIcon className="w-5 h-5 text-gray-400" />
            </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me anything..."
            rows={1}
            className="w-full bg-gray-800/80 border border-white/10 rounded-lg py-3 pl-12 pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all custom-scrollbar"
            style={{maxHeight: '150px'}}
          />
          <button
            onClick={handleSend}
            disabled={(input.trim() === '' && attachments.length === 0) || isTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;