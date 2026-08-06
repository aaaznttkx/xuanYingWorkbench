import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Clock, Trash2, Edit3, Sparkles, Lightbulb, Heart, ChevronRight } from 'lucide-react';
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

  const [showAdd, setShowAdd] = useState(false);          // 手动写笔记
  const [showAI, setShowAI] = useState(false);            // AI 智能整理（独立入口）
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [noteForm, setNoteForm] = useState({ chapter: '', keyPoints: '', reflection: '' });
  const [pendingDuration, setPendingDuration] = useState(0);

  // AI Format state
  const [rawText, setRawText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [aiError, setAiError] = useState('');
  // 整理结果预览：null 表示还在输入阶段，有值表示进入预览编辑阶段
  const [aiResult, setAiResult] = useState<{ chapter: string; keyPoints: string; reflection: string } | null>(null);

  if (!book) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">书籍不存在</p>
      </div>
    );
  }

  const totalDuration = notes.reduce((s, n) => s + n.duration, 0);

  const saveNote = async (duration: number = 0) => {
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
    setAiResult(null);
    setRawText('');
    setShowAdd(false);
    setShowAI(false);
    setPendingDuration(0);
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
      // 计时结束后直接进入 AI 整理，带上时长
      setPendingDuration(minutes);
      setShowAI(true);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAIFormat = async () => {
    if (!rawText.trim()) return;
    setIsFormatting(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawText.trim(), bookTitle: book.title }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }));
        throw new Error(err.error || 'AI 整理失败');
      }
      const data = await res.json();
      const result = {
        chapter: data.chapter || '阅读笔记',
        keyPoints: data.keyPoints || '',
        reflection: data.reflection || '',
      };
      setAiResult(result);
      setNoteForm(result);
    } catch (err: any) {
      setAiError(err.message || '整理失败，请重试');
    } finally {
      setIsFormatting(false);
    }
  };

  // 重置 AI 整理弹窗到输入阶段
  const resetAIFlow = () => {
    setAiResult(null);
    setNoteForm({ chapter: '', keyPoints: '', reflection: '' });
    setRawText('');
    setAiError('');
  };

  const closeAIModal = () => {
    setShowAI(false);
    resetAIFlow();
    setPendingDuration(0);
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
              <Plus size={16} /> 手动
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

      {/* AI 智能整理快捷入口 —— 沿用阅读模块紫色渐变，与 Reading 列表页今日卡片一致 */}
      <button
        onClick={() => setShowAI(true)}
        className="card w-full text-left mb-4 bg-gradient-to-r from-purple-500 to-purple-600 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3 text-white">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">AI 智能整理笔记</p>
            <p className="text-xs text-purple-100 mt-0.5">读完一章？把心得发给我，自动整理为结构化笔记</p>
          </div>
          <ChevronRight size={18} className="text-white/70 flex-shrink-0" />
        </div>
      </button>

      {/* Notes List */}
      <h2 className="text-base font-semibold text-gray-700 mb-3">读书笔记 ({notes.length})</h2>

      {notes.length === 0 ? (
        <EmptyState
          icon={<Edit3 size={32} />}
          title="还没有笔记"
          description="读完一章后，把心得交给 AI 整理成结构化笔记"
          action={
            <button onClick={() => setShowAI(true)} className="btn-primary text-sm">开始整理笔记</button>
          }
        />
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="card">
              {/* 章节标题行 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium flex-shrink-0">
                    {note.chapter}
                  </span>
                  <span className="text-xs text-gray-400 truncate">{note.date} · {note.duration}分钟</span>
                </div>
                <button onClick={() => deleteNote(note.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0 ml-2">
                  <Trash2 size={16} />
                </button>
              </div>
              {/* 核心观点 */}
              {note.keyPoints && (
                <div className="mb-2 p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs font-medium text-blue-500 mb-1 flex items-center gap-1">
                    <Lightbulb size={13} /> 核心观点
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.keyPoints}</p>
                </div>
              )}
              {/* 我的感悟 */}
              {note.reflection && (
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="text-xs font-medium text-green-500 mb-1 flex items-center gap-1">
                    <Heart size={13} /> 我的感悟
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.reflection}</p>
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
                <button onClick={startTimer} className="btn-primary flex-1">开始</button>
              </div>
            ) : (
              <button onClick={stopTimerAndSave} className="btn-primary w-full bg-red-500">结束阅读</button>
            )}
          </div>
        </div>
      )}

      {/* AI 智能整理 Modal —— 独立入口，两阶段：输入 → 预览编辑 */}
      <Modal
        isOpen={showAI}
        onClose={closeAIModal}
        title={aiResult ? '整理结果预览' : 'AI 智能整理笔记'}
      >
        {pendingDuration > 0 && (
          <div className="mb-3 px-3 py-2 bg-purple-50 rounded-xl text-xs text-purple-600 flex items-center gap-1.5">
            <Clock size={13} /> 本次阅读时长 {pendingDuration} 分钟，将自动记录到这条笔记
          </div>
        )}

        {!aiResult ? (
          /* 阶段一：粘贴心得 */
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={16} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-700">把这一章的心得交给我</span>
              </div>
              <p className="text-xs text-purple-400 leading-relaxed">
                随意写下你的感受、印象深刻的内容、联想到的事情，AI 会自动整理成「章节 / 核心观点 / 我的感悟」的结构化笔记。
              </p>
            </div>
            <textarea
              className="input-field min-h-[160px]"
              placeholder={`读完《${book.title || '书籍'}》这一章的感受...\n\n可以写：\n· 这一章讲了什么\n· 哪些地方让你印象深刻\n· 你产生的联想和思考`}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
            />
            {aiError && <p className="text-xs text-red-500">{aiError}</p>}
            <button
              onClick={handleAIFormat}
              disabled={!rawText.trim() || isFormatting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500 text-white text-sm font-medium disabled:opacity-50 active:bg-purple-600 transition-colors"
            >
              {isFormatting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI 正在整理...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> 开始整理
                </>
              )}
            </button>
          </div>
        ) : (
          /* 阶段二：预览并编辑整理结果 */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-500 flex items-center gap-1">
                <Sparkles size={13} /> AI 已整理完成，可编辑后保存
              </span>
              <button onClick={resetAIFlow} className="text-xs text-purple-500 underline">重新整理</button>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">章节</label>
              <input
                className="input-field"
                placeholder="如：第一章 开端"
                value={noteForm.chapter}
                onChange={e => setNoteForm({ ...noteForm, chapter: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block flex items-center gap-1">
                <Lightbulb size={14} className="text-blue-500" /> 核心观点
              </label>
              <textarea
                className="input-field"
                placeholder="本章的核心观点和重要内容..."
                rows={3}
                value={noteForm.keyPoints}
                onChange={e => setNoteForm({ ...noteForm, keyPoints: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block flex items-center gap-1">
                <Heart size={14} className="text-green-500" /> 我的感悟
              </label>
              <textarea
                className="input-field"
                placeholder="你的思考、联想和感悟..."
                rows={3}
                value={noteForm.reflection}
                onChange={e => setNoteForm({ ...noteForm, reflection: e.target.value })}
              />
            </div>
            <button onClick={() => saveNote(pendingDuration)} className="btn-primary w-full">保存笔记</button>
          </div>
        )}
      </Modal>

      {/* 手动写笔记 Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="手动写笔记">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">章节</label>
            <input
              className="input-field"
              placeholder="如：第一章 开端"
              value={noteForm.chapter}
              onChange={e => setNoteForm({ ...noteForm, chapter: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">核心观点</label>
            <textarea
              className="input-field"
              placeholder="本章的核心观点和重要内容..."
              rows={3}
              value={noteForm.keyPoints}
              onChange={e => setNoteForm({ ...noteForm, keyPoints: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">我的感悟</label>
            <textarea
              className="input-field"
              placeholder="你的思考、联想和感悟..."
              rows={3}
              value={noteForm.reflection}
              onChange={e => setNoteForm({ ...noteForm, reflection: e.target.value })}
            />
          </div>
          <button onClick={() => saveNote(0)} className="btn-primary w-full">保存笔记</button>
        </div>
      </Modal>
    </div>
  );
}
