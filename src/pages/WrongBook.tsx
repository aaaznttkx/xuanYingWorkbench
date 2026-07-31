import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, AlertCircle, Check, Trash2, Search } from 'lucide-react';
import { db, generateId } from '../db';
import { todayStr } from '../utils/dateUtils';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const types = [
  { key: 'vocabulary', label: '词汇' },
  { key: 'grammar', label: '语法' },
  { key: 'listening', label: '听力' },
  { key: 'reading', label: '阅读' },
];

export default function WrongBook() {
  const navigate = useNavigate();
  const questions = useLiveQuery(() => db.wrongQuestions.orderBy('date').reverse().toArray()) || [];
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [form, setForm] = useState({
    type: 'vocabulary' as string,
    question: '',
    answer: '',
    myAnswer: '',
    analysis: '',
  });

  const filteredQuestions = useMemo(() => {
    let result = questions;
    if (search) {
      result = result.filter(q => q.question.toLowerCase().includes(search.toLowerCase()) || q.answer.includes(search));
    }
    if (filter !== 'all') result = result.filter(q => q.type === filter);
    return result;
  }, [questions, search, filter]);

  const addQuestion = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    await db.wrongQuestions.add({
      id: generateId(),
      type: form.type as any,
      question: form.question.trim(),
      answer: form.answer.trim(),
      myAnswer: form.myAnswer.trim(),
      analysis: form.analysis.trim(),
      date: todayStr(),
      reviewed: false,
    });
    setForm({ type: 'vocabulary', question: '', answer: '', myAnswer: '', analysis: '' });
    setShowAdd(false);
  };

  const toggleReviewed = async (id: string, reviewed: boolean) => {
    await db.wrongQuestions.update(id, { reviewed: !reviewed });
  };

  const deleteQuestion = async (id: string) => {
    await db.wrongQuestions.delete(id);
  };

  const unreviewedCount = questions.filter(q => !q.reviewed).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/english')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">错题本</h1>
      </div>

      <div className="card mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">待复习错题</p>
          <p className="text-2xl font-bold text-orange-500">{unreviewedCount}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
          <AlertCircle size={24} className="text-orange-500" />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="搜索错题..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowAdd(true)} className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center active:bg-orange-600">
          <Plus size={22} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500'}`}
        >全部</button>
        {types.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === t.key ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500'}`}
          >{t.label}</button>
        ))}
      </div>

      {filteredQuestions.length === 0 ? (
        <EmptyState
          icon={<AlertCircle size={32} />}
          title="还没有错题记录"
          description="添加错题，定期复习，避免重复犯错"
          action={
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">添加错题</button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map(q => (
            <div key={q.id} className={`card ${q.reviewed ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-orange-400'}`}>
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  q.type === 'vocabulary' ? 'bg-purple-100 text-purple-600' :
                  q.type === 'grammar' ? 'bg-blue-100 text-blue-600' :
                  q.type === 'listening' ? 'bg-green-100 text-green-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {types.find(t => t.key === q.type)?.label}
                </span>
                <span className="text-xs text-gray-400">{q.date}</span>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-2">📝 {q.question}</p>
              <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                <div className="p-2 bg-red-50 rounded-lg">
                  <span className="text-xs text-red-400">我的答案</span>
                  <p className="text-red-600">{q.myAnswer || '（未作答）'}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <span className="text-xs text-green-400">正确答案</span>
                  <p className="text-green-600">{q.answer}</p>
                </div>
              </div>
              {q.analysis && (
                <div className="p-2 bg-gray-50 rounded-lg mb-2">
                  <span className="text-xs text-gray-400">解析</span>
                  <p className="text-sm text-gray-600">{q.analysis}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleReviewed(q.id, q.reviewed)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    q.reviewed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  <Check size={14} /> {q.reviewed ? '已复习' : '标记已复习'}
                </button>
                <button onClick={() => deleteQuestion(q.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-400">
                  <Trash2 size={14} /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="添加错题">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">类型</label>
            <div className="flex gap-2">
              {types.map(t => (
                <button
                  key={t.key}
                  onClick={() => setForm({...form, type: t.key})}
                  className={`px-3 py-1.5 rounded-lg text-sm ${form.type === t.key ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500'}`}
                >{t.label}</button>
              ))}
            </div>
          </div>
          <textarea className="input-field" placeholder="题目 *" value={form.question} onChange={e => setForm({...form, question: e.target.value})} rows={2} />
          <input className="input-field" placeholder="你的答案" value={form.myAnswer} onChange={e => setForm({...form, myAnswer: e.target.value})} />
          <input className="input-field" placeholder="正确答案 *" value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} />
          <textarea className="input-field" placeholder="解析（可选）" value={form.analysis} onChange={e => setForm({...form, analysis: e.target.value})} rows={2} />
          <button onClick={addQuestion} className="btn-primary w-full">添加错题</button>
        </div>
      </Modal>
    </div>
  );
}
