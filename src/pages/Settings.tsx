import { useState } from 'react';
import { ArrowLeft, Database, Download, Upload, Trash2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';

export default function Settings() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

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
            <p>📅 版本 1.0.0</p>
            <p>🌱 英语学习 · 读书笔记 · 运动打卡</p>
            <p className="text-xs text-gray-400 mt-2">数据存储在浏览器本地，建议定期导出备份。</p>
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
