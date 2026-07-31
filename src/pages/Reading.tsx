import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { db, generateId } from '../db';
import { todayStr } from '../utils/dateUtils';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

export default function Reading() {
  const navigate = useNavigate();
  const books = useLiveQuery(() => db.books.orderBy('startDate').reverse().toArray()) || [];
  const notes = useLiveQuery(() => db.readingNotes.orderBy('date').reverse().toArray()) || [];
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', totalPages: '' });

  const addBook = async () => {
    if (!form.title.trim()) return;
    await db.books.add({
      id: generateId(),
      title: form.title.trim(),
      author: form.author.trim(),
      totalPages: form.totalPages ? Number(form.totalPages) : undefined,
      startDate: todayStr(),
      status: 'reading',
    });
    setForm({ title: '', author: '', totalPages: '' });
    setShowAdd(false);
  };

  const getBookNotes = (bookId: string) => notes.filter(n => n.bookId === bookId);
  const getBookDuration = (bookId: string) => getBookNotes(bookId).reduce((s, n) => s + n.duration, 0);

  const readingBooks = books.filter(b => b.status === 'reading');
  const finishedBooks = books.filter(b => b.status === 'finished');

  const todayNotes = notes.filter(n => n.date === todayStr());
  const todayReading = todayNotes.reduce((s, n) => s + n.duration, 0);

  const colorPalette = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#00BCD4', '#795548', '#607D8B'];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">读书笔记</h1>
      </div>

      {/* Today Reading */}
      <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">今日阅读时长</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold">{todayReading}</span>
              <span className="text-purple-100">分钟</span>
            </div>
          </div>
          <Clock size={36} className="text-purple-200" />
        </div>
      </div>

      {/* Add Book */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-700">
          在读 ({readingBooks.length})
        </h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-sm text-primary-600 font-medium">
          <Plus size={16} /> 添加书籍
        </button>
      </div>

      {books.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title="还没有书籍"
          description="添加你正在读的书，开始记录笔记"
          action={
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">添加书籍</button>
          }
        />
      ) : (
        <>
          {/* Reading Books */}
          <div className="space-y-3 mb-5">
            {readingBooks.map((book) => (
              <button
                key={book.id}
                onClick={() => navigate(`/reading/${book.id}`)}
                className="card w-full text-left flex items-center gap-3 p-4 active:scale-[0.98] transition-transform"
              >
                <div
                  className="w-12 h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: colorPalette[readingBooks.indexOf(book) % colorPalette.length] }}
                >
                  {book.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{book.title}</p>
                  <p className="text-xs text-gray-400">{book.author || '未知作者'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded">
                      {getBookNotes(book.id).length} 篇笔记
                    </span>
                    <span className="text-xs text-gray-400">{getBookDuration(book.id)}分钟</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>

          {/* Finished Books */}
          {finishedBooks.length > 0 && (
            <>
              <h2 className="text-base font-semibold text-gray-700 mb-3">
                已读完 ({finishedBooks.length})
              </h2>
              <div className="space-y-2 mb-5">
                {finishedBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => navigate(`/reading/${book.id}`)}
                    className="card w-full text-left flex items-center gap-3 p-3 opacity-70 active:scale-[0.98]"
                  >
                    <div className="w-10 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-bold flex-shrink-0">
                      {book.title.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-600 truncate">{book.title}</p>
                      <p className="text-xs text-gray-400">{getBookNotes(book.id).length} 篇笔记</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Add Book Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="添加书籍">
        <div className="space-y-3">
          <input
            className="input-field"
            placeholder="书名 *"
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
          />
          <input
            className="input-field"
            placeholder="作者"
            value={form.author}
            onChange={e => setForm({...form, author: e.target.value})}
          />
          <input
            className="input-field"
            placeholder="总页数（可选）"
            type="number"
            value={form.totalPages}
            onChange={e => setForm({...form, totalPages: e.target.value})}
          />
          <button onClick={addBook} className="btn-primary w-full">添加</button>
        </div>
      </Modal>
    </div>
  );
}
