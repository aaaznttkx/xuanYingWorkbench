import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Languages, BookOpen, Dumbbell, Flame, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { db } from '../db';
import { todayStr, getMonthStats, formatDateCN, formatWeekday, getWeekRange } from '../utils/dateUtils';

export default function Dashboard() {
  const navigate = useNavigate();
  const today = todayStr();

  const sportRecords = useLiveQuery(() => db.sportRecords.toArray()) || [];
  const readingNotes = useLiveQuery(() => db.readingNotes.toArray()) || [];
  const englishRecords = useLiveQuery(() => db.englishRecords.toArray()) || [];
  const books = useLiveQuery(() => db.books.toArray()) || [];

  // Sport stats
  const sportDates = sportRecords.map(r => r.date);
  const { totalDays: sportMonthDays, consecutiveDays: sportConsecutive } = getMonthStats(sportDates);
  const todaySport = sportRecords.filter(r => r.date === today);
  const todaySportMinutes = todaySport.reduce((s, r) => s + r.duration, 0);

  // English stats
  const todayEnglish = englishRecords.filter(r => r.date === today);
  const todayEnglishMinutes = todayEnglish.reduce((s, r) => s + r.duration, 0);

  // Reading stats
  const todayReading = readingNotes.filter(r => r.date === today);
  const todayReadingMinutes = todayReading.reduce((s, r) => s + r.duration, 0);
  const activeBooks = books.filter(b => b.status === 'reading');

  // Week range
  const { start, end } = getWeekRange();

  // Calculate weekly totals
  const weekSportMinutes = sportRecords
    .filter(r => r.date >= start && r.date <= end)
    .reduce((s, r) => s + r.duration, 0);
  const weekEnglishMinutes = englishRecords
    .filter(r => r.date >= start && r.date <= end)
    .reduce((s, r) => s + r.duration, 0);
  const weekReadingMinutes = readingNotes
    .filter(r => r.date >= start && r.date <= end)
    .reduce((s, r) => s + r.duration, 0);

  const todayStats = [
    { icon: Dumbbell, label: '运动', value: todaySportMinutes > 0 ? `${todaySportMinutes}分钟` : '未打卡', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Languages, label: '英语', value: todayEnglishMinutes > 0 ? `${todayEnglishMinutes}分钟` : '未学习', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: BookOpen, label: '阅读', value: todayReadingMinutes > 0 ? `${todayReadingMinutes}分钟` : '未阅读', color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">
          {formatWeekday(new Date())}好 👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">{formatDateCN(new Date())}</p>
      </div>

      {/* Streak Card */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm">连续运动打卡</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-bold">{sportConsecutive}</span>
              <span className="text-primary-100">天</span>
            </div>
            <p className="text-primary-100 text-xs mt-1">本月共运动 {sportMonthDays} 天</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Flame size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Today Status */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {todayStats.map((stat) => (
          <div key={stat.label} className={`card text-center p-3 ${stat.bg}`}>
            <stat.icon size={20} className={`${stat.color} mx-auto mb-1`} />
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${stat.value.includes('未') ? 'text-gray-400' : stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">快捷入口</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/english')} className="card flex items-center gap-3 p-4 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Languages size={22} className="text-blue-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-gray-700">英语学习</p>
              <p className="text-xs text-gray-400">精听·口语·词汇</p>
            </div>
          </button>
          <button onClick={() => navigate('/reading')} className="card flex items-center gap-3 p-4 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <BookOpen size={22} className="text-purple-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-gray-700">读书笔记</p>
              <p className="text-xs text-gray-400">{activeBooks.length}本在读</p>
            </div>
          </button>
          <button onClick={() => navigate('/sports')} className="card flex items-center gap-3 p-4 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Dumbbell size={22} className="text-orange-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-gray-700">运动打卡</p>
              <p className="text-xs text-gray-400">连续{sportConsecutive}天</p>
            </div>
          </button>
          <button onClick={() => navigate('/report')} className="card flex items-center gap-3 p-4 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp size={22} className="text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-gray-700">周报汇总</p>
              <p className="text-xs text-gray-400">本周回顾</p>
            </div>
          </button>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">本周概览</h2>
          <button onClick={() => navigate('/report')} className="text-xs text-primary-600 flex items-center gap-1">
            查看周报 <ArrowRight size={14} />
          </button>
        </div>
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">运动</span>
            </div>
            <span className="text-sm font-semibold text-orange-500">{weekSportMinutes}分钟</span>
          </div>
          <div className="border-t border-gray-50" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">英语</span>
            </div>
            <span className="text-sm font-semibold text-blue-500">{weekEnglishMinutes}分钟</span>
          </div>
          <div className="border-t border-gray-50" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">阅读</span>
            </div>
            <span className="text-sm font-semibold text-purple-500">{weekReadingMinutes}分钟</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {(todaySport.length > 0 || todayEnglish.length > 0 || todayReading.length > 0) && (
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-700 mb-3">今日动态</h2>
          <div className="space-y-2">
            {todaySport.map(r => (
              <div key={r.id} className="card flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Dumbbell size={16} className="text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{r.type} {r.duration}分钟</p>
                  {r.note && <p className="text-xs text-gray-400">{r.note}</p>}
                </div>
              </div>
            ))}
            {todayEnglish.map(r => (
              <div key={r.id} className="card flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Languages size={16} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {r.type === 'dictation' ? '精听训练' : r.type === 'speaking' ? '口语练习' : r.type === 'vocabulary' ? '词汇学习' : '真题练习'}
                    {' '}{r.duration}分钟
                  </p>
                </div>
              </div>
            ))}
            {todayReading.map(r => (
              <div key={r.id} className="card flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <BookOpen size={16} className="text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{r.chapter} · {r.duration}分钟</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
