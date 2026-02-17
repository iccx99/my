
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onNewChat }) => {
  const navItems = [
    { id: View.CHAT, label: 'Live Coach', icon: '🎙️' },
    { id: View.HISTORY, label: 'History', icon: '📚' },
    { id: View.VOCABULARY, label: 'Vocabulary', icon: '🔤' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-blue-400">Petro</span>English
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Language Trainer</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-sm font-medium mb-6 shadow-lg shadow-blue-900/20"
        >
          <span>➕</span> New Session
        </button>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              currentView === item.id 
                ? 'bg-slate-800 text-blue-400 ring-1 ring-slate-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 bg-slate-800/50 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
            JD
          </div>
          <div>
            <p className="text-sm font-medium">Field Engineer</p>
            <p className="text-xs text-slate-500">Free Tier</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
