-- 玄英拾光 数据库 Schema (Vercel Postgres)
-- 运行方式: 在 Vercel Postgres 的 SQL 界面中执行此文件

CREATE TABLE IF NOT EXISTS english_records (
  id VARCHAR(32) PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('dictation', 'speaking', 'vocabulary', 'exam')),
  date DATE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  title VARCHAR(255),
  content TEXT,
  score JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_english_records_type ON english_records(type);
CREATE INDEX idx_english_records_date ON english_records(date);

CREATE TABLE IF NOT EXISTS words (
  id VARCHAR(32) PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  meaning TEXT NOT NULL,
  phonetic VARCHAR(255),
  example TEXT,
  added_date DATE NOT NULL,
  mastered BOOLEAN DEFAULT FALSE,
  review_count INTEGER DEFAULT 0,
  last_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_words_word ON words(word);
CREATE INDEX idx_words_mastered ON words(mastered);

CREATE TABLE IF NOT EXISTS wrong_questions (
  id VARCHAR(32) PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('vocabulary', 'grammar', 'listening', 'reading')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  my_answer TEXT NOT NULL,
  analysis TEXT,
  date DATE NOT NULL,
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wrong_questions_type ON wrong_questions(type);
CREATE INDEX idx_wrong_questions_date ON wrong_questions(date);
CREATE INDEX idx_wrong_questions_reviewed ON wrong_questions(reviewed);

CREATE TABLE IF NOT EXISTS books (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) DEFAULT '',
  cover VARCHAR(512),
  total_pages INTEGER,
  start_date DATE NOT NULL,
  finished_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'reading' CHECK (status IN ('reading', 'finished', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_start_date ON books(start_date);

CREATE TABLE IF NOT EXISTS reading_notes (
  id VARCHAR(32) PRIMARY KEY,
  book_id VARCHAR(32) NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter VARCHAR(255) DEFAULT '',
  key_points TEXT,
  reflection TEXT,
  duration INTEGER DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reading_notes_book_id ON reading_notes(book_id);
CREATE INDEX idx_reading_notes_date ON reading_notes(date);

CREATE TABLE IF NOT EXISTS sport_records (
  id VARCHAR(32) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  distance DECIMAL(10,2),
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sport_records_type ON sport_records(type);
CREATE INDEX idx_sport_records_date ON sport_records(date);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id VARCHAR(32) PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  sport_summary JSONB NOT NULL DEFAULT '{}',
  reading_summary JSONB NOT NULL DEFAULT '{}',
  english_summary JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weekly_reports_week_start ON weekly_reports(week_start);
