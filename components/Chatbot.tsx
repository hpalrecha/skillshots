
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Topic } from '../types';
import { getChatbotResponse } from '../services/geminiService';
import { XIcon, SendIcon, LoaderIcon, BrainIcon, SparklesIcon } from './icons';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, topics }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', text: 'Hello! I am your MicroLearn AI assistant. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinkingMode, setUseThinkingMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Create context awareness
    const topicList = topics.map(t => `- ${t.title} (${t.category})`).join('\n');
    const systemInstruction = `You are a helpful learning assistant for "SkillShots".
    The user has access to the following learning topics/courses:
    ${topicList}
    
    If the user asks about these specific topics, try to guide them to the content or answer based on general knowledge about those subjects.
    Be concise and encouraging.`;

    try {
      const botResponseText = await getChatbotResponse(inputValue, useThinkingMode, systemInstruction);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 w-full max-w-sm h-[60vh] flex flex-col bg-white rounded-xl shadow-2xl z-50 animate-fade-in-up">
      <header className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
        <h2 className="text-lg font-bold text-gray-800">AI Assistant</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <XIcon className="h-6 w-6" />
        </button>
      </header>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
        <div className="space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl bg-gray-200 text-gray-800 flex items-center">
                <LoaderIcon className="animate-spin h-5 w-5 text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t bg-white rounded-b-xl">
        <div className="flex items-center justify-center mb-2">
            <label htmlFor="thinking-mode-toggle" className="flex items-center cursor-pointer">
                <div className="relative">
                    <input type="checkbox" id="thinking-mode-toggle" className="sr-only" checked={useThinkingMode} onChange={() => setUseThinkingMode(!useThinkingMode)} />
                    <div className="block bg-gray-200 w-14 h-8 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${useThinkingMode ? 'transform translate-x-6 bg-secondary' : ''}`}></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium flex items-center">
                    {useThinkingMode ? <BrainIcon className="h-5 w-5 mr-1 text-secondary"/> : <SparklesIcon className="h-5 w-5 mr-1 text-primary"/>}
                    {useThinkingMode ? 'Thinking Mode' : 'Quick Mode'}
                </div>
            </label>
        </div>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-3 bg-primary text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
