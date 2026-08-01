import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Check, X, Save, RefreshCw } from 'lucide-react';
import { generateId } from '../db';
import { addEnglishRecord } from '../api/sync';
import { todayStr } from '../utils/dateUtils';
import useSpeech from '../hooks/useSpeech';

const sampleMaterials = [
  { id: '1', title: '四级听力 - 校园对话', sentences: [
    'Good morning, Professor. I have a question about the assignment.',
    'Of course. What seems to be the problem?',
    "I'm not sure I understand the requirements for the final paper.",
    'The paper should be at least 2000 words, and you need to cite at least five academic sources.',
  ]},
  { id: '2', title: '四级听力 - 日常交流', sentences: [
    "Have you decided what courses you're going to take this semester?",
    "I'm thinking about taking Introduction to Psychology. I've heard it's really interesting.",
    'That sounds great. I took it last year and really enjoyed it.',
    'The professor is excellent, and the workload is manageable.',
  ]},
  { id: '3', title: '四级听力 - 新闻短讯', sentences: [
    'The university has announced plans to build a new library on campus.',
    'Construction is expected to begin next spring and finish within two years.',
    'The new facility will include study rooms, a café, and a digital media center.',
    'Students have expressed excitement about the project on social media.',
  ]},
];

export default function Dictation() {
  const navigate = useNavigate();
  const { isPlaying, error: speechError, speak, cancel } = useSpeech();

  const [selectedMaterial, setSelectedMaterial] = useState(sampleMaterials[0]);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<{sentence: string; user: string; correct: boolean}[]>([]);
  const [customText, setCustomText] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSpeak = () => {
    if (isPlaying) {
      cancel();
    } else {
      speak(selectedMaterial.sentences[currentSentence]);
    }
  };

  const checkAnswer = () => {
    const sentence = selectedMaterial.sentences[currentSentence];
    const userClean = userInput.trim().toLowerCase().replace(/[.,!?]/g, '');
    const sentenceClean = sentence.trim().toLowerCase().replace(/[.,!?]/g, '');
    const correct = userClean === sentenceClean;
    setResults([...results, { sentence, user: userInput, correct }]);
    setShowAnswer(true);
  };

  const nextSentence = () => {
    if (currentSentence < selectedMaterial.sentences.length - 1) {
      setCurrentSentence(currentSentence + 1);
      setUserInput('');
      setShowAnswer(false);
    }
  };

  const finishDictation = async () => {
    const correctCount = results.filter(r => r.correct).length;
    const score = Math.round((correctCount / results.length) * 100);
    await addEnglishRecord({
      id: generateId(),
      type: 'dictation',
      date: todayStr(),
      duration: results.length * 3,
      title: selectedMaterial.title,
      content: JSON.stringify(results),
      notes: `正确率: ${score}% (${correctCount}/${results.length})`,
    });
    navigate('/english');
  };

  const addCustomMaterial = () => {
    if (!customText.trim()) return;
    const sentences = customText.split('\n').filter(s => s.trim());
    if (sentences.length > 0) {
      setSelectedMaterial({
        id: 'custom',
        title: '自定义材料',
        sentences,
      });
      setCurrentSentence(0);
      setUserInput('');
      setShowAnswer(false);
      setResults([]);
      setShowCustom(false);
      setCustomText('');
    }
  };

  const reset = () => {
    setCurrentSentence(0);
    setUserInput('');
    setShowAnswer(false);
    setResults([]);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/english')} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">精听训练</h1>
      </div>

      {results.length === 0 || currentSentence < selectedMaterial.sentences.length ? (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {sampleMaterials.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedMaterial(m); reset(); }}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedMaterial.id === m.id ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-600'
                }`}
              >
                {m.title}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(true)}
              className="whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium bg-green-50 text-green-600"
            >
              + 自定义
            </button>
          </div>

          <div className="card mb-4 text-center">
            <p className="text-sm text-gray-400 mb-3">
              第 {currentSentence + 1} / {selectedMaterial.sentences.length} 句
            </p>
            <button
              onClick={handleSpeak}
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all ${
                isPlaying ? 'bg-blue-100 text-blue-500 scale-110' : 'bg-blue-500 text-white'
              }`}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
            </button>
            <p className="text-xs text-gray-400">
              {isPlaying ? '正在播放...' : '点击播放，逐句听写'}
            </p>

            {/* Speech error with retry */}
            {speechError && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                <span>{speechError}</span>
                <button
                  onClick={handleSpeak}
                  className="flex items-center gap-1 text-orange-700 font-medium underline"
                >
                  <RefreshCw size={14} /> 重试
                </button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <textarea
              className="input-field min-h-[120px]"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="在这里输入你听到的内容..."
            />
          </div>

          {showAnswer && (
            <div className="card mb-4">
              <div className="flex items-start gap-2 mb-2">
                {results[results.length - 1]?.correct ? (
                  <Check size={18} className="text-green-500 mt-0.5" />
                ) : (
                  <X size={18} className="text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">正确答案：</p>
                  <p className="text-sm text-gray-800">{selectedMaterial.sentences[currentSentence]}</p>
                  {!results[results.length - 1]?.correct && (
                    <>
                      <p className="text-xs text-gray-400 mt-2 mb-1">你的答案：</p>
                      <p className="text-sm text-red-500">{results[results.length - 1]?.user}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!showAnswer ? (
              <button onClick={checkAnswer} disabled={!userInput.trim()} className="btn-primary flex-1 disabled:opacity-50">
                提交答案
              </button>
            ) : currentSentence < selectedMaterial.sentences.length - 1 ? (
              <button onClick={nextSentence} className="btn-primary flex-1">
                下一句
              </button>
            ) : (
              <button onClick={finishDictation} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Save size={18} /> 完成训练
              </button>
            )}
          </div>
        </>
      ) : null}

      {showCustom && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCustom(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-[480px] p-5 animate-slide-up">
            <h3 className="text-lg font-semibold mb-3">自定义听写材料</h3>
            <p className="text-xs text-gray-400 mb-3">每行一句话，共4-6句为宜</p>
            <textarea
              className="input-field min-h-[150px] mb-4"
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              placeholder={`Good morning, Professor.\nI have a question about the assignment.\n...`}
            />
            <button onClick={addCustomMaterial} className="btn-primary w-full">开始听写</button>
          </div>
        </div>
      )}
    </div>
  );
}
