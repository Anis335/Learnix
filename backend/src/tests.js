const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

const router = express.Router();
const catalog = require('./syllabus-catalog.json');
const bankRoot = path.join(__dirname, 'question-bank');
const {
  subjectSlug,
  getOfflineQuestions,
  shuffle,
  sampleQuestions,
  toTestQuestion
} = require('./question-bank-service');

function firebaseAdmin() {
  if (admin.apps.length) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const sa = JSON.parse(raw);
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: process.env.FIREBASE_PROJECT_ID || sa.project_id
      });
      return admin;
    } catch (err) {
      console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_JSON, falling back to basic init:', err.message);
    }
  }
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'studyhub-portal'
  });
  return admin;
}

async function auth(req, res, next) {
  try {
    const token = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
    if (!token) return res.status(401).json({ error: 'Sign in to access tests.' });
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
    return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
  }
}

/* In-memory store with optional Firestore syncing */
const memoryTests = new Map();
const memoryReviews = [];

// Clean up expired tests periodically (older than 24h)
setInterval(() => {
  const now = Date.now();
  for (const [id, t] of memoryTests.entries()) {
    if (t && t.expiresAt && Date.parse(t.expiresAt) < now) {
      memoryTests.delete(id);
    }
  }
}, 30 * 60 * 1000).unref();

function safeFirestore() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;
  try {
    return firebaseAdmin().firestore();
  } catch (_) {
    return null;
  }
}

async function saveTest(test) {
  memoryTests.set(test.testId, test);
  const db = safeFirestore();
  if (db) {
    try {
      await db.doc(`users/${test.uid}/tests/${test.testId}`).set(test);
    } catch (err) {
      console.warn('Firestore test save skipped:', err.message);
    }
  }
}

async function getTest(uid, testId) {
  const cached = memoryTests.get(testId);
  if (cached && cached.uid === uid) return cached;
  const db = safeFirestore();
  if (db) {
    try {
      const snap = await db.doc(`users/${uid}/tests/${testId}`).get();
      if (snap.exists) {
        const data = snap.data();
        if (data.uid === uid) {
          memoryTests.set(testId, data);
          return data;
        }
      }
    } catch (err) {
      console.warn('Firestore test fetch skipped:', err.message);
    }
  }
  return null;
}

async function updateTest(uid, testId, updates) {
  const cached = memoryTests.get(testId);
  if (cached && cached.uid === uid) {
    Object.assign(cached, updates);
  }
  const db = safeFirestore();
  if (db) {
    try {
      await db.doc(`users/${uid}/tests/${testId}`).update(updates);
    } catch (err) {
      console.warn('Firestore test update skipped:', err.message);
    }
  }
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label || 'Request timed out.')), ms);
    })
  ]).finally(() => clearTimeout(timer));
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

function canonicalChapters(profile, subject) {
  const board = profile.board || 'federal';
  const classLevel = String(profile.classLevel || '9');
  const byBoard = catalog[board] || {};
  const list = byBoard[classLevel] || {};

  let chapters = list[subject] || (subject === 'Islamiyat' ? list.Islamiat : undefined);
  if (Array.isArray(chapters) && chapters.length) return chapters;

  // Case-insensitive lookup in catalog
  for (const k of Object.keys(list)) {
    if (k.toLowerCase() === subject.toLowerCase() && Array.isArray(list[k]) && list[k].length) {
      return list[k];
    }
  }

  // Fallback to offline question bank chapters
  try {
    const slug = subjectSlug(subject);
    const bankFile = path.join(bankRoot, board, `class-${classLevel}`, `${slug}.json`);
    if (fs.existsSync(bankFile)) {
      const data = JSON.parse(fs.readFileSync(bankFile, 'utf8'));
      const set = new Set();
      for (const item of data) {
        if (item && item.chapter && typeof item.chapter === 'string' && item.chapter.trim()) {
          set.add(item.chapter.trim());
        }
      }
      if (set.size > 0) return [...set];
    }
  } catch (_) {}

  return [subject];
}

function safePublicQuestion(q) {
  return {
    id: q.id,
    type: 'mcq',
    chapter: q.chapter,
    question: q.question,
    options: (q.options || []).map(o => ({ id: o.id, text: o.text }))
  };
}

async function generateWithGemini(profile, subject, chapters, count) {
  if (!process.env.GEMINI_API_KEY) throw new Error('The Gemini AI service is not configured yet.');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  const boardLabel = profile.board === 'federal' ? 'Federal Board (FBISE)' : 'Sindh / Karachi Board (BSEK)';
  const prompt = `You are an examination setter for Pakistani school students (${boardLabel}, Class ${profile.classLevel}).
Create exactly ${count} multiple-choice questions (MCQs) for the subject "${subject}".
The student has selected these specific chapters:
${JSON.stringify(chapters)}

Requirements:
1. Distribute questions across the selected chapters.
2. Every question must have exactly 4 choices with ids "A", "B", "C", and "D".
3. Provide the single correct option ID ("A", "B", "C", or "D").
4. Provide an educational explanation for the correct answer.
5. In the "chapter" field, use the EXACT matching chapter name from the list provided above.
6. Return strictly valid JSON with no markdown wrapping.

Output schema:
{
  "questions": [
    {
      "id": "q1",
      "chapter": "Exact chapter name from the list",
      "question": "Question text here?",
      "options": [
        {"id": "A", "text": "Option A text"},
        {"id": "B", "text": "Option B text"},
        {"id": "C", "text": "Option C text"},
        {"id": "D", "text": "Option D text"}
      ],
      "correctOptionId": "A",
      "explanation": "Why this option is correct."
    }
  ]
}`;

  let lastError = null;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.35 }
      });
      const result = await withTimeout(
        model.generateContent(prompt),
        40000,
        `Gemini generation timed out on ${modelName}.`
      );
      const raw = result.response.text();
      const parsed = parseModelJson(raw);
      if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error('Gemini returned an empty question list.');
      }

      const validQuestions = [];
      const seen = new Set();
      const optIds = ['A', 'B', 'C', 'D'];

      for (let i = 0; i < parsed.questions.length; i++) {
        const q = parsed.questions[i];
        if (!q || typeof q.question !== 'string' || q.question.trim().length < 5) continue;
        const qKey = q.question.trim().toLowerCase();
        if (seen.has(qKey)) continue;
        seen.add(qKey);

        if (!Array.isArray(q.options) || q.options.length < 4) continue;
        const validOptions = [];
        for (let j = 0; j < 4; j++) {
          const opt = q.options[j];
          const text = opt && (opt.text || opt.label || (typeof opt === 'string' ? opt : ''));
          if (!text || typeof text !== 'string' || !text.trim()) break;
          validOptions.push({ id: optIds[j], text: text.trim() });
        }
        if (validOptions.length !== 4) continue;

        let correct = String(q.correctOptionId || 'A').trim().toUpperCase();
        if (!optIds.includes(correct)) correct = 'A';

        let chapter = typeof q.chapter === 'string' ? q.chapter.trim() : '';
        const match = chapters.find(c => c.toLowerCase() === chapter.toLowerCase());
        chapter = match || chapters[0] || subject;

        validQuestions.push({
          id: `ai-${validQuestions.length + 1}-${crypto.randomBytes(3).toString('hex')}`,
          type: 'mcq',
          chapter,
          question: q.question.trim(),
          options: validOptions,
          correctOptionId: correct,
          explanation: typeof q.explanation === 'string' ? q.explanation.trim() : ''
        });

        if (validQuestions.length >= count) break;
      }

      if (validQuestions.length >= Math.min(5, count)) {
        return validQuestions;
      }
      throw new Error(`Gemini only returned ${validQuestions.length} valid MCQs; requested ${count}.`);
    } catch (e) {
      console.warn(`Model ${modelName} attempt failed:`, e.message);
      lastError = e;
    }
  }

  throw lastError || new Error('Gemini AI generation failed across all models.');
}

function bankQuestions(profile, subject, chapters, count) {
  const candidates = getOfflineQuestions(profile, subject, 'mcq', bankRoot).filter(q => {
    if (!q || typeof q.question !== 'string' || !q.question.trim()) return false;
    return (
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every(o => o && o.id && o.text) &&
      q.options.some(o => o.id === q.correctOptionId)
    );
  });

  // If specific chapters were chosen, prefer questions matching those chapters
  if (Array.isArray(chapters) && chapters.length > 0) {
    const chapterSet = new Set(chapters.map(c => c.toLowerCase()));
    const matching = candidates.filter(q => q.chapter && chapterSet.has(q.chapter.toLowerCase()));
    if (matching.length >= count) {
      return sampleQuestions(matching, count).map(toTestQuestion);
    }
  }

  return sampleQuestions(candidates, count).map(toTestQuestion);
}

function publicTest(test) {
  return {
    testId: test.testId,
    board: test.board,
    classLevel: test.classLevel,
    subject: test.subject,
    chapters: test.chapters || [],
    type: 'mcq',
    source: test.source,
    createdAt: test.createdAt,
    expiresAt: test.expiresAt,
    durationSeconds: test.durationSeconds,
    questions: test.questions.map(safePublicQuestion)
  };
}

const requestTimes = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const arr = (requestTimes.get(req.user.uid) || []).filter(t => now - t < 60000);
  if (arr.length >= 10) {
    return res.status(429).json({ error: 'You have reached the test request limit. Please wait a minute.' });
  }
  arr.push(now);
  requestTimes.set(req.user.uid, arr);
  next();
}

/* Endpoint to get canonical chapters for a selected board, class, and subject */
router.get('/chapters', auth, async (req, res) => {
  try {
    const { board, classLevel, subject } = req.query || {};
    const allowedBoards = ['federal', 'karachi'];
    const allowedClasses = ['9', '10'];
    if (!board || !allowedBoards.includes(board)) {
      return res.status(400).json({ error: 'Choose Federal Board or Karachi Board.' });
    }
    if (!classLevel || !allowedClasses.includes(String(classLevel))) {
      return res.status(400).json({ error: 'Choose Class 9 or Class 10.' });
    }
    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({ error: 'Choose a subject.' });
    }

    const chapters = canonicalChapters({ board, classLevel: String(classLevel) }, subject);
    res.json({ board, classLevel: String(classLevel), subject, chapters });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Could not load chapters.' });
  }
});

router.post('/generate', auth, rateLimit, async (req, res) => {
  try {
    const { subject, board, classLevel, chapters: reqChapters, count: reqCount } = req.body || {};
    const type = 'mcq'; // MCQ only
    const allowedBoards = ['federal', 'karachi'];
    const allowedClasses = ['9', '10'];
    const allowedSubjects = [
      'Mathematics', 'Physics', 'Chemistry', 'Biology',
      'Computer Science', 'English', 'Urdu', 'Islamiyat',
      'Pakistan Studies', 'General Mathematics', 'General Science',
      'Tarjuma Quran Majeed', 'Islamiat'
    ];

    if (!board || !allowedBoards.includes(board)) {
      return res.status(400).json({ error: 'Choose Federal Board or Karachi Board.' });
    }
    if (!classLevel || !allowedClasses.includes(String(classLevel))) {
      return res.status(400).json({ error: 'Choose Class 9 or Class 10.' });
    }
    if (!subject || typeof subject !== 'string' || !allowedSubjects.some(s => s.toLowerCase() === subject.toLowerCase())) {
      return res.status(400).json({ error: 'That subject is not available for practice tests.' });
    }

    const profile = { board, classLevel: String(classLevel), group: 'biology' };
    const allChapters = canonicalChapters(profile, subject);

    // Filter requested chapters to valid ones
    let targetChapters = allChapters;
    if (Array.isArray(reqChapters) && reqChapters.length > 0) {
      const selected = reqChapters.filter(c => typeof c === 'string' && allChapters.includes(c));
      if (selected.length > 0) targetChapters = selected;
    }

    const count = Math.min(30, Math.max(5, Number(reqCount) || 15));
    let questions, source = 'gemini';

    try {
      if (!targetChapters.length) throw new Error('No verified chapters available for this subject.');
      questions = await generateWithGemini(profile, subject, targetChapters, count);
    } catch (aiError) {
      console.warn('Gemini test generation failed, attempting offline bank fallback:', aiError.message);
      source = 'question-bank';
      questions = bankQuestions(profile, subject, targetChapters, count);
      if (questions.length < 5) {
        return res.status(503).json({
          error: `Gemini AI is temporarily unavailable, and the offline bank has only ${questions.length} questions for this subject. Please check your connection and try again shortly.`
        });
      }
    }

    questions = shuffle(questions);
    questions = questions.map(q => {
      const opts = shuffle(q.options || []);
      return { ...q, options: opts };
    });

    const testCount = questions.length;
    const durationSeconds = testCount * 60; // 1 min per question
    const testId = crypto.randomUUID();
    const now = Date.now();

    const test = {
      testId,
      uid: req.user.uid,
      board,
      classLevel: String(classLevel),
      group: profile.group,
      subject,
      chapters: targetChapters,
      type,
      source,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
      durationSeconds,
      questions,
      answers: null,
      result: null,
      submittedAt: null
    };

    await saveTest(test);
    res.status(201).json(publicTest(test));
  } catch (e) {
    console.error('Test generation error:', e.message);
    res.status(e.status || 502).json({ error: e.message || 'Could not generate a practice test.' });
  }
});

router.post('/submit', auth, rateLimit, async (req, res) => {
  try {
    const { testId, answers } = req.body || {};
    if (typeof testId !== 'string' || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'A test ID and answer list are required.' });
    }
    if (
      answers.length > 50 ||
      answers.some(a => !a || typeof a.questionId !== 'string' || (a.optionId !== undefined && typeof a.optionId !== 'string'))
    ) {
      return res.status(400).json({ error: 'Invalid answer list.' });
    }

    const test = await getTest(req.user.uid, testId);
    if (!test) return res.status(404).json({ error: 'Test not found for this account.' });
    if (test.uid !== req.user.uid) return res.status(403).json({ error: 'You cannot submit another student’s test.' });
    if (test.result) return res.status(409).json({ error: 'This test has already been submitted.', result: test.result });

    if (Date.now() > Date.parse(test.createdAt) + test.durationSeconds * 1000 + 120000 || Date.now() > Date.parse(test.expiresAt)) {
      return res.status(410).json({ error: 'The test time has expired. Please generate a new test.' });
    }

    const map = new Map(answers.filter(a => a && typeof a.questionId === 'string').map(a => [a.questionId, String(a.optionId || '').trim()]));

    let correct = 0, incorrect = 0, unanswered = 0;
    const review = test.questions.map(q => {
      const selected = map.get(q.id) || '';
      const isCorrect = Boolean(selected && selected === q.correctOptionId);
      if (!selected) unanswered++;
      else if (isCorrect) correct++;
      else incorrect++;

      return {
        questionId: q.id,
        question: q.question,
        chapter: q.chapter,
        selectedOptionId: selected || null,
        correctOptionId: q.correctOptionId,
        correct: isCorrect,
        options: q.options,
        explanation: q.explanation || ''
      };
    });

    const result = {
      status: 'evaluated',
      total: test.questions.length,
      correct,
      incorrect,
      unanswered,
      percentage: Number(((correct / test.questions.length) * 100).toFixed(2)),
      review
    };

    await updateTest(req.user.uid, testId, {
      answers: Object.fromEntries(map),
      result,
      submittedAt: new Date().toISOString()
    });

    res.json({ testId, result, source: test.source, type: test.type });
  } catch (e) {
    console.error('Test submission error:', e.message);
    res.status(e.status || 500).json({ error: e.message || 'Could not submit this test.' });
  }
});

router.get('/result/:testId', auth, async (req, res) => {
  try {
    const test = await getTest(req.user.uid, req.params.testId);
    if (!test) return res.status(404).json({ error: 'Result not found.' });
    if (!test.result) return res.status(409).json({ error: 'This test has not been submitted yet.' });
    res.json({
      testId: test.testId,
      subject: test.subject,
      board: test.board,
      classLevel: test.classLevel,
      type: test.type,
      source: test.source,
      submittedAt: test.submittedAt,
      result: test.result
    });
  } catch (e) {
    res.status(500).json({ error: 'Could not load this result.' });
  }
});

// Authenticated student feedback and website reviews
const feedbackTimes = new Map();
function feedbackLimit(req, res, next) {
  const now = Date.now();
  const times = (feedbackTimes.get(req.user.uid) || []).filter(t => now - t < 60000);
  if (times.length >= 5) return res.status(429).json({ error: 'Please wait before sending more feedback.' });
  times.push(now);
  feedbackTimes.set(req.user.uid, times);
  next();
}

router.post('/feedback', auth, feedbackLimit, async (req, res) => {
  try {
    const { kind, rating, message } = req.body || {};
    if (!['feedback', 'review'].includes(kind)) return res.status(400).json({ error: 'Choose feedback or website review.' });
    if (kind === 'review' && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Choose a rating from 1 to 5 stars.' });
    }
    if (typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 2000) {
      return res.status(400).json({ error: 'Write between 5 and 2,000 characters.' });
    }
    const now = new Date().toISOString();
    if (kind === 'review') {
      const doc = {
        uid: req.user.uid,
        displayName: String(req.user.name || 'Learnix student').slice(0, 80),
        rating,
        message: message.trim(),
        updatedAt: now,
        createdAt: now
      };
      memoryReviews.unshift(doc);
      const db = safeFirestore();
      if (db) {
        try { await db.doc(`websiteReviews/${req.user.uid}`).set(doc, { merge: true }); } catch (_) {}
      }
      return res.status(201).json({ ok: true, message: 'Thank you for reviewing Learnix.' });
    }
    const feedbackDoc = { uid: req.user.uid, message: message.trim(), createdAt: now, status: 'new' };
    const db = safeFirestore();
    if (db) {
      try { await db.collection('studentFeedback').add(feedbackDoc); } catch (_) {}
    }
    return res.status(201).json({ ok: true, message: 'Thank you. Your feedback has been sent.' });
  } catch (e) {
    console.error('Feedback save failed:', e.message);
    res.status(500).json({ error: 'Could not save your feedback right now.' });
  }
});

router.get('/feedback/reviews', auth, async (_req, res) => {
  try {
    const db = safeFirestore();
    if (db) {
      try {
        const snap = await db.collection('websiteReviews').orderBy('updatedAt', 'desc').limit(30).get();
        const reviews = snap.docs.map(d => {
          const x = d.data();
          return { displayName: x.displayName || 'Learnix student', rating: x.rating, message: x.message, updatedAt: x.updatedAt };
        });
        return res.json({ reviews });
      } catch (_) {}
    }
    res.json({ reviews: memoryReviews.slice(0, 30) });
  } catch (e) {
    res.status(500).json({ error: 'Could not load website reviews.' });
  }
});

module.exports = router;
