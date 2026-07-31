import { db } from '../db';
import {
  englishRecordsApi, wordsApi, wrongQuestionsApi, booksApi,
  readingNotesApi, sportRecordsApi, weeklyReportsApi
} from './client';

// ============== Sync Service ==============
// Offline-first: Dexie (local) is primary, Vercel Postgres is cloud backup
// All writes go to Dexie first, then sync to cloud in background

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

let syncStatus: SyncStatus = 'idle';
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

// Convert snake_case db columns to camelCase for frontend Dexie compatibility
function toCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    syncAll(); // Pull latest from cloud
  });
  window.addEventListener('offline', () => {
    isOnline = false;
    syncStatus = 'offline';
  });
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function getIsOnline(): boolean {
  return isOnline;
}

// Pull all data from cloud and merge into local Dexie
export async function syncAll(): Promise<void> {
  if (!isOnline) {
    syncStatus = 'offline';
    return;
  }

  syncStatus = 'syncing';
  try {
    await Promise.allSettled([
      syncEnglishRecords(),
      syncWords(),
      syncWrongQuestions(),
      syncBooks(),
      syncReadingNotes(),
      syncSportRecords(),
      syncWeeklyReports(),
    ]);
    syncStatus = 'idle';
  } catch (error) {
    console.error('Sync failed:', error);
    syncStatus = 'error';
  }
}

// Helper: sync a table from cloud → local
async function syncTable<T extends { id: string }>(
  tableName: string,
  apiList: () => Promise<T[]>,
  getLocalTable: () => any
): Promise<void> {
  try {
    const remoteData = await apiList();
    const localTable = getLocalTable();

    // Convert snake_case (DB) to camelCase (Dexie) before storing locally
    const transformedData = toCamelCase(remoteData) as T[];

    // Get existing local IDs
    const localData = await localTable.toArray();
    const remoteIds = new Set(transformedData.map(d => d.id));

    // Upsert: add/update records from remote (camelCase keys)
    for (const record of transformedData) {
      await localTable.put(record);
    }

    // Push local-only records to cloud (offline-created items)
    for (const record of localData) {
      if (!remoteIds.has(record.id)) {
        // This record only exists locally, push to cloud
        await pushToCloud(tableName, record).catch(err =>
          console.warn(`Failed to push ${tableName} ${record.id}:`, err)
        );
      }
    }

    console.log(`Synced ${tableName}: ${remoteData.length} from cloud, ${localData.length} local`);
  } catch (error) {
    console.warn(`Sync ${tableName} failed:`, error);
  }
}

// Push a single record to cloud
async function pushToCloud(tableName: string, record: any): Promise<void> {
  // Map camelCase to snake_case for API
  const mapped: any = { ...record };
  if (record.addedDate) mapped.addedDate = record.addedDate;
  if (record.reviewCount !== undefined) mapped.reviewCount = record.reviewCount;
  if (record.lastReviewDate) mapped.lastReviewDate = record.lastReviewDate;
  if (record.myAnswer) mapped.myAnswer = record.myAnswer;
  if (record.totalPages !== undefined) mapped.totalPages = record.totalPages;
  if (record.startDate) mapped.startDate = record.startDate;
  if (record.finishedDate) mapped.finishedDate = record.finishedDate;
  if (record.bookId) mapped.bookId = record.bookId;
  if (record.keyPoints) mapped.keyPoints = record.keyPoints;
  if (record.weekStart) mapped.weekStart = record.weekStart;
  if (record.weekEnd) mapped.weekEnd = record.weekEnd;
  if (record.sportSummary) mapped.sportSummary = record.sportSummary;
  if (record.readingSummary) mapped.readingSummary = record.readingSummary;
  if (record.englishSummary) mapped.englishSummary = record.englishSummary;
  if (record.generatedAt) mapped.generatedAt = record.generatedAt;

  switch (tableName) {
    case 'english_records': await englishRecordsApi.create(mapped); break;
    case 'words': await wordsApi.create(mapped); break;
    case 'wrong_questions': await wrongQuestionsApi.create(mapped); break;
    case 'books': await booksApi.create(mapped); break;
    case 'reading_notes': await readingNotesApi.create(mapped); break;
    case 'sport_records': await sportRecordsApi.create(mapped); break;
    case 'weekly_reports': await weeklyReportsApi.create(mapped); break;
  }
}

// Individual sync functions
async function syncEnglishRecords() {
  return syncTable('english_records', englishRecordsApi.list, () => db.englishRecords);
}

async function syncWords() {
  return syncTable('words', wordsApi.list, () => db.words);
}

async function syncWrongQuestions() {
  return syncTable('wrong_questions', wrongQuestionsApi.list, () => db.wrongQuestions);
}

async function syncBooks() {
  return syncTable('books', booksApi.list, () => db.books);
}

async function syncReadingNotes() {
  return syncTable('reading_notes', readingNotesApi.list, () => db.readingNotes);
}

async function syncSportRecords() {
  return syncTable('sport_records', sportRecordsApi.list, () => db.sportRecords);
}

async function syncWeeklyReports() {
  return syncTable('weekly_reports', weeklyReportsApi.list, () => db.weeklyReports);
}

// ============== CRUD with auto-sync ==============
// These functions write to Dexie first, then sync to cloud in background

// English Records
export async function addEnglishRecord(record: any) {
  await db.englishRecords.add(record);
  syncToCloudSafely(() => englishRecordsApi.create(record));
}

export async function updateEnglishRecord(id: string, changes: any) {
  await db.englishRecords.update(id, changes);
  syncToCloudSafely(() => englishRecordsApi.update(id, changes));
}

export async function deleteEnglishRecord(id: string) {
  await db.englishRecords.delete(id);
  syncToCloudSafely(() => englishRecordsApi.delete(id));
}

// Words
export async function addWord(word: any) {
  await db.words.add(word);
  syncToCloudSafely(() => wordsApi.create(word));
}

export async function updateWord(id: string, changes: any) {
  await db.words.update(id, changes);
  syncToCloudSafely(() => wordsApi.update(id, changes));
}

export async function deleteWord(id: string) {
  await db.words.delete(id);
  syncToCloudSafely(() => wordsApi.delete(id));
}

// Wrong Questions
export async function addWrongQuestion(q: any) {
  await db.wrongQuestions.add(q);
  syncToCloudSafely(() => wrongQuestionsApi.create(q));
}

export async function updateWrongQuestion(id: string, changes: any) {
  await db.wrongQuestions.update(id, changes);
  syncToCloudSafely(() => wrongQuestionsApi.update(id, changes));
}

export async function deleteWrongQuestion(id: string) {
  await db.wrongQuestions.delete(id);
  syncToCloudSafely(() => wrongQuestionsApi.delete(id));
}

// Books
export async function addBook(book: any) {
  await db.books.add(book);
  syncToCloudSafely(() => booksApi.create(book));
}

export async function updateBook(id: string, changes: any) {
  await db.books.update(id, changes);
  syncToCloudSafely(() => booksApi.update(id, changes));
}

export async function deleteBook(id: string) {
  await db.books.delete(id);
  syncToCloudSafely(() => booksApi.delete(id));
}

// Reading Notes
export async function addReadingNote(note: any) {
  await db.readingNotes.add(note);
  syncToCloudSafely(() => readingNotesApi.create(note));
}

export async function updateReadingNote(id: string, changes: any) {
  await db.readingNotes.update(id, changes);
  syncToCloudSafely(() => readingNotesApi.update(id, changes));
}

export async function deleteReadingNote(id: string) {
  await db.readingNotes.delete(id);
  syncToCloudSafely(() => readingNotesApi.delete(id));
}

// Sport Records
export async function addSportRecord(record: any) {
  await db.sportRecords.add(record);
  syncToCloudSafely(() => sportRecordsApi.create(record));
}

export async function updateSportRecord(id: string, changes: any) {
  await db.sportRecords.update(id, changes);
  syncToCloudSafely(() => sportRecordsApi.update(id, changes));
}

export async function deleteSportRecord(id: string) {
  await db.sportRecords.delete(id);
  syncToCloudSafely(() => sportRecordsApi.delete(id));
}

// Weekly Reports
export async function addWeeklyReport(report: any) {
  await db.weeklyReports.add(report);
  syncToCloudSafely(() => weeklyReportsApi.create(report));
}

export async function deleteWeeklyReport(id: string) {
  await db.weeklyReports.delete(id);
  syncToCloudSafely(() => weeklyReportsApi.delete(id));
}

// Helper: try to sync to cloud, but don't block on failure
async function syncToCloudSafely(fn: () => Promise<any>) {
  if (!isOnline) return;
  try {
    await fn();
  } catch (error) {
    console.warn('Cloud sync failed (will retry later):', error);
  }
}
