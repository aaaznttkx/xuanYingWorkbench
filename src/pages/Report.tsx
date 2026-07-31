import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, FileText, Dumbbell, BookOpen, Languages, ChevronRight, Sparkles } from 'lucide-react';
import { db, generateId } from '../db';
import { addWeeklyReport } from '../api/sync';
import { getWeekRange } from '../utils/dateUtils';
import { format, parseISO, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import Modal from '../components/Modal';

export default function Report() {
  const navigate = useNavigate();
  const sportRecords = useLiveQuery(() => db.sportRecords.toArray()) || [];
  const readingNotes = useLiveQuery(() => db.readingNotes.toArray()) || [];
  const englishRecords = useLiveQuery(() => db.englishRecords.toArray()) || [];
  const words = useLiveQuery(() => db.words.toArray()) || [];
  const wrongQuestions = useLiveQuery(() => db.wrongQuestions.toArray()) || [];
  const reports = useLiveQuery(() => db.weeklyReports.orderBy('weekStart').reverse().toArray()) || [];

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showReport, setShowReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const { start, end } = getWeekRange(currentWeek);
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  // Week data
  const weekSport = sportRecords.filter(r => r.date >= start && r.date <= end);
  const weekReading = readingNotes.filter(r => r.date >= start && r.date <= end);
  const weekEnglish = englishRecords.filter(r => r.date >= start && r.date <= end);
  const weekWords = words.filter(w => w.addedDate >= start && w.addedDate <= end);
  const weekWrong = wrongQuestions.filter(q => q.date >= start && q.date <= end);

  const sportDays = new Set(weekSport.map(r => r.date)).size;
  const sportMinutes = weekSport.reduce((s, r) => s + r.duration, 0);
  const readingMinutes = weekReading.reduce((s, r) => s + r.duration, 0);
  const englishMinutes = weekEnglish.reduce((s, r) => s + r.duration, 0);
  const reviewedWrong = weekWrong.filter(q => q.reviewed).length;

  const generateReport = async () => {
    const report = {
      id: generateId(),
      weekStart: start,
      weekEnd: end,
      sportSummary: {
        totalDays: sportDays,
        totalDuration: sportMinutes,
        records: weekSport,
      },
      readingSummary: {
        totalBooks: new Set(weekReading.map(n => n.bookId)).size,
        totalDuration: readingMinutes,
        notes: weekReading,
      },
      englishSummary: {
        totalDuration: englishMinutes,
        records: weekEnglish,
        newWords: weekWords.length,
        reviewedMistakes: reviewedWrong,
      },
      generatedAt: new Date().toISOString(),
    };

    await addWeeklyReport(report);
    setGeneratedReport(report);
    setShowReport(true);
  };

  const viewReport = (report: any) => {
    setGeneratedReport(report);
    setShowReport(true);
  };

  const totalActivity = sportMinutes + readingMinutes + englishMinutes;

  const existingReport = reports.find(r => r.weekStart === start);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">周报汇总</h1>
      </div>

      {/* Week Navigator */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <span className="font-semibold text-gray-700 text-sm">
            {format(weekStart, 'M/d')} - {format(weekEnd, 'M/d')}
          </span>
          <button
            onClick={() => {
              const next = addWeeks(currentWeek, 1);
              if (next <= new Date()) setCurrentWeek(next);
            }}
            className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Week Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-orange-50 rounded-xl">
            <Dumbbell size={18} className="text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-600">{sportMinutes}</p>
            <p className="text-xs text-gray-400">运动(分钟)</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-xl">
            <Languages size={18} className="text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-600">{englishMinutes}</p>
            <p className="text-xs text-gray-400">英语(分钟)</p>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-xl">
            <BookOpen size={18} className="text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-600">{readingMinutes}</p>
            <p className="text-xs text-gray-400">阅读(分钟)</p>
          </div>
        </div>

        {/* Generate Button */}
        {!existingReport && totalActivity > 0 && (
          <button
            onClick={generateReport}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} /> 生成本周报告
          </button>
        )}

        {existingReport && (
          <button
            onClick={() => viewReport(existingReport)}
            className="btn-outline w-full mt-4 flex items-center justify-center gap-2"
          >
            <FileText size={18} /> 查看本周报告
          </button>
        )}
      </div>

      {/* Weekly Activity Summary */}
      {totalActivity > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">本周活动总览</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Dumbbell size={16} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">运动</p>
                  <p className="text-xs text-gray-400">{sportDays}天 · {sportMinutes}分钟</p>
                </div>
              </div>
              <div className="flex gap-1">
                {['一','二','三','四','五','六','日'].map((d, i) => {
                  const date = format(new Date(weekStart.getTime() + i * 86400000), 'yyyy-MM-dd');
                  const hasSport = weekSport.some(r => r.date === date);
                  return (
                    <div key={i} className={`w-6 h-6 rounded text-[10px] flex items-center justify-center ${hasSport ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-300'}`}>
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-50" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Languages size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">英语</p>
                  <p className="text-xs text-gray-400">{englishMinutes}分钟 · {weekWords.length}新词</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-50" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <BookOpen size={16} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">阅读</p>
                  <p className="text-xs text-gray-400">{readingMinutes}分钟 · {weekReading.length}篇笔记</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Reports */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">历史周报</h2>
        {reports.length === 0 ? (
          <div className="card text-center py-8">
            <FileText size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">还没有周报记录</p>
            <p className="text-xs text-gray-300 mt-1">每周日会自动汇总生成</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map(r => (
              <button
                key={r.id}
                onClick={() => viewReport(r)}
                className="card w-full text-left flex items-center gap-3 p-3 active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <FileText size={20} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">
                    {format(parseISO(r.weekStart), 'M/d')} - {format(parseISO(r.weekEnd), 'M/d')}
                  </p>
                  <p className="text-xs text-gray-400">
                    运动{r.sportSummary.totalDays}天 · 阅读{r.readingSummary.totalDuration}分钟 · 英语{r.englishSummary.totalDuration}分钟
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      <Modal isOpen={showReport} onClose={() => setShowReport(false)} title="📊 周报详情">
        {generatedReport && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {format(parseISO(generatedReport.weekStart), 'yyyy年M月d日')} - {format(parseISO(generatedReport.weekEnd), 'M月d日')}
            </p>

            {/* Overall */}
            <div className="p-4 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl text-white">
              <p className="text-primary-100 text-sm mb-1">本周总活动时长</p>
              <p className="text-4xl font-bold">
                {generatedReport.sportSummary.totalDuration + generatedReport.readingSummary.totalDuration + generatedReport.englishSummary.totalDuration}
                <span className="text-lg font-normal text-primary-100"> 分钟</span>
              </p>
            </div>

            {/* Sport */}
            <div className="p-4 bg-orange-50 rounded-2xl">
              <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                <Dumbbell size={18} /> 运动
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-400">运动天数</p>
                  <p className="text-xl font-bold text-orange-600">{generatedReport.sportSummary.totalDays}天</p>
                </div>
                <div>
                  <p className="text-gray-400">运动时长</p>
                  <p className="text-xl font-bold text-orange-600">{generatedReport.sportSummary.totalDuration}分钟</p>
                </div>
              </div>
              {generatedReport.sportSummary.records.length > 0 && (
                <div className="mt-2 space-y-1">
                  {generatedReport.sportSummary.records.slice(0, 5).map((r: any) => (
                    <div key={r.id} className="text-sm text-gray-600 flex justify-between">
                      <span>{r.date} {r.type}</span>
                      <span>{r.duration}分钟</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* English */}
            <div className="p-4 bg-blue-50 rounded-2xl">
              <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                <Languages size={18} /> 英语学习
              </h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-400">学习时长</p>
                  <p className="text-xl font-bold text-blue-600">{generatedReport.englishSummary.totalDuration}分钟</p>
                </div>
                <div>
                  <p className="text-gray-400">新增词汇</p>
                  <p className="text-xl font-bold text-blue-600">{generatedReport.englishSummary.newWords}个</p>
                </div>
                <div>
                  <p className="text-gray-400">复习错题</p>
                  <p className="text-xl font-bold text-blue-600">{generatedReport.englishSummary.reviewedMistakes}道</p>
                </div>
              </div>
            </div>

            {/* Reading */}
            <div className="p-4 bg-purple-50 rounded-2xl">
              <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                <BookOpen size={18} /> 阅读
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-400">阅读时长</p>
                  <p className="text-xl font-bold text-purple-600">{generatedReport.readingSummary.totalDuration}分钟</p>
                </div>
                <div>
                  <p className="text-gray-400">笔记数量</p>
                  <p className="text-xl font-bold text-purple-600">{generatedReport.readingSummary.notes.length}篇</p>
                </div>
              </div>
              {generatedReport.readingSummary.notes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {generatedReport.readingSummary.notes.slice(0, 5).map((n: any) => (
                    <div key={n.id} className="text-sm text-gray-600">
                      <span className="font-medium">{n.chapter}</span>
                      <span className="text-gray-400 ml-2">{n.duration}分钟</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reflection prompt */}
            <div className="p-4 bg-green-50 rounded-2xl">
              <h4 className="font-semibold text-green-700 mb-2">💭 本周反思</h4>
              <p className="text-sm text-green-600">
                {generatedReport.sportSummary.totalDays >= 5 ? '运动表现很棒，保持住！' :
                 generatedReport.sportSummary.totalDays >= 3 ? '运动习惯不错，可以再加强一些。' :
                 '运动方面需要加油哦，每天动一动！'}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {generatedReport.englishSummary.totalDuration >= 180 ? '英语学习投入充足，继续保持！' :
                 generatedReport.englishSummary.totalDuration >= 60 ? '英语学习有在坚持，可以适当增加时间。' :
                 '英语学习需要加强，每天半小时会有很大进步。'}
              </p>
            </div>

            <p className="text-xs text-gray-400 text-center">
              生成时间：{format(parseISO(generatedReport.generatedAt), 'yyyy-MM-dd HH:mm')}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
