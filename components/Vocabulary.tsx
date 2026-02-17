
import React from 'react';
import { VocabularyItem } from '../types';

interface VocabularyProps {
  vocabulary: VocabularyItem[];
}

const Vocabulary: React.FC<VocabularyProps> = ({ vocabulary }) => {
  return (
    <div className="flex-1 p-8 bg-white overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-800">Industry Glossary</h2>
          <p className="text-slate-500">Personal technical vocabulary collected from your sessions.</p>
        </div>

        {vocabulary.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <div className="text-4xl mb-4">🏗️</div>
            <p className="text-slate-400">Ask "What does this word mean?" during a chat to save words here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vocabulary.map((item) => (
              <div 
                key={item.id} 
                className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-blue-600">{item.word}</h3>
                  {item.arabicMeaning && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold dir-rtl">
                      {item.arabicMeaning}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-4 flex-1">
                  <span className="font-semibold text-slate-800">Meaning:</span> {item.meaning}
                </p>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="text-xs">
                    <p className="text-slate-400 font-bold uppercase mb-1">Example</p>
                    <p className="text-slate-700 italic">"{item.example}"</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-slate-400 font-bold uppercase mb-1">Original Use</p>
                    <p className="text-slate-500">"{item.originalSentence}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vocabulary;
