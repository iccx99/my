
export enum View {
  CHAT = 'CHAT',
  HISTORY = 'HISTORY',
  VOCABULARY = 'VOCABULARY'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
  };
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  startTime: number;
}

export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  arabicMeaning?: string;
  example: string;
  originalSentence: string;
  timestamp: number;
}
