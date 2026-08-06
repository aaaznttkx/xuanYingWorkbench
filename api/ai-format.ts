/// <reference types="node" />

// POST /api/ai-format
// 接收原始阅读心得，调用 DeepSeek API 整理为结构化笔记
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { rawText, bookTitle } = await req.json();

    if (!rawText?.trim()) {
      return Response.json({ error: '请输入阅读心得' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      // Fallback: rule-based formatting without AI
      return formatWithRules(rawText, bookTitle);
    }

    return await formatWithAI(rawText, bookTitle, apiKey);
  } catch (error: any) {
    console.error('AI Format Error:', error);
    // Fallback on error
    try {
      const { rawText, bookTitle } = await req.clone().json();
      return formatWithRules(rawText, bookTitle);
    } catch {
      return Response.json({ error: error.message || '整理失败' }, { status: 500 });
    }
  }
}

// DeepSeek AI formatting
async function formatWithAI(rawText: string, bookTitle: string, apiKey: string): Promise<Response> {
  const prompt = `你是一位专业的读书笔记整理助手。请将用户输入的阅读心得整理成以下 JSON 格式：

{
  "chapter": "章节名称（从内容推断，如无明确章节则写"阅读笔记"）",
  "keyPoints": "核心观点（提炼2-5个要点，用中文表达，每条一行）",
  "reflection": "我的感悟（将用户的感受整理成连贯段落，保留第一人称）"
}

要求：
- chapter 简洁明了
- keyPoints 提炼核心要点，每条前面不要加编号
- reflection 保留用户原文的情感和观点，整理成流畅段落
- 所有内容使用中文表达
- 只输出 JSON，不要 markdown 标记或其他文字

${bookTitle ? `当前书籍：《${bookTitle}》` : ''}

用户输入的心得：
${rawText}`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${err}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content || '';

  // Parse the JSON response
  let result: { chapter?: string; keyPoints?: string; reflection?: string } = {};
  try {
    // Clean markdown code blocks if present
    const jsonStr = content.replace(/```json\s*|\s*```/g, '').trim();
    result = JSON.parse(jsonStr);
  } catch {
    // If JSON parsing fails, try to extract fields manually
    const chMatch = content.match(/chapter["\s:]+["']?([^"'\n]+)/i);
    const kpMatch = content.match(/keyPoints["\s:]+["']([^"']+)/i);
    const rfMatch = content.match(/reflection["\s:]+["']([^"']+)/i);
    result = {
      chapter: chMatch?.[1] || '阅读笔记',
      keyPoints: kpMatch?.[1] || rawText.slice(0, 200),
      reflection: rfMatch?.[1] || rawText,
    };
  }

  return Response.json({
    chapter: result.chapter || '阅读笔记',
    keyPoints: result.keyPoints || '',
    reflection: result.reflection || '',
  });
}

// Rule-based fallback (no API key needed)
// 更智能地分离「核心观点（客观陈述）」与「我的感悟（主观感受）」
function formatWithRules(rawText: string, bookTitle: string): Response {
  const text = rawText.trim();

  // 1. 提取章节信息
  const chapterPatterns = [
    /第[一二三四五六七八九十百千零\d]+[章节回卷]/,
    /Chapter\s+\d+/i,
    /第\s*\d+\s*[章节]/,
  ];
  let chapter = '阅读笔记';
  for (const pat of chapterPatterns) {
    const m = text.match(pat);
    if (m) {
      const idx = text.indexOf(m[0]);
      chapter = text.slice(idx, idx + Math.min(m[0].length + 12, 24)).replace(/[，,。.、\n].*/, '').trim();
      break;
    }
  }

  // 2. 拆分成句子
  const sentences = text
    .split(/\n+|。|！|？|；|！|；|\.\s/)
    .map(s => s.trim())
    .filter(s => s.length > 4);

  // 3. 主观感受标记词 —— 出现则归入「我的感悟」
  const subjectiveWords = [
    '我', '觉得', '感觉', '感受', '想到', '让我', '使我', '令我',
    '认为', '感悟', '启发', '印象', '触动', '想起', '联想', '思考',
    '体会', '深有感触', '让我想到', '不禁', '忍不住', '感悟到',
    '体会到', '意识到', '发现', '原来', '其实我觉得', '个人认为',
  ];
  // 客观陈述标记词 —— 出现则归入「核心观点」
  const objectiveWords = [
    '提出', '说明', '指出', '强调', '核心', '关键', '主要', '重要',
    '概念', '理论', '方法', '原则', '观点', '作者', '书中', '本章',
    '讲', '介绍', '阐述', '分析', '讨论', '揭示', '表明', '认为',
    '是', '在于', '通过', '需要', '应该', '可以',
  ];

  const keyPointList: string[] = [];
  const reflectionList: string[] = [];

  for (const s of sentences) {
    const isSubjective = subjectiveWords.some(w => s.includes(w));
    const isObjective = objectiveWords.some(w => s.includes(w));
    if (isSubjective && !isObjective) {
      reflectionList.push(s);
    } else if (isObjective && !isSubjective) {
      keyPointList.push(s);
    } else if (isSubjective && isObjective) {
      // 两者都命中：含「我」优先归感悟，否则归观点
      /我|觉得|感受|感悟/.test(s) ? reflectionList.push(s) : keyPointList.push(s);
    } else {
      // 都没命中：短句归观点，长句且无明显人称归观点；默认归观点
      keyPointList.push(s);
    }
  }

  // 4. 兜底：如果某一类为空，按数量比例分配
  if (keyPointList.length === 0 && reflectionList.length > 0) {
    const mid = Math.ceil(reflectionList.length / 2);
    keyPointList.push(...reflectionList.splice(mid));
  } else if (reflectionList.length === 0 && keyPointList.length > 1) {
    const mid = Math.ceil(keyPointList.length / 2);
    reflectionList.push(...keyPointList.splice(mid));
  }

  const clean = (arr: string[]) =>
    arr
      .filter((p, i, a) => a.indexOf(p) === i)
      .map(p => (p.length > 3 && !/[。！？]$/.test(p) ? p + '。' : p))
      .join('\n');

  const keyPoints = clean(keyPointList) || text.slice(0, 300);
  const reflection = clean(reflectionList) || '';

  return Response.json({ chapter, keyPoints, reflection });
}
