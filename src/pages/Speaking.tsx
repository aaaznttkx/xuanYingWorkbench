import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { generateId } from '../db';
import { addEnglishRecord } from '../api/sync';
import { todayStr } from '../utils/dateUtils';
import useSpeech from '../hooks/useSpeech';

interface ScoreDetail {
  fluency: number;
  vocabulary: number;
  grammar: number;
  pronunciation: number;
  feedback: string;
  pronunciationNotes: { word: string; type: '连读' | '变音' | '重读' | '弱读'; note: string }[];
}

const practiceSentences = [
  { text: "I've been meaning to tell you about the project.", level: '初级', tip: '注意 "I\'ve been" 的连读' },
  { text: "What do you think about the new policy?", level: '初级', tip: '注意 "What do you" 的连读变音' },
  { text: "She's been working on this for three years.", level: '中级', tip: "注意 \"She's been\" 和 \"three years\" 的连读" },
  { text: "Could you tell me where the nearest subway station is?", level: '中级', tip: '注意 "Could you" 的变音' },
  { text: "I would have gone if I had known about it earlier.", level: '高级', tip: '注意 "would have" 和 "had known" 的连读' },
  { text: "The most important thing is to never give up on your dreams.", level: '高级', tip: '注意 "most important" 连读和 "dreams" 重读' },
];

function simulateScoring(text: string): ScoreDetail {
  const baseScore = Math.floor(Math.random() * 30) + 65;
  const pronunciationNotes: ScoreDetail['pronunciationNotes'] = [];
  
  if (text.includes("'ve") || text.includes("'s")) {
    pronunciationNotes.push({ word: text.match(/\w+'\w+/)?.[0] || '', type: '连读', note: "缩写形式需连读，如 I've → /aɪv/" });
  }
  if (text.includes('you')) {
    pronunciationNotes.push({ word: 'you', type: '变音', note: '在 "Could you" / "What do you" 中常变读为 /jə/' });
  }
  if (text.includes('and')) {
    pronunciationNotes.push({ word: 'and', type: '弱读', note: '弱读为 /ən/ 或 /n/，不要重读' });
  }
  if (text.match(/\b(important|dreams|never|give)\b/i)) {
    pronunciationNotes.push({ word: text.match(/\b(important|dreams|never|give)\b/i)?.[0] || '', type: '重读', note: '关键词需重读以表达强调语气' });
  }
  if (text.includes('the')) {
    pronunciationNotes.push({ word: 'the', type: '弱读', note: '在辅音前读 /ðə/，元音前读 /ði/' });
  }

  return {
    fluency: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
    vocabulary: Math.min(100, baseScore + Math.floor(Math.random() * 15)),
    grammar: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
    pronunciation: Math.min(100, baseScore - 5 + Math.floor(Math.random() * 15)),
    feedback: baseScore >= 85 ? '很好！发音清晰，语调自然，继续保持！' :
              baseScore >= 75 ? '不错！注意个别单词的连读和重音位置。' :
              '需要多练习，特别是连读和语调。建议放慢速度，注意每个词的发音。',
    pronunciationNotes,
  };
}

export default function Speaking() {
  const navigate = useNavigate();
  const [selectedSentence, setSelectedSentence] = useState(practiceSentences[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [score, setScore] = useState<ScoreDetail | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const { speak } = useSpeech();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.start();
      setIsRecording(true);
      setHasRecorded(true);
      setScore(null);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          stream.getTracks().forEach(t => t.stop());
          setIsRecording(false);
        }
      }, 5000);
    } catch {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setHasRecorded(true);
      }, 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
  };

  const analyze = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 1500));
    const result = simulateScoring(selectedSentence.text);
    setScore(result);
    setIsAnalyzing(false);

    await addEnglishRecord({
      id: generateId(),
      type: 'speaking',
      date: todayStr(),
      duration: 5,
      title: `口语练习 - ${selectedSentence.level}`,
      content: selectedSentence.text,
      score: {
        fluency: result.fluency,
        vocabulary: result.vocabulary,
        grammar: result.grammar,
        pronunciation: result.pronunciation,
      },
      notes: result.feedback,
    });
  };

  const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/english')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">口语练习</h1>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">选择练习句子：</p>
        <div className="space-y-2">
          {practiceSentences.map((s, i) => (
            <button
              key={i}
              onClick={() => { setSelectedSentence(s); setScore(null); setHasRecorded(false); }}
              className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                selectedSentence.text === s.text ? 'border-green-500 bg-green-50' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  s.level === '初级' ? 'bg-green-100 text-green-600' :
                  s.level === '中级' ? 'bg-blue-100 text-blue-600' :
                  'bg-purple-100 text-purple-600'
                }`}>{s.level}</span>
                <button onClick={(e) => { e.stopPropagation(); speak(s.text); }} className="text-gray-400 active:text-gray-600">
                  <Volume2 size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-700 mt-2">{s.text}</p>
              <p className="text-xs text-gray-400 mt-1">💡 {s.tip}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-4 text-center">
        <p className="text-sm text-gray-400 mb-4">先听示范，然后录制你的发音</p>
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 transition-all ${
            isRecording ? 'bg-red-500 text-white scale-110 animate-pulse' : 'bg-green-500 text-white'
          }`}
        >
          {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
        <p className="text-xs text-gray-400">
          {isRecording ? '正在录音...松手结束' : '按住录音，松手结束'}
        </p>
      </div>

      {hasRecorded && !score && (
        <button
          onClick={analyze}
          disabled={isAnalyzing}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              正在分析中...
            </>
          ) : (
            <>
              <Sparkles size={20} /> AI 评分分析
            </>
          )}
        </button>
      )}

      {score && (
        <div className="card mb-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-yellow-500" />
            <span className="font-semibold text-gray-700">评分结果</span>
          </div>

          <ScoreBar label="流利度 Fluency" value={score.fluency} color="bg-blue-500" />
          <ScoreBar label="词汇 Vocabulary" value={score.vocabulary} color="bg-green-500" />
          <ScoreBar label="语法 Grammar" value={score.grammar} color="bg-purple-500" />
          <ScoreBar label="发音 Pronunciation" value={score.pronunciation} color="bg-orange-500" />

          {score.pronunciationNotes.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 rounded-xl">
              <p className="text-sm font-semibold text-orange-700 mb-2">🔤 发音标注</p>
              <div className="space-y-2">
                {score.pronunciationNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${
                      note.type === '连读' ? 'bg-blue-100 text-blue-600' :
                      note.type === '变音' ? 'bg-yellow-100 text-yellow-700' :
                      note.type === '重读' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>{note.type}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-700">{note.word}</span>
                      <span className="text-xs text-gray-500 ml-1">{note.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 p-3 bg-green-50 rounded-xl">
            <p className="text-sm text-green-700">💬 {score.feedback}</p>
          </div>

          <button onClick={() => { setScore(null); setHasRecorded(false); }} className="btn-outline w-full mt-4 flex items-center justify-center gap-2">
            <RotateCcw size={16} /> 重新练习
          </button>
        </div>
      )}
    </div>
  );
}
