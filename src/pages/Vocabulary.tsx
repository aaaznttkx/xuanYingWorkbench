import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Search, Check, BookMarked, Trash2, RefreshCw } from 'lucide-react';
import { db, generateId } from '../db';
import { addWord as syncAddWord, updateWord as syncUpdateWord, deleteWord as syncDeleteWord } from '../api/sync';
import { todayStr } from '../utils/dateUtils';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const sampleWords = [
  { word: 'abandon', meaning: '放弃；抛弃', phonetic: '/əˈbændən/' },
  { word: 'academic', meaning: '学术的；学院的', phonetic: '/ˌækəˈdemɪk/' },
  { word: 'accommodate', meaning: '容纳；提供住宿', phonetic: '/əˈkɒmədeɪt/' },
  { word: 'accompany', meaning: '陪伴；伴随', phonetic: '/əˈkʌmpəni/' },
  { word: 'accomplish', meaning: '完成；实现', phonetic: '/əˈkʌmplɪʃ/' },
  { word: 'acknowledge', meaning: '承认；确认', phonetic: '/əkˈnɒlɪdʒ/' },
  { word: 'adequate', meaning: '足够的；适当的', phonetic: '/ˈædɪkwət/' },
  { word: 'administration', meaning: '管理；行政', phonetic: '/ədˌmɪnɪˈstreɪʃn/' },
  { word: 'adolescent', meaning: '青少年', phonetic: '/ˌædəˈlesnt/' },
  { word: 'alternative', meaning: '替代的；选择', phonetic: '/ɔːlˈtɜːnətɪv/' },
  { word: 'ambitious', meaning: '有雄心的', phonetic: '/æmˈbɪʃəs/' },
  { word: 'appreciate', meaning: '欣赏；感激', phonetic: '/əˈpriːʃieɪt/' },
  { word: 'appropriate', meaning: '适当的', phonetic: '/əˈprəʊpriət/' },
  { word: 'approximately', meaning: '大约；近似', phonetic: '/əˈprɒksɪmətli/' },
  { word: 'atmosphere', meaning: '气氛；大气', phonetic: '/ˈætməsfɪə(r)/' },
  { word: 'available', meaning: '可用的；有空的', phonetic: '/əˈveɪləbl/' },
  { word: 'beneficial', meaning: '有益的', phonetic: '/ˌbenɪˈfɪʃl/' },
  { word: 'budget', meaning: '预算', phonetic: '/ˈbʌdʒɪt/' },
  { word: 'campaign', meaning: '活动；运动', phonetic: '/kæmˈpeɪn/' },
  { word: 'candidate', meaning: '候选人', phonetic: '/ˈkændɪdət/' },
];

export default function Vocabulary() {
  const navigate = useNavigate();
  const words = useLiveQuery(() => db.words.orderBy('addedDate').reverse().toArray()) || [];
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState({ word: '', meaning: '', phonetic: '', example: '' });
  const [filter, setFilter] = useState<'all' | 'mastered' | 'learning'>('all');

  const filteredWords = useMemo(() => {
    let result = words;
    if (search) {
      result = result.filter(w => w.word.toLowerCase().includes(search.toLowerCase()) || w.meaning.includes(search));
    }
    if (filter === 'mastered') result = result.filter(w => w.mastered);
    if (filter === 'learning') result = result.filter(w => !w.mastered);
    return result;
  }, [words, search, filter]);

  const addWord = async () => {
    if (!newWord.word.trim() || !newWord.meaning.trim()) return;
    await syncAddWord({
      id: generateId(),
      word: newWord.word.trim(),
      meaning: newWord.meaning.trim(),
      phonetic: newWord.phonetic.trim(),
      example: newWord.example.trim(),
      addedDate: todayStr(),
      mastered: false,
      reviewCount: 0,
    });
    setNewWord({ word: '', meaning: '', phonetic: '', example: '' });
    setShowAdd(false);
  };

  const addSampleWords = async () => {
    for (const w of sampleWords) {
      const exists = await db.words.where('word').equals(w.word).first();
      if (!exists) {
        await syncAddWord({
          id: generateId(),
          ...w,
          example: '',
          addedDate: todayStr(),
          mastered: false,
          reviewCount: 0,
        });
      }
    }
  };

  const toggleMastered = async (id: string, current: boolean) => {
    await syncUpdateWord(id, {
      mastered: !current,
      reviewCount: 0,
      lastReviewDate: todayStr(),
    });
  };

  const reviewWord = async (id: string, count: number) => {
    await syncUpdateWord(id, {
      reviewCount: count + 1,
      lastReviewDate: todayStr(),
    });
  };

  const deleteWord = async (id: string) => {
    await syncDeleteWord(id);
  };

  const masteredCount = words.filter(w => w.mastered).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/english')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">生词本</h1>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="card flex-1 text-center">
          <p className="text-2xl font-bold text-purple-600">{words.length}</p>
          <p className="text-xs text-gray-400">总词汇</p>
        </div>
        <div className="card flex-1 text-center">
          <p className="text-2xl font-bold text-green-600">{masteredCount}</p>
          <p className="text-xs text-gray-400">已掌握</p>
        </div>
        <div className="card flex-1 text-center">
          <p className="text-2xl font-bold text-orange-600">{words.length - masteredCount}</p>
          <p className="text-xs text-gray-400">学习中</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="搜索单词..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowAdd(true)} className="w-11 h-11 rounded-xl bg-primary-500 text-white flex items-center justify-center active:bg-primary-600">
          <Plus size={22} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'learning', 'mastered'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-purple-500 text-white' : 'bg-gray-50 text-gray-500'
            }`}
          >
            {f === 'all' ? '全部' : f === 'learning' ? '学习中' : '已掌握'}
          </button>
        ))}
      </div>

      {filteredWords.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={32} />}
          title="还没有生词"
          description={words.length === 0 ? '添加单词或导入四级词汇开始学习' : '没有找到匹配的单词'}
          action={
            words.length === 0 ? (
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">添加单词</button>
                <button onClick={addSampleWords} className="btn-outline text-sm">导入四级词汇</button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredWords.map(w => (
            <div key={w.id} className={`card ${w.mastered ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{w.word}</span>
                    <span className="text-xs text-gray-400">{w.phonetic}</span>
                    {w.mastered && <Check size={14} className="text-green-500" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{w.meaning}</p>
                  {w.example && <p className="text-xs text-gray-400 mt-1 italic">{w.example}</p>}
                  {w.reviewCount > 0 && (
                    <p className="text-xs text-gray-400 mt-1">已复习 {w.reviewCount} 次</p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => reviewWord(w.id, w.reviewCount)}
                    className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"
                    title="复习"
                  >
                    <RefreshCw size={14} className="text-blue-500" />
                  </button>
                  <button
                    onClick={() => toggleMastered(w.id, w.mastered)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      w.mastered ? 'bg-green-100' : 'bg-gray-50'
                    }`}
                    title={w.mastered ? '标记为未掌握' : '标记为已掌握'}
                  >
                    <Check size={14} className={w.mastered ? 'text-green-500' : 'text-gray-400'} />
                  </button>
                  <button onClick={() => deleteWord(w.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="添加生词"
        footer={<button onClick={addWord} className="btn-primary w-full">添加</button>}
      >
        <div className="space-y-3">
          <input className="input-field" placeholder="单词 *" value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value})} />
          <input className="input-field" placeholder="音标" value={newWord.phonetic} onChange={e => setNewWord({...newWord, phonetic: e.target.value})} />
          <input className="input-field" placeholder="释义 *" value={newWord.meaning} onChange={e => setNewWord({...newWord, meaning: e.target.value})} />
          <input className="input-field" placeholder="例句（可选）" value={newWord.example} onChange={e => setNewWord({...newWord, example: e.target.value})} />
        </div>
      </Modal>
    </div>
  );
}
