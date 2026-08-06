import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Headphones, Mic, BookMarked, AlertCircle, Plus, Clock } from 'lucide-react';
import { db, generateId } from '../db';
import { addEnglishRecord, deleteEnglishRecord } from '../api/sync';
import { todayStr } from '../utils/dateUtils';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const englishTypes = [
  { key: 'dictation', label: '精听训练', icon: Headphones, color: 'text-blue-500', bg: 'bg-blue-50', desc: '逐句听写，提升听力' },
  { key: 'speaking', label: '口语练习', icon: Mic, color: 'text-green-500', bg: 'bg-green-50', desc: '跟读练习，AI评分' },
  { key: 'vocabulary', label: '生词记忆', icon: BookMarked, color: 'text-purple-500', bg: 'bg-purple-50', desc: '四级核心词汇' },
  { key: 'exam', label: '错题复盘', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50', desc: '真题错题回顾' },
];

export default function English() {
  const navigate = useNavigate();
  const records = useLiveQuery(() => db.englishRecords.orderBy('date').reverse().toArray()) || [];
  const [showAdd, setShowAdd] = useState(false);
  const [recordType, setRecordType] = useState<string>('dictation');
  const [duration, setDuration] = useState(30);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const handleTypeClick = (key: string) => {
    if (key === 'dictation') navigate('/english/dictation');
    else if (key === 'speaking') navigate('/english/speaking');
    else if (key === 'vocabulary') navigate('/english/vocabulary');
    else if (key === 'exam') navigate('/english/wrongbook');
  };

  const addRecord = async () => {
    if (!title.trim()) return;
    await addEnglishRecord({
      id: generateId(),
      type: recordType as any,
      date: todayStr(),
      duration,
      title,
      notes,
    });
    setShowAdd(false);
    setTitle('');
    setNotes('');
    setDuration(30);
  };

  const deleteRecord = async (id: string) => {
    await deleteEnglishRecord(id);
  };

  const todayRecords = records.filter(r => r.date === todayStr());
  const todayTotal = todayRecords.reduce((s, r) => s + r.duration, 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">英语学习</h1>
      </div>

      {/* Today Summary */}
      <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">今日学习时长</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold">{todayTotal}</span>
              <span className="text-blue-100">分钟</span>
            </div>
          </div>
          <Clock size={36} className="text-blue-200" />
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {englishTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => handleTypeClick(type.key)}
            className={`card p-4 text-left active:scale-[0.98] transition-transform`}
          >
            <div className={`w-10 h-10 rounded-xl ${type.bg} flex items-center justify-center mb-3`}>
              <type.icon size={22} className={type.color} />
            </div>
            <p className="font-semibold text-sm text-gray-700">{type.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{type.desc}</p>
          </button>
        ))}
      </div>

      {/* Quick Add Record */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">学习记录</h2>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-sm text-primary-600 font-medium">
            <Plus size={16} /> 添加记录
          </button>
        </div>

        {records.length === 0 ? (
          <EmptyState
            icon={<Headphones size={32} />}
            title="还没有学习记录"
            description="开始你的英语学习之旅吧"
            action={
              <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
                添加第一条记录
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {records.slice(0, 20).map((r) => (
              <div key={r.id} className="card flex items-center gap-3 py-3">
                <div className={`w-8 h-8 rounded-lg ${englishTypes.find(t => t.key === r.type)?.bg || 'bg-gray-50'} flex items-center justify-center`}>
                  {(() => {
                    const t = englishTypes.find(t => t.key === r.type);
                    if (!t) return <Clock size={14} />;
                    return <t.icon size={16} className={t.color} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{r.title || r.type}</p>
                  <p className="text-xs text-gray-400">{r.date} · {r.duration}分钟</p>
                </div>
                <button onClick={() => deleteRecord(r.id)} className="text-xs text-red-400 px-2 py-1">删除</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="添加学习记录"
        footer={<button onClick={addRecord} className="btn-primary w-full">保存记录</button>}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">学习类型</label>
            <div className="grid grid-cols-2 gap-2">
              {englishTypes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setRecordType(t.key)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    recordType === t.key ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">标题</label>
            <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="如：四级听力真题1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">学习时长（分钟）</label>
            <input className="input-field" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={1} max={300} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">备注</label>
            <textarea className="input-field" value={notes} onChange={e => setNotes(e.target.value)} placeholder="学习内容、心得..." rows={2} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
