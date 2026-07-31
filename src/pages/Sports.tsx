import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Dumbbell, Flame, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, generateId } from '../db';
import { todayStr, getMonthStats, getMonthDays, formatDate } from '../utils/dateUtils';
import type { SportType } from '../types';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { startOfMonth, endOfMonth, subMonths, addMonths, format, isToday, parseISO } from 'date-fns';

const sportTypes: SportType[] = ['跑步', '游泳', '健身', '篮球', '足球', '羽毛球', '骑行', '瑜伽', '跳绳', '其他'];
const sportIcons: Record<string, string> = {
  '跑步': '🏃', '游泳': '🏊', '健身': '💪', '篮球': '🏀',
  '足球': '⚽', '羽毛球': '🏸', '骑行': '🚴', '瑜伽': '🧘', '跳绳': '🪢', '其他': '🎯'
};



export default function Sports() {
  const navigate = useNavigate();
  const records = useLiveQuery(() => db.sportRecords.orderBy('date').reverse().toArray()) || [];
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: '跑步' as string, duration: 30, distance: '', note: '' });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const sportDates = records.map(r => r.date);
  const { totalDays: monthDays, consecutiveDays } = getMonthStats(sportDates);
  const todayRecords = records.filter(r => r.date === todayStr());
  const todayMinutes = todayRecords.reduce((s, r) => s + r.duration, 0);

  // Calendar data
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const monthDaysList = getMonthDays(calendarMonth);
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7; // Monday start
  const checkedDates = new Set(sportDates.filter(d => {
    const date = parseISO(d);
    return date >= monthStart && date <= monthEnd;
  }));

  const addRecord = async () => {
    await db.sportRecords.add({
      id: generateId(),
      type: form.type,
      duration: form.duration,
      distance: form.distance ? Number(form.distance) : undefined,
      date: todayStr(),
      note: form.note.trim() || undefined,
    });
    setForm({ type: '跑步', duration: 30, distance: '', note: '' });
    setShowAdd(false);
  };

  const deleteRecord = async (id: string) => {
    await db.sportRecords.delete(id);
  };

  // Sport type distribution for current month
  const monthRecords = records.filter(r => {
    const d = parseISO(r.date);
    return d >= monthStart && d <= monthEnd;
  });
  const typeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    monthRecords.forEach(r => { dist[r.type] = (dist[r.type] || 0) + r.duration; });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  }, [monthRecords]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">运动打卡</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card bg-gradient-to-r from-orange-400 to-orange-500 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={20} />
            <span className="text-sm text-orange-100">连续打卡</span>
          </div>
          <p className="text-3xl font-bold">{consecutiveDays} <span className="text-lg font-normal">天</span></p>
        </div>
        <div className="card bg-gradient-to-r from-green-400 to-green-500 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={20} />
            <span className="text-sm text-green-100">本月运动</span>
          </div>
          <p className="text-3xl font-bold">{monthDays} <span className="text-lg font-normal">天</span></p>
        </div>
      </div>

      {/* Today Summary */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-700">今日运动</span>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-sm text-primary-600 font-medium">
            <Plus size={16} /> 打卡
          </button>
        </div>
        {todayRecords.length > 0 ? (
          <div className="space-y-2">
            {todayRecords.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sportIcons[r.type] || '🎯'}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-700">{r.type}</span>
                    <span className="text-xs text-gray-400 ml-2">{r.duration}分钟</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-orange-500">{r.duration}min</span>
              </div>
            ))}
            <p className="text-sm font-semibold text-center text-orange-500">
              总计 {todayMinutes} 分钟
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-3">今天还没有运动哦，快去打卡吧！</p>
        )}
      </div>

      {/* Calendar */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold text-gray-700">{format(calendarMonth, 'yyyy年M月')}</span>
          <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['一', '二', '三', '四', '五', '六', '日'].map(d => (
            <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {monthDaysList.map((day) => {
            const dateStr = formatDate(day);
            const isChecked = checkedDates.has(dateStr);
            const isTodayDate = isToday(day);
            return (
              <div
                key={dateStr}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  isChecked
                    ? 'bg-primary-500 text-white shadow-sm'
                    : isTodayDate
                    ? 'border-2 border-primary-400 text-gray-700'
                    : 'text-gray-500'
                }`}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary-500" />
            <span className="text-xs text-gray-400">已打卡</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-primary-400" />
            <span className="text-xs text-gray-400">今天</span>
          </div>
        </div>
      </div>

      {/* Sport Distribution */}
      {typeDistribution.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">本月运动分布</h3>
          <div className="space-y-2">
            {typeDistribution.map(([type, duration]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="text-lg">{sportIcons[type]}</span>
                <span className="text-sm text-gray-600 w-14">{type}</span>
                <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${type === '跑步' ? 'bg-orange-400' : type === '游泳' ? 'bg-blue-400' : type === '健身' ? 'bg-red-400' : 'bg-green-400'}`}
                    style={{ width: `${(duration / typeDistribution[0][1]) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">{duration}min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">打卡记录</h2>
        {records.length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={32} />}
            title="还没有运动记录"
            description="开始你的第一次运动打卡"
            action={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm">去打卡</button>}
          />
        ) : (
          <div className="space-y-2">
            {records.slice(0, 30).map(r => (
              <div key={r.id} className="card flex items-center gap-3 py-3">
                <span className="text-xl">{sportIcons[r.type] || '🎯'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">
                    {r.type} · {r.duration}分钟
                    {r.distance ? ` · ${r.distance}km` : ''}
                  </p>
                  <p className="text-xs text-gray-400">{r.date}{r.note ? ` · ${r.note}` : ''}</p>
                </div>
                <button onClick={() => deleteRecord(r.id)} className="text-xs text-red-400 px-2 py-1">删除</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="运动打卡">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">运动项目</label>
            <div className="grid grid-cols-5 gap-2">
              {sportTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setForm({...form, type})}
                  className={`flex flex-col items-center p-2 rounded-xl text-xs transition-colors ${
                    form.type === type ? 'bg-orange-100 ring-2 ring-orange-400' : 'bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{sportIcons[type]}</span>
                  <span className="mt-0.5 text-gray-600">{type}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">时长（分钟）</label>
            <input className="input-field" type="number" value={form.duration} onChange={e => setForm({...form, duration: Number(e.target.value)})} min={1} max={300} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">距离 km（可选）</label>
            <input className="input-field" type="number" step="0.1" value={form.distance} onChange={e => setForm({...form, distance: e.target.value})} placeholder="如：5.0" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">备注（可选）</label>
            <input className="input-field" value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="心情、感受..." />
          </div>
          <button onClick={addRecord} className="btn-primary w-full">完成打卡</button>
        </div>
      </Modal>
    </div>
  );
}
