
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon, BotIcon, BrainCircuitIcon, PaperClipIcon, DocumentIcon, XMarkIcon } from '../components/IconComponents';
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

interface Attachment {
  id: string;
  file: File;
}

const ChatView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      text: "Hello! I'm your AI Assistant. How can I help you be more creative or productive today?",
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (input.trim() === '' && attachments.length === 0) return;

    let messageText = input;
    if (attachments.length > 0) {
      const fileNames = attachments.map(a => a.file.name).join(', ');
      messageText += `\n(Attached: ${fileNames})`;
    }
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: messageText,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsTyping(true);

    // Dummy bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: crypto.randomUUID(),
        text: "This is a dummy response. I'm not connected to a real AI yet, but I'm looking forward to chatting with you!",
        sender: 'bot',
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: crypto.randomUUID(),
        file: file,
      }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
    // Reset the input value to allow re-uploading the same file
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleRemoveAttachment = (idToRemove: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== idToRemove));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }


  return (
    <div className="flex flex-col h-screen max-h-screen w-full p-4 md:p-8">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Studio
        </button>
      </header>

      <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-lg border border-white/10 shadow-2xl shadow-blue-500/10 rounded-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-4 p-4 border-b border-white/10">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full">
            <BrainCircuitIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Agent Studio</h1>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-4 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && (
                  <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10">
                    <BotIcon className="w-6 h-6 text-cyan-300" />
                  </div>
                )}
                
                <div className={`max-w-md p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-800 rounded-bl-none'}`}>
                  <p className="text-white whitespace-pre-wrap">{msg.text}</p>
                </div>

                {msg.sender === 'user' && (
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/8.x/personas/svg?seed=Alex`} alt="User Avatar" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-4 animate-fade-in">
                <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center bg-gray-700 border border-white/10">
                  <BotIcon className="w-6 h-6 text-cyan-300" />
                </div>
                <div className="max-w-md p-4 rounded-2xl bg-gray-800 rounded-bl-none flex items-center gap-2">
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
        <div className="p-4 border-t border-white/10">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="group relative w-48 p-2 bg-gray-700/50 border border-white/10 rounded-lg flex items-center gap-2 animate-fade-in overflow-hidden">
                  <DocumentIcon className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate" title={attachment.file.name}>{attachment.file.name}</p>
                    <p className="text-gray-400 text-[10px]">
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
    </div>
  );
};

export default ChatView;
