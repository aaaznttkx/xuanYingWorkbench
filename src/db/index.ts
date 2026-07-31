import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { EnglishRecord, Word, WrongQuestion, Book, ReadingNote, SportRecord, WeeklyReport } from '../types';

class XuanYingDB extends Dexie {
  englishRecords!: Table<EnglishRecord, string>;
  words!: Table<Word, string>;
  wrongQuestions!: Table<WrongQuestion, string>;
  books!: Table<Book, string>;
  readingNotes!: Table<ReadingNote, string>;
  sportRecords!: Table<SportRecord, string>;
  weeklyReports!: Table<WeeklyReport, string>;

  constructor() {
    super('xuanYingDB');
    this.version(1).stores({
      englishRecords: 'id, type, date',
      words: 'id, word, addedDate, mastered',
      wrongQuestions: 'id, type, date, reviewed',
      books: 'id, title, status',
      readingNotes: 'id, bookId, date',
      sportRecords: 'id, type, date',
      weeklyReports: 'id, weekStart',
    });
  }
}

export const db = new XuanYingDB();

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};
