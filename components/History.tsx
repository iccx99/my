
import React from 'react';
import { Session } from '../types';

interface HistoryProps {
  sessions: Session[];
  onOpen: (session: Session) => void;
}

const History: React.FC<HistoryProps> = ({ sessions, onOpen }) => {
  return (
    <div className="flex-1 p-8 bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Training History</h2>
            <p className="text-slate-500">Review your past roleplays and improvements.</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{sessions.length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Sessions</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">No sessions recorded yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onOpen(session)}
                className="group flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    📄
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 truncate max-w-md">{session.title}</h3>
                    <p className="text-xs text-slate-500">
                      {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{session.messages.length}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Exchanges</p>
                  </div>
                  <span className="text-slate-300 group-hover:text-blue-500">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
