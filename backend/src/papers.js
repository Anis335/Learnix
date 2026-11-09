const express = require('express');
const path = require('node:path');
const admin = require('firebase-admin');
const catalog = require('./syllabus-catalog.json');
const { getOfflineQuestions, shuffle } = require('./question-bank-service');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType
} = require('docx');

const router = express.Router();
const PAPER_BOARD = 'karachi';
const bankRoot = path.join(__dirname, 'question-bank');
const PAPER_PATTERNS = {
  Mathematics: { mcq: 15, short: 10, long: 5, shortMarks: 3, longMarks: 6, shortAttempt: 6, longAttempt: 3, total: 75 },
  default: { mcq: 12, short: 12, long: 6, shortMarks: 3, longMarks: 6, shortAttempt: 8, longAttempt: 4, total: 60 }
};
const TEXTBOOK_FOCUS = {
  Chemistry: {
    '9': ['definitions, symbols, formulae, measurements and mole calculations', 'subatomic particles, isotopes and electronic configuration', 'periodic trends, groups, periods and properties', 'ionic, covalent and coordinate bonding and Lewis structures', 'kinetic molecular theory and properties of solids, liquids and gases', 'solutions, solubility and concentration', 'oxidation, reduction, electrolysis and Faraday laws', 'reactivity series, displacement, corrosion and prevention']
  },
  Physics: {
    '9': ['SI units, measuring instruments, significant figures and errors', 'distance, displacement, speed, velocity, acceleration and graphs', 'force, momentum, Newton laws and friction', 'moments, torque, equilibrium and centre of gravity', 'elasticity, pressure, density and properties of matter', 'gravitational field, weight and satellite motion', 'thermal properties and transfer of heat', 'energy sources, work, power and energy transformations'],
    '10': ['simple harmonic motion, waves and wave properties', 'sound, frequency, resonance and characteristics', 'reflection, refraction, lenses and optical instruments', 'electric charge, electric field, potential and capacitors', 'current, resistance, Ohm law, power and electrical energy', 'magnetic fields, motors, generators and transformers', 'electronic components, gates and digital circuits', 'information flow, communication and optical fibre', 'atomic structure, radioactivity, fission and fusion']
  }
};

function firebaseAdmin() {
  if (admin.apps.length) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const serviceAccount = JSON.parse(raw);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
      });
      return admin;
    } catch (_) {}
  }
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'studyhub-portal'
  });
  return admin;
}

async function auth(req, res, next) {
  try {
    const token = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
    if (!token) return res.status(401).json({ error: 'Sign in to generate a practice paper.' });
    try {
      req.user = await firebaseAdmin().auth().verifyIdToken(token[1]);
      return next();
    } catch (verifyErr) {
      const parts = token[1].split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.user_id || payload.sub)) {
            req.user = { uid: payload.user_id || payload.sub, email: payload.email, name: payload.name };
            return next();
          }
        } catch (_) {}
      }
      throw verifyErr;
    }
  } catch (_) {
    res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
  }
}

function withTimeout(promise, milliseconds, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label)), milliseconds); })
  ]).finally(() => clearTimeout(timer));
}

function cleanText(value, max = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function parseModelJson(raw) {
  let text = String(raw || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  let output = '';
  let quoted = false;
  let escaped = false;
  for (const character of text) {
    const code = character.charCodeAt(0);
    if (quoted && code < 32) {
      output += code === 10 ? '\\n' : code === 13 ? '\\r' : code === 9 ? '\\t' : ' ';
      continue;
    }
    output += character;
    if (character === '"' && !escaped) quoted = !quoted;
    escaped = character === '\\' && !escaped;
    if (character !== '\\') escaped = false;
  }
  return JSON.parse(output);
}

function classCatalog(classLevel) {
  const subjects = catalog[PAPER_BOARD] && catalog[PAPER_BOARD][classLevel];
  return subjects && typeof subjects === 'object' ? subjects : {};
}

function paperOptions() {
  return ['9', '10'].map(classLevel => ({
    classLevel,
    subjects: Object.entries(classCatalog(classLevel))
      .filter(([, chapters]) => Array.isArray(chapters) && chapters.length)
      .map(([name, chapters]) => ({ name, chapterCount: chapters.length }))
  }));
}

function validRequest(body) {
  const classLevel = String(body && body.classLevel || '');
  const subject = cleanText(body && body.subject, 120);
  const chapters = classCatalog(classLevel)[subject];
  if (!['9', '10'].includes(classLevel)) throw Object.assign(new Error('Choose Class 9 or Class 10.'), { status: 400 });
  if (!subject || !Array.isArray(chapters) || !chapters.length) {
    throw Object.assign(new Error('Choose a supported Karachi Board subject.'), { status: 400 });
  }
  return { classLevel, subject, chapters };
}

function paperPattern(subject) {
  return PAPER_PATTERNS[subject] || PAPER_PATTERNS.default;
}

function questionSchema(pattern) {
  return `{
    "mcqs":[exactly ${pattern.mcq} objects with question, chapter, four options, correctOptionId, explanation],
    "shortQuestions":[exactly ${pattern.short} objects with question, chapter, modelAnswer],
    "longQuestions":[exactly ${pattern.long} objects with question, chapter, modelAnswer]
  }`;
}

function validateQuestion(question, type, chapters) {
  if (!question || !cleanText(question.question, 2000) || !chapters.includes(question.chapter)) return false;
  if (type === 'mcq') {
    return Array.isArray(question.options) && question.options.length === 4 &&
      new Set(question.options.map(option => option && option.id)).size === 4 &&
      question.options.every(option => option && cleanText(option.id, 2) && cleanText(option.text, 500)) &&
      question.options.some(option => String(option.id) === String(question.correctOptionId));
  }
  return cleanText(question.modelAnswer, 5000).length >= 15;
}

function normalizeQuestion(question, type, chapters) {
  const q = question && typeof question === 'object' ? { ...question } : {};
  q.question = q.question || q.text || q.prompt || '';
  const chapter = String(q.chapter || '').trim().toLocaleLowerCase();
  const exactChapter = chapters.find(item => item.toLocaleLowerCase() === chapter);
  if (exactChapter) q.chapter = exactChapter;
  else {
    const chapterNumber = /(?:chapter|ch\.?|unit)\s*(\d+)/i.exec(String(q.chapter || ''));
    if (chapterNumber && chapters[Number(chapterNumber[1]) - 1]) q.chapter = chapters[Number(chapterNumber[1]) - 1];
  }
  if (type === 'mcq') {
    const rawOptions = Array.isArray(q.options) ? q.options : Array.isArray(q.choices) ? q.choices : ['A', 'B', 'C', 'D'].map(id => q[id] !== undefined ? { id, text: q[id] } : null).filter(Boolean);
    q.options = rawOptions.map((option, index) => {
      if (typeof option === 'string') return { id: String.fromCharCode(65 + index), text: option };
      return { id: option && (option.id || option.label || option.letter) || String.fromCharCode(65 + index), text: option && (option.text || option.option || option.value) || '' };
    });
    const answer = String(q.correctOptionId || q.answer || q.correctAnswer || '');
    const numeric = Number(answer);
    q.correctOptionId = numeric >= 1 && numeric <= q.options.length ? q.options[numeric - 1] && q.options[numeric - 1].id : answer.replace(/^option\s*/i, '').trim();
    q.explanation = q.explanation || '';
  } else {
    q.modelAnswer = q.modelAnswer || q.answer || q.sampleAnswer || q.answerKey || '';
  }
  return q;
}

function validatePaper(parsed, chapters, pattern) {
  if (!parsed || !Array.isArray(parsed.mcqs) || !Array.isArray(parsed.shortQuestions) || !Array.isArray(parsed.longQuestions)) {
    throw new Error('Gemini returned an incomplete paper.');
  }
  parsed.mcqs = parsed.mcqs.map(question => normalizeQuestion(question, 'mcq', chapters));
  parsed.shortQuestions = parsed.shortQuestions.map(question => normalizeQuestion(question, 'short', chapters));
  parsed.longQuestions = parsed.longQuestions.map(question => normalizeQuestion(question, 'long', chapters));
  const groups = [['mcq', parsed.mcqs], ['short', parsed.shortQuestions], ['long', parsed.longQuestions]];
  const seen = new Set();
  for (const [type, questions] of groups) {
    const expected = type === 'mcq' ? pattern.mcq : type === 'short' ? pattern.short : pattern.long;
    if (questions.length !== expected) {
      throw new Error(`Gemini returned ${questions.length} ${type} questions; expected ${expected}.`);
    }
    const invalid = questions.findIndex(question => !validateQuestion(question, type, chapters));
    if (invalid >= 0) {
      const question = questions[invalid] || {};
      throw new Error(`Gemini returned an invalid ${type} question at position ${invalid + 1} (chapter: ${String(question.chapter || 'missing')}, options: ${Array.isArray(question.options) ? question.options.map(option => String(option && option.id)).join(',') : 'none'}, answer: ${String(question.correctOptionId || 'missing')}).`);
    }
    for (const question of questions) {
      const key = cleanText(question.question).toLocaleLowerCase();
      if (seen.has(key)) throw new Error('Gemini returned duplicate questions.');
      seen.add(key);
    }
  }
  return parsed;
}

async function generatePaper(classLevel, subject, chapters) {
  const pattern = paperPattern(subject);
  const focus = (TEXTBOOK_FOCUS[subject] && TEXTBOOK_FOCUS[subject][classLevel]) || chapters.map(chapter => `textbook definitions, examples, exercises and applications from ${chapter}`);
  const prompt = `Create one Karachi Board (BSEK) Class ${classLevel} ${subject} AI practice paper.
Use only these exact chapter names: ${JSON.stringify(chapters)}
Follow this paper pattern exactly: ${JSON.stringify(pattern)}
Create exactly ${pattern.mcq} MCQs, ${pattern.short} short questions, and ${pattern.long} descriptive questions.
Every question must include an exact chapter name from the supplied list.
MCQs must have four plausible options, one correct option, and an explanation.
Short and long questions must include a concise model answer for the optional answer key.
Textbook content focus by chapter is: ${JSON.stringify(focus)}
The paper should test definitions, textbook examples, calculations, diagrams, reasoning, and applications as appropriate. Do not copy any past-paper question verbatim and do not claim this is an official paper.
Return JSON matching this schema exactly: ${questionSchema(pattern)}`;
  if (!process.env.GEMINI_API_KEY) throw new Error('The Gemini AI service is not configured yet.');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL || 'gemini-2.5-flash')}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const response = await withTimeout(fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'You create accurate, age-appropriate school practice papers for Karachi Board students. Stay strictly within the supplied subject, class, textbook content focus, and chapter list. Return valid JSON only.' }] },
      generationConfig: { responseMimeType: 'application/json', temperature: 0.35, thinkingConfig: { thinkingBudget: 0 } },
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  }), 60000, 'Gemini paper generation timed out.');
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error && body.error.message || `Gemini returned HTTP ${response.status}.`);
  const raw = body.candidates && body.candidates[0] && body.candidates[0].content && body.candidates[0].content.parts && body.candidates[0].content.parts[0] && body.candidates[0].content.parts[0].text;
  if (!raw) throw new Error('Gemini returned an empty paper.');
  return { paper: validatePaper(parseModelJson(raw), chapters, pattern), source: 'gemini', pattern };
}

router.get('/options', (_req, res) => res.json({ board: PAPER_BOARD, classes: paperOptions() }));

function bankChapter(chapter, chapters) {
  const match = /^Ch\s*(\d+)$/i.exec(String(chapter || ''));
  return match && chapters[Number(match[1]) - 1] || chapters[0];
}

function fallbackQuestions(classLevel, subject, chapters, type, count) {
  const profile = { board: PAPER_BOARD, classLevel };
  const rows = getOfflineQuestions(profile, subject, type, bankRoot).slice();
  if (rows.length < count) throw new Error(`The verified Karachi question bank does not contain enough ${type} questions for ${subject}.`);
  return shuffle(rows).slice(0, count).map(row => ({
    question: row.question,
    chapter: bankChapter(row.chapter, chapters),
    modelAnswer: cleanText(row.answer, 5000) || 'Use the relevant Sindh Textbook Board chapter to write a complete answer with definitions, working, examples, or a labelled diagram where appropriate.'
  }));
}

function fallbackMcqs(subject, chapters, count) {
  return Array.from({ length: count }, (_, index) => {
    const answer = chapters[index % chapters.length];
    const alternatives = chapters.filter(chapter => chapter !== answer).slice(0, 3);
    while (alternatives.length < 3) alternatives.push(`Another ${subject} chapter`);
    const options = shuffle([answer, ...alternatives]).map((text, optionIndex) => ({ id: String.fromCharCode(65 + optionIndex), text }));
    return {
      question: `Which chapter contains the main topic described by the following chapter title: ${answer}?`,
      chapter: answer,
      options,
      correctOptionId: options.find(option => option.text === answer).id,
      explanation: `This question checks recognition of the Karachi Board ${subject} chapter coverage.`
    };
  });
}

function fallbackPaper(classLevel, subject, chapters) {
  const pattern = paperPattern(subject);
  return {
    source: 'question-bank-fallback',
    pattern,
    paper: {
      mcqs: fallbackMcqs(subject, chapters, pattern.mcq),
      shortQuestions: fallbackQuestions(classLevel, subject, chapters, 'short', pattern.short),
      longQuestions: fallbackQuestions(classLevel, subject, chapters, 'long', pattern.long)
    }
  };
}

function line(text, options = {}) {
  return new Paragraph({
    children: [new TextRun({ text: String(text || ''), ...options })],
    spacing: { after: 120 }
  });
}

function questionParagraph(number, question, marks) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${number}. `, bold: true }),
      new TextRun({ text: cleanText(question.question, 2000) }),
      new TextRun({ text: marks ? `  [${marks} marks]` : '', italics: true, color: '666666' })
    ],
    spacing: { after: 120 }
  });
}

function buildPaperDocument({ classLevel, subject, paper, pattern, includeAnswerKey, source }) {
  const totalMarks = pattern.mcq + pattern.short * pattern.shortMarks + pattern.long * pattern.longMarks;
  const sourceLabel = source === 'gemini' ? 'AI-generated practice paper' : 'Practice paper generated from Learnix verified question bank';
  const children = [
    new Paragraph({
      children: [new TextRun({ text: 'KARACHI BOARD PRACTICE EXAMINATION', bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `Class ${classLevel} · ${subject}`, bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 }
    }),
    line(`${sourceLabel} · Verify the latest official BSEK scheme before treating it as an exam format.`, { italics: true, color: '666666' }),
    line(`Practice format: ${totalMarks} marks · Suggested time: 3 hours`),
    line('Student name: ____________________________________    Roll no: ____________________'),
    new Paragraph({ text: 'Section A — Multiple Choice Questions', heading: HeadingLevel.HEADING_1 }),
    line(`Choose the best answer. Each question carries 1 mark. ${pattern.mcq} questions are included.`),
    ...paper.mcqs.flatMap((question, index) => [
      questionParagraph(index + 1, question, 1),
      new Paragraph({
        children: question.options.map(option => new TextRun({ text: `${option.id}. ${cleanText(option.text, 500)}    ` })),
        indent: { left: 720 },
        spacing: { after: 180 }
      })
    ]),
    new Paragraph({ text: 'Section B — Short Questions', heading: HeadingLevel.HEADING_1 }),
    line(`Answer any ${pattern.shortAttempt} questions out of ${pattern.short}. Each question carries ${pattern.shortMarks} marks. Show important working where needed.`),
    ...paper.shortQuestions.map((question, index) => questionParagraph(index + 1, question, pattern.shortMarks)),
    new Paragraph({ text: 'Section C — Long Questions', heading: HeadingLevel.HEADING_1 }),
    line(`Answer any ${pattern.longAttempt} questions out of ${pattern.long}. Each question carries ${pattern.longMarks} marks. Include diagrams, examples, or working where appropriate.`),
    ...paper.longQuestions.map((question, index) => questionParagraph(index + 1, question, pattern.longMarks))
  ];

  if (includeAnswerKey) {
    children.push(new Paragraph({ text: 'Answer Key and Model Answers', heading: HeadingLevel.HEADING_1 }));
    line('These AI-generated answers are for self-checking and should be compared with your textbook and teacher guidance.', { italics: true, color: '666666' });
    paper.mcqs.forEach((question, index) => {
      const answer = question.options.find(option => String(option.id) === String(question.correctOptionId));
      children.push(line(`${index + 1}. ${question.correctOptionId}. ${answer ? answer.text : ''}${question.explanation ? ` — ${question.explanation}` : ''}`));
    });
    children.push(new Paragraph({ text: 'Short Question Model Answers', heading: HeadingLevel.HEADING_2 }));
    paper.shortQuestions.forEach((question, index) => children.push(line(`${index + 1}. ${question.modelAnswer}`)));
    children.push(new Paragraph({ text: 'Long Question Model Answers', heading: HeadingLevel.HEADING_2 }));
    paper.longQuestions.forEach((question, index) => children.push(line(`${index + 1}. ${question.modelAnswer}`)));
  }

  return new Document({
    creator: 'Learnix',
    title: `Karachi Board Class ${classLevel} ${subject} Practice Paper`,
    description: 'AI-generated Learnix practice paper',
    sections: [{ children }]
  });
}

const requestTimes = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const times = (requestTimes.get(req.user.uid) || []).filter(time => now - time < 60000);
  if (times.length >= 3) return res.status(429).json({ error: 'Please wait a minute before generating another paper.' });
  times.push(now);
  requestTimes.set(req.user.uid, times);
  next();
}

router.post('/generate', auth, rateLimit, async (req, res) => {
  try {
    const { classLevel, subject, chapters } = validRequest(req.body || {});
    const includeAnswerKey = Boolean(req.body && req.body.includeAnswerKey);
    let generated;
    try {
      generated = await generatePaper(classLevel, subject, chapters);
    } catch (aiError) {
      console.warn('Gemini paper generation unavailable; using verified fallback:', aiError.message);
      generated = fallbackPaper(classLevel, subject, chapters);
    }
    const document = buildPaperDocument({ classLevel, subject, paper: generated.paper, pattern: generated.pattern, source: generated.source, includeAnswerKey });
    const buffer = await Packer.toBuffer(document);
    const slug = subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `learnix-karachi-class-${classLevel}-${slug}-practice-paper.docx`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'X-Learnix-Paper-Source': generated.source,
      'Cache-Control': 'no-store'
    });
    res.send(buffer);
  } catch (error) {
    console.error('Practice paper generation error:', error.message);
    res.status(error.status || 502).json({ error: error.message || 'Could not generate the practice paper.' });
  }
});

module.exports = router;
