export interface EnglishRecord {
  id: string;
  type: 'dictation' | 'speaking' | 'vocabulary' | 'exam';
  date: string;
  duration: number;
  title?: string;
  content?: string;
  score?: {
    fluency: number;
    vocabulary: number;
    grammar: number;
    pronunciation: number;
  };
  notes?: string;
}

export interface Word {
  id: string;
  word: string;
  meaning: string;
  phonetic: string;
  example?: string;
  addedDate: string;
  mastered: boolean;
  reviewCount: number;
  lastReviewDate?: string;
}

export interface WrongQuestion {
  id: string;
  type: 'vocabulary' | 'grammar' | 'listening' | 'reading';
  question: string;
  answer: string;
  myAnswer: string;
  analysis: string;
  date: string;
  reviewed: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  totalPages?: number;
  startDate: string;
  finishedDate?: string;
  status: 'reading' | 'finished' | 'paused';
}

export interface ReadingNote {
  id: string;
  bookId: string;
  chapter: string;
  keyPoints: string;
  reflection: string;
  duration: number;
  date: string;
}

export interface SportRecord {
  id: string;
  type: string;
  duration: number;
  distance?: number;
  date: string;
  note?: string;
}

export interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  sportSummary: {
    totalDays: number;
    totalDuration: number;
    records: SportRecord[];
  };
  readingSummary: {
    totalBooks: number;
    totalDuration: number;
    notes: ReadingNote[];
  };
  englishSummary: {
    totalDuration: number;
    records: EnglishRecord[];
    newWords: number;
    reviewedMistakes: number;
  };
  generatedAt: string;
}

export type SportType = '跑步' | '游泳' | '健身' | '篮球' | '足球' | '羽毛球' | '骑行' | '瑜伽' | '跳绳' | '其他';
