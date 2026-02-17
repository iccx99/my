
import { Session, VocabularyItem } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'petro_english_sessions',
  VOCABULARY: 'petro_english_vocabulary',
};

export const storageService = {
  saveSession: (session: Session) => {
    const existing = storageService.getSessions();
    const index = existing.findIndex(s => s.id === session.id);
    if (index !== -1) {
      existing[index] = session;
    } else {
      existing.unshift(session);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(existing));
  },

  getSessions: (): Session[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  saveVocabulary: (item: VocabularyItem) => {
    const existing = storageService.getVocabulary();
    if (!existing.some(v => v.word.toLowerCase() === item.word.toLowerCase())) {
      existing.unshift(item);
      localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(existing));
    }
  },

  getVocabulary: (): VocabularyItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VOCABULARY);
    return data ? JSON.parse(data) : [];
  },

  clearAll: () => {
    localStorage.clear();
  }
};
