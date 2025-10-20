import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon, BotIcon, BrainCircuitIcon } from '../components/IconComponents';
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
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
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
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
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything..."
              rows={1}
              className="w-full bg-gray-800/80 border border-white/10 rounded-lg py-3 pl-4 pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all custom-scrollbar"
              style={{maxHeight: '150px'}}
            />
            <button
              onClick={handleSend}
              disabled={input.trim() === '' || isTyping}
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