import React, { useState, useRef, useEffect } from 'react';
import { Screen, CURRENT_USER } from '../types';
import { generateAIResponse } from '../services/geminiService';

interface AiChatViewProps {
  setScreen: (screen: Screen) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const AiChatView: React.FC<AiChatViewProps> = ({ setScreen }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: `Hi ${CURRENT_USER.name}! I'm your Zhiwai Smart Assistant. Ask me about your schedule, campus events, or study tips!`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const responseText = await generateAIResponse(userMsg.text);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setScreen(Screen.APPS)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                Smart Assistant
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
               <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <div className="sticky bottom-0 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 p-4 pb-safe">
        <div className="flex items-center gap-2 bg-white dark:bg-surface-dark rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent border-none outline-none text-sm h-10 placeholder:text-gray-400 focus:ring-0"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className={`p-2 rounded-full transition-colors ${
              inputText.trim() ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
            }`}
          >
            <span className="material-icons-round text-xl">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatView;