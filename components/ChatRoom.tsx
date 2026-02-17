
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session, Message, VocabularyItem } from '../types';
import { GeminiLiveManager } from '../services/geminiService';

interface ChatRoomProps {
  activeSession: Session | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLiveStateChange: (isLive: boolean) => void;
  onSaveSession: (session: Session) => void;
  onSaveVocab: (item: VocabularyItem) => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ 
  activeSession, 
  isSidebarOpen, 
  onToggleSidebar, 
  onLiveStateChange,
  onSaveSession, 
  onSaveVocab 
}) => {
  const [messages, setMessages] = useState<Message[]>(activeSession?.messages || []);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState<{ user: string; model: string }>({ user: '', model: '' });
  const managerRef = useRef<GeminiLiveManager | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(activeSession?.id || Math.random().toString(36).substring(7));

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timer);
  }, [messages, streamingText, scrollToBottom]);

  const handleMessage = useCallback((text: string, role: 'user' | 'model', isFinal: boolean) => {
    setStreamingText(prev => ({
      ...prev,
      [role]: isFinal ? '' : text
    }));

    if (isFinal) {
      const newMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role,
        text,
        timestamp: Date.now()
      };

      setMessages(prev => {
        const updated = [...prev, newMessage];
        onSaveSession({
          id: sessionIdRef.current,
          title: updated[0]?.text.substring(0, 40) + '...',
          messages: updated,
          startTime: updated[0]?.timestamp || Date.now()
        });
        return updated;
      });
    }
  }, [onSaveSession]);

  const handleVocabularyFound = useCallback((data: { 
    word: string; 
    meaning: string; 
    arabicMeaning: string; 
    example: string; 
    originalSentence: string 
  }) => {
    const vocabItem: VocabularyItem = {
      id: Math.random().toString(36).substring(7),
      word: data.word,
      meaning: data.meaning,
      arabicMeaning: data.arabicMeaning,
      example: data.example,
      originalSentence: data.originalSentence,
      timestamp: Date.now()
    };
    onSaveVocab(vocabItem);
  }, [onSaveVocab]);

  const toggleLive = async () => {
    if (isLive || isConnecting) {
      setError(null);
      await managerRef.current?.disconnect();
      setIsLive(false);
      setIsConnecting(false);
      onLiveStateChange(false);
      managerRef.current = null;
    } else {
      setError(null);
      setIsConnecting(true);
      
      try {
        if (!managerRef.current) {
          managerRef.current = new GeminiLiveManager();
        }
        await managerRef.current.connect({
          onMessage: handleMessage,
          onVocabularyFound: handleVocabularyFound,
          onError: (err) => {
            console.error(err);
            setError("Connection error. Please check your microphone permissions.");
            setIsLive(false);
            setIsConnecting(false);
            onLiveStateChange(false);
          },
          onClose: () => {
            setIsLive(false);
            setIsConnecting(false);
            onLiveStateChange(false);
          }
        });
        setIsLive(true);
        setIsConnecting(false);
        onLiveStateChange(true);
      } catch (err: any) {
        setError(err.message || "Failed to start session.");
        setIsConnecting(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-[100dvh] overflow-hidden relative">
      <header className="px-4 py-3 sm:px-6 sm:py-4 border-b flex items-center justify-between bg-white shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={onToggleSidebar} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className={`w-6 h-6 text-slate-600 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-extrabold text-slate-800">
              {isConnecting ? 'Connecting...' : isLive ? 'Live Training Session' : 'PetroEnglish Coach'}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
                Coach Puck
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={toggleLive}
          disabled={isConnecting}
          className={`px-5 py-2 sm:px-8 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            isLive 
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95'
          }`}
        >
          {isConnecting ? 'Wait...' : isLive ? 'End Session' : '🎙️ Start Coaching'}
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-3 text-red-600 text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 space-y-8 bg-slate-50/40"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[98%] sm:max-w-[90%] lg:max-w-[85%] h-auto rounded-3xl p-5 sm:p-6 shadow-sm border overflow-visible break-words ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white border-blue-700' 
                : 'bg-white text-slate-800 border-slate-200'
            }`}>
              <p className="text-sm sm:text-[17px] leading-relaxed whitespace-pre-wrap break-words overflow-visible">
                {msg.text}
              </p>
              <div className={`flex items-center gap-2 mt-4 opacity-60 text-[10px] sm:text-[11px] font-medium ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && <span className="font-bold uppercase tracking-wider">Coach Puck</span>}
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        ))}

        {streamingText.user && (
          <div className="flex justify-end opacity-80 w-full">
            <div className="max-w-[98%] sm:max-w-[90%] h-auto rounded-3xl p-5 bg-blue-500 text-white italic border border-blue-600 break-words overflow-visible">
              <p className="text-sm sm:text-[17px] leading-relaxed whitespace-pre-wrap">{streamingText.user}</p>
            </div>
          </div>
        )}
        {streamingText.model && (
          <div className="flex justify-start w-full">
            <div className="max-w-[98%] sm:max-w-[90%] h-auto rounded-3xl p-5 bg-white text-slate-800 italic border border-slate-200 shadow-sm break-words overflow-visible">
              <p className="text-sm sm:text-[17px] leading-relaxed whitespace-pre-wrap">{streamingText.model}</p>
            </div>
          </div>
        )}
      </div>

      <div className={`shrink-0 border-t bg-white transition-all duration-500 ${isLive ? 'pb-10 pt-6 px-6' : 'pb-6 pt-4 px-6'}`}>
        <div className="max-w-3xl mx-auto w-full">
           {isLive || isConnecting ? (
             <div className="flex flex-col items-center gap-4">
               <div className="w-full h-16 sm:h-20 bg-blue-50/50 rounded-3xl flex items-center justify-center px-6 gap-1 sm:gap-1.5 border border-blue-100 overflow-hidden shadow-inner">
                 {[...Array(45)].map((_, i) => (
                   <div 
                    key={i} 
                    className={`flex-1 max-w-[3px] sm:max-w-[4px] bg-blue-500 rounded-full ${isLive ? 'animate-bounce' : 'opacity-20'}`}
                    style={{ 
                      height: isLive ? `${Math.random() * 75 + 15}%` : '20%',
                      animationDelay: `${i * 0.015}s`,
                      animationDuration: '0.6s'
                    }}
                   />
                 ))}
               </div>
               <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 ${isLive ? 'bg-blue-600 animate-ping' : 'bg-slate-400'}`}></span>
                 <p className="text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-widest">
                   {isLive ? 'Coach is listening...' : 'Initializing connection...'}
                 </p>
               </div>
             </div>
           ) : (
             <div className="flex items-center justify-center text-slate-400 text-[10px] sm:text-xs font-bold gap-4 px-4">
               <div className="h-[1px] bg-slate-200 flex-1"></div>
               <span className="uppercase tracking-widest whitespace-nowrap">Press Start to Begin Conversation</span>
               <div className="h-[1px] bg-slate-200 flex-1"></div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
