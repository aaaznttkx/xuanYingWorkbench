import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Clock, Trash2, Edit3 } from 'lucide-react';
import { db, generateId } from '../db';
import { addReadingNote, deleteReadingNote, updateBook } from '../api/sync';
import { todayStr } from '../utils/dateUtils';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

export default function BookDetail() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const book = useLiveQuery(() => db.books.get(bookId || ''), [bookId]);
  const notes = useLiveQuery(() => db.readingNotes.where('bookId').equals(bookId || '').reverse().sortBy('date'), [bookId]) || [];

  const [showAdd, setShowAdd] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [noteForm, setNoteForm] = useState({ chapter: '', keyPoints: '', reflection: '' });

  if (!book) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">书籍不存在</p>
      </div>
    );
  }

  const totalDuration = notes.reduce((s, n) => s + n.duration, 0);

  const addNote = async (duration: number = 0) => {
    if (!noteForm.chapter.trim()) return;
    await addReadingNote({
      id: generateId(),
      bookId: book.id,
      chapter: noteForm.chapter.trim(),
      keyPoints: noteForm.keyPoints.trim(),
      reflection: noteForm.reflection.trim(),
      duration,
      date: todayStr(),
    });
    setNoteForm({ chapter: '', keyPoints: '', reflection: '' });
    setShowAdd(false);
  };

  const deleteNote = async (id: string) => {
    await deleteReadingNote(id);
  };

  const updateBookStatus = async (status: 'reading' | 'finished' | 'paused') => {
    await updateBook(book.id, { status, ...(status === 'finished' ? { finishedDate: todayStr() } : {}) });
  };

  const startTimer = () => {
    setTimerRunning(true);
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimerAndSave = () => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerRunning(false);
    const minutes = Math.round(timerSeconds / 60);
    setTimerSeconds(0);
    setShowTimer(false);
    if (minutes > 0) {
      setShowAdd(true);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/reading')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 truncate">{book.title}</h1>
          {book.author && <p className="text-xs text-gray-400">{book.author}</p>}
        </div>
      </div>

      {/* Book Info & Actions */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">阅读时长</p>
            <p className="text-xl font-bold text-purple-600">{totalDuration} 分钟</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTimer(true)} className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium">
              <Clock size={16} /> 计时
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-2 bg-primary-50 text-primary-600 rounded-xl text-sm font-medium">
              <Plus size={16} /> 笔记
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {(['reading', 'paused', 'finished'] as const).map(s => (
            <button
              key={s}
              onClick={() => updateBookStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                book.status === s
                  ? s === 'reading' ? 'bg-purple-500 text-white' : s === 'finished' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                  : 'bg-gray-50 text-gray-500'
              }`}
            >
              {s === 'reading' ? '在读' : s === 'finished' ? '已读完' : '暂停'}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <h2 className="text-base font-semibold text-gray-700 mb-3">读书笔记 ({notes.length})</h2>

      {notes.length === 0 ? (
        <EmptyState
          icon={<Edit3 size={32} />}
          title="还没有笔记"
          description="开始记录你的阅读心得"
          action={
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">写笔记</button>
          }
        />
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">
                    {note.chapter}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{note.date} · {note.duration}分钟</span>
                </div>
                <button onClick={() => deleteNote(note.id)} className="text-gray-300 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
              {note.keyPoints && (
                <div className="mb-2 p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs font-medium text-blue-500 mb-1">💡 核心观点</p>
                  <p className="text-sm text-gray-700">{note.keyPoints}</p>
                </div>
              )}
              {note.reflection && (
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="text-xs font-medium text-green-500 mb-1">📝 我的感悟</p>
                  <p className="text-sm text-gray-700">{note.reflection}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timer Modal */}
      {showTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !timerRunning && setShowTimer(false)} />
          <div className="relative bg-white rounded-3xl w-[300px] p-8 text-center animate-slide-up">
            <h3 className="text-lg font-semibold mb-2">阅读计时器</h3>
            <p className="text-5xl font-mono font-bold text-purple-600 mb-6">{formatTime(timerSeconds)}</p>
            {!timerRunning ? (
              <div className="flex gap-3">
                <button onClick={() => setShowTimer(false)} className="btn-outline flex-1">取消</button>
                <button onClick={startTimer} className="btn-primary flex-1" style={{background: '#7C3AED'}}>开始</button>
              </div>
            ) : (
              <button onClick={stopTimerAndSave} className="btn-primary w-full bg-red-500">结束阅读</button>
            )}
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="写读书笔记">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">章节</label>
            <input
              className="input-field"
              placeholder="如：第一章 开端"
              value={noteForm.chapter}
              onChange={e => setNoteForm({...noteForm, chapter: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">核心观点</label>
            <textarea
              className="input-field"
              placeholder="本章的核心观点和重要内容..."
              rows={3}
              value={noteForm.keyPoints}
              onChange={e => setNoteForm({...noteForm, keyPoints: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">我的感悟</label>
            <textarea
              className="input-field"
              placeholder="你的思考、联想和感悟..."
              rows={3}
              value={noteForm.reflection}
              onChange={e => setNoteForm({...noteForm, reflection: e.target.value})}
            />
          </div>
          <button onClick={() => addNote(0)} className="btn-primary w-full">保存笔记</button>
        </div>
      </Modal>
    </div>
  );
}
