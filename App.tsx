
import React, { useState, useEffect } from 'react';
import { View, Session, VocabularyItem } from './types';
import Sidebar from './components/Sidebar';
import ChatRoom from './components/ChatRoom';
import History from './components/History';
import Vocabulary from './components/Vocabulary';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [vocab, setVocab] = useState<VocabularyItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLiveSession, setIsLiveSession] = useState(false);

  useEffect(() => {
    setHistory(storageService.getSessions());
    setVocab(storageService.getVocabulary());
  }, []);

  // When a live session starts, hide the sidebar automatically for full conversation mode
  useEffect(() => {
    if (isLiveSession) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isLiveSession]);

  const handleOpenHistory = (session: Session) => {
    setActiveSession(session);
    setCurrentView(View.CHAT);
  };

  const handleNewSession = () => {
    setActiveSession(null);
    setCurrentView(View.CHAT);
    setIsLiveSession(false);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Sidebar - Pushed off-screen or hidden based on state */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!isSidebarOpen ? 'lg:w-0 lg:overflow-hidden' : 'lg:w-64'}`}
      >
        <Sidebar 
          currentView={currentView} 
          onNavigate={(view) => {
            setCurrentView(view);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }} 
          onNewChat={handleNewSession}
        />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {currentView === View.CHAT && (
          <ChatRoom 
            activeSession={activeSession} 
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
            onLiveStateChange={setIsLiveSession}
            onSaveSession={(s) => {
              storageService.saveSession(s);
              setHistory(storageService.getSessions());
            }}
            onSaveVocab={(v) => {
              storageService.saveVocabulary(v);
              setVocab(storageService.getVocabulary());
            }}
          />
        )}
        
        {currentView === View.HISTORY && (
          <div className="flex-1 flex flex-col h-full bg-white">
            <header className="px-6 py-4 border-b flex items-center gap-4">
               <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg">
                 <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                 </svg>
               </button>
               <h2 className="font-bold text-slate-800">Session History</h2>
            </header>
            <History 
              sessions={history} 
              onOpen={handleOpenHistory} 
            />
          </div>
        )}
        
        {currentView === View.VOCABULARY && (
          <div className="flex-1 flex flex-col h-full bg-white">
            <header className="px-6 py-4 border-b flex items-center gap-4">
               <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg">
                 <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                 </svg>
               </button>
               <h2 className="font-bold text-slate-800">Industry Glossary</h2>
            </header>
            <Vocabulary vocabulary={vocab} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
