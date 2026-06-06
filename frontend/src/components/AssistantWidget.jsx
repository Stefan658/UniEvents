import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Tag, 
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { sendAssistantMessage } from '../api/assistant';

const AssistantWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "Ce evenimente sunt populare?",
    "Ce evenimente online sunt disponibile?",
    "Ce îmi recomanzi?",
    "Ce badge-uri am?"
  ]);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Salut! Te pot ajuta să descoperi evenimente, recomandări, badge-uri sau lista de așteptare.",
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendAssistantMessage(messageText);
      
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.answer,
        events: response.events || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Ne pare rău, a apărut o eroare. Te rugăm să încerci din nou mai târziu.",
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      data-testid="unievents-assistant-widget"
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'auto'
      }}
    >
      {/* Chat Panel */}
      {isOpen && (
        <div 
          className="mb-4 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{
            width: 'clamp(320px, 90vw, 420px)',
            height: 'clamp(400px, 70vh, 600px)',
            maxHeight: 'calc(100vh - 120px)'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-violet-600 p-6 text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 -mr-8 -mt-8" />
            </div>
            <div className="relative z-10 flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight tracking-tight">UniEvents Assistant</h3>
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest opacity-80">Online & Ready to Help</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="relative z-10 p-2 hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-1' : 'order-2'}`}>
                  <div 
                    className={`p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-primary-600 text-white rounded-tr-none' 
                        : msg.isError 
                          ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                          : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}

                    {/* Event Results List */}
                    {msg.events && msg.events.length > 0 && (
                      <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                        {msg.events.map((event) => (
                          <div 
                            key={event.id}
                            className="bg-gray-50 rounded-2xl p-3 border border-gray-100 group cursor-pointer hover:border-primary-200 transition-all"
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/events/${event.id}`);
                            }}
                          >
                            <h4 className="text-xs font-black text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">{event.title}</h4>
                            <div className="flex items-center text-[10px] text-gray-500 font-bold space-x-3">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(event.start_at)}
                              </span>
                              <span className="flex items-center">
                                <Tag className="w-3 h-3 mr-1" />
                                {event.category_name || 'Event'}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center text-[10px] font-black text-primary-600 uppercase tracking-widest">
                              View Details <ChevronRight className="w-3 h-3 ml-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] font-bold text-gray-400 mt-2 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <RefreshCcw className="w-4 h-4 text-primary-500 animate-spin" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assistant is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Suggestions */}
          <div className="p-6 bg-white border-t border-gray-100">
            {/* Quick Suggestions */}
            {suggestions.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(s)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-600 border border-gray-100 hover:border-primary-100 rounded-xl text-[10px] font-bold transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="relative"
            >
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about events, recommendations..."
                className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open UniEvents Assistant"
        className={`rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 relative group ${
          isOpen ? 'bg-white text-primary-600 border border-gray-100 rotate-90' : 'bg-gradient-to-br from-primary-600 via-primary-500 to-violet-600 text-white hover:shadow-primary-500/40 hover:-translate-y-1'
        }`}
        style={{
          width: isOpen ? '56px' : '84px',
          height: isOpen ? '56px' : '84px',
        }}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-12 h-12" />}
        {!isOpen && (
          <>
            <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -top-2 -left-2 z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-primary-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                  AI
                </div>
              </div>
            </div>
          </>
        )}
      </button>
    </div>,
    document.body
  );
};

export default AssistantWidget;
