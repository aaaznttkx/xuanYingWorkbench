import { useState, useEffect } from 'react';
import { ArrowLeft, Database, Download, Upload, Trash2, Info, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { getSyncStatus, getIsOnline, syncAll } from '../api/sync';

export default function Settings() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [syncStat, setSyncStat] = useState(getSyncStatus());
  const online = getIsOnline();

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStat(getSyncStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setMessage('正在同步...');
    try {
      await syncAll();
      setMessage('数据同步完成！');
    } catch {
      setMessage('同步失败，请检查网络连接');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const exportData = async () => {
    try {
      const data = {
        englishRecords: await db.englishRecords.toArray(),
        words: await db.words.toArray(),
        wrongQuestions: await db.wrongQuestions.toArray(),
        books: await db.books.toArray(),
        readingNotes: await db.readingNotes.toArray(),
        sportRecords: await db.sportRecords.toArray(),
        weeklyReports: await db.weeklyReports.toArray(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `玄英拾光_备份_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('数据导出成功！');
    } catch {
      setMessage('导出失败，请重试');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);
        await db.englishRecords.clear();
        await db.words.clear();
        await db.wrongQuestions.clear();
        await db.books.clear();
        await db.readingNotes.clear();
        await db.sportRecords.clear();
        await db.weeklyReports.clear();
        if (data.englishRecords) await db.englishRecords.bulkAdd(data.englishRecords);
        if (data.words) await db.words.bulkAdd(data.words);
        if (data.wrongQuestions) await db.wrongQuestions.bulkAdd(data.wrongQuestions);
        if (data.books) await db.books.bulkAdd(data.books);
        if (data.readingNotes) await db.readingNotes.bulkAdd(data.readingNotes);
        if (data.sportRecords) await db.sportRecords.bulkAdd(data.sportRecords);
        if (data.weeklyReports) await db.weeklyReports.bulkAdd(data.weeklyReports);
        setMessage('数据导入成功！');
        setTimeout(() => setMessage(''), 3000);
      } catch {
        setMessage('导入失败，请检查文件格式');
        setTimeout(() => setMessage(''), 3000);
      }
    };
    input.click();
  };

  const clearAll = async () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      await db.englishRecords.clear();
      await db.words.clear();
      await db.wrongQuestions.clear();
      await db.books.clear();
      await db.readingNotes.clear();
      await db.sportRecords.clear();
      await db.weeklyReports.clear();
      setMessage('所有数据已清空');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">设置</h1>
      </div>

      {message && (
        <div className="bg-primary-50 text-primary-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {/* Cloud Sync Status */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            {online ? <Cloud size={20} className="text-blue-500" /> : <CloudOff size={20} className="text-gray-400" />}
            <span className="font-semibold text-gray-700">云同步</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
              syncStat === 'syncing' ? 'bg-blue-50 text-blue-600' :
              syncStat === 'error' ? 'bg-red-50 text-red-500' :
              syncStat === 'offline' ? 'bg-gray-100 text-gray-500' :
              'bg-green-50 text-green-600'
            }`}>
              {syncStat === 'syncing' ? '同步中...' :
               syncStat === 'error' ? '同步失败' :
               syncStat === 'offline' ? '离线' :
               '已同步'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            数据自动同步到 Vercel Postgres 云端数据库。离线时数据保存在本地，联网后自动同步。
          </p>
          <button
            onClick={handleSync}
            disabled={!online || syncStat === 'syncing'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-medium active:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncStat === 'syncing' ? 'animate-spin' : ''} />
            手动同步数据
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Database size={20} className="text-primary-600" />
            <span className="font-semibold text-gray-700">数据管理</span>
          </div>
          <div className="space-y-2">
            <button onClick={exportData} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 text-primary-700 font-medium active:bg-primary-100 transition-colors">
              <Download size={18} />
              导出数据备份
            </button>
            <button onClick={importData} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-medium active:bg-blue-100 transition-colors">
              <Upload size={18} />
              导入数据备份
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Info size={20} className="text-gray-500" />
            <span className="font-semibold text-gray-700">关于</span>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>📖 玄英拾光 - 个人成长工作台</p>
            <p>📅 版本 2.0.0 (支持云同步)</p>
            <p>🌱 英语学习 · 读书笔记 · 运动打卡</p>
            <p className="text-xs text-gray-400 mt-2">数据同时存储在浏览器本地和 Vercel Postgres 云端，支持离线使用和自动同步。</p>
          </div>
        </div>

        <button onClick={clearAll} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-500 font-medium active:bg-red-100 transition-colors">
          <Trash2 size={18} />
          清空所有数据
        </button>
      </div>
    </div>
  );
}
