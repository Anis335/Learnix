
const express = require('express');
const crypto = require('node:crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
const router = express.Router();
const catalog = require('./syllabus-catalog.json');
const path = require('node:path');
const bankRoot = path.join(__dirname, 'question-bank');
const {subjectSlug,getOfflineQuestions,shuffle,sampleQuestions,toTestQuestion}=require('./question-bank-service');

function firebaseAdmin() {
  if (admin.apps.length) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const sa = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(sa), projectId: process.env.FIREBASE_PROJECT_ID || sa.project_id });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID || 'studyhub-portal' });
  }
  return admin;
}
async function auth(req,res,next) {
  try {
    const token = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
    if (!token) return res.status(401).json({error:'Sign in to access tests.'});
    req.user = await firebaseAdmin().auth().verifyIdToken(token[1]);
    next();
  } catch (_) { return res.status(401).json({error:'Your session is invalid or expired. Please sign in again.'}); }
}
function firestore(){ return firebaseAdmin().firestore(); }
function selectedSubjects(profile) {
  let names = profile.group === 'humanities'
    ? ['General Mathematics','Urdu','English','General Science']
    : ['Mathematics','Urdu','English','Physics','Chemistry',profile.group === 'biology' ? 'Biology' : 'Computer Science'];
  // The uploaded source banks cover these subjects in each board/class. The
  // saved profile's subject list below remains the final authorization filter.
  names.push('Islamiyat','Pakistan Studies');
  if (profile.board === 'federal') names.push('Tarjuma Quran Majeed');
  names = names.map(n => n === 'Islamiat' ? 'Islamiyat' : n);
  return [...new Set(names)];
}
async function getProfile(uid) {
  const ref = firestore().doc(`users/${uid}/private/appState`);
  const snap = await ref.get();
  if (!snap.exists) throw Object.assign(new Error('Complete your study setup before starting a test.'),{status:400});
  const state = snap.data().state || {};
  const p = state.onboarding || {};
  if (!['federal','karachi'].includes(p.board) || !['9','10'].includes(String(p.classLevel)) || !['biology','computer','humanities'].includes(p.group)) {
    throw Object.assign(new Error('Your board, class, or study group is not configured for tests.'),{status:400});
  }
  return { profile:{board:p.board,classLevel:String(p.classLevel),group:p.group}, state };
}
function canonicalChapters(profile, subject) {
  const byBoard = catalog[profile.board] || {};
  const list = byBoard[profile.classLevel] || {};
  const chapters = list[subject] || (subject === 'Islamiyat' ? list.Islamiat : undefined);
  return Array.isArray(chapters) ? chapters : [];
}
function validateSubject(profile,state,subject) {
  if (typeof subject !== 'string' || !selectedSubjects(profile).includes(subject) ||
      !(state.subjects || []).some(s => s && (s.name === subject || subjectSlug(s.name) === subjectSlug(subject)))) {
    throw Object.assign(new Error('That subject is not part of your saved study profile.'),{status:400});
  }
  return canonicalChapters(profile, subject);
}
function withTimeout(promise,ms,label) {
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label||'Request timed out.')),ms);})]).finally(()=>clearTimeout(timer));
}

function safePublicQuestion(q) {
  const out={id:q.id,type:q.type,chapter:q.chapter,question:q.question};
  if(q.options) out.options=q.options.map(o=>({id:o.id,text:o.text}));
  return out;
}
function validateQuestion(q,type,chapters) {
  if(!q || typeof q.question!=='string' || q.question.trim().length<8 ||
     typeof q.chapter!=='string' || !chapters.includes(q.chapter) ||
     !['mcq','short','long'].includes(type)) return false;
  if(type==='mcq') {
    return Array.isArray(q.options) && q.options.length===4 &&
      new Set(q.options.map(o=>o.id)).size===4 &&
      q.options.every(o=>typeof o.id==='string' && typeof o.text==='string' && o.text.trim()) &&
      q.options.some(o=>o.id===q.correctOptionId);
  }
  return typeof (q.modelAnswer || q.markingGuidelines)==='string' &&
    String(q.modelAnswer || q.markingGuidelines).trim().length>=15;
}
function bankQuestions(profile,subject,type,chapters,count) {
  const candidates=getOfflineQuestions(profile,subject,type,bankRoot).filter(q => {
    if (!q || typeof q.question !== 'string' || !q.question.trim()) return false;
    if (type === 'mcq') return Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => o && o.id && o.text) && q.options.some(o => o.id === q.correctOptionId);
    return q.type === type;
  });
  return sampleQuestions(candidates,count).map(toTestQuestion);
}
function geminiModel() {
  if(!process.env.GEMINI_API_KEY) return null;
  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return ai.getGenerativeModel({
    model:process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    generationConfig:{responseMimeType:'application/json',temperature:0.35},
    systemInstruction:'You create accurate school assessment questions for Pakistani board students. Stay strictly within the supplied board, class, subject and chapter names. Never introduce facts or topics outside those chapters. Return valid JSON only.'
  });
}
async function generateWithGemini(profile,subject,type,chapters,count) {
  const model=geminiModel();
  if(!model) throw new Error('Gemini is not configured.');
  const format = type==='mcq'
    ? 'Each question: {"id":"q1","chapter":"EXACT chapter name","question":"...","options":[{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],"correctOptionId":"A","explanation":"..."}'
    : 'Each question: {"id":"q1","chapter":"EXACT chapter name","question":"...","modelAnswer":"...","markingGuidelines":"..."}';
  const prompt=`Create exactly ${count} ${type.toUpperCase()} questions for an assessment.\nBoard: ${profile.board==='federal'?'Federal Board (FBISE)':'Sindh / Karachi Board (BSEK)'}\nClass: ${profile.classLevel}\nStudy group: ${profile.group}\nSubject: ${subject}\nAllowed chapters (use only exact names from this list): ${JSON.stringify(chapters)}\nOutput schema: {"questions":[${format}]}\nFor MCQs, use four plausible options and exactly one correctOptionId. For short questions, keep scope suitable for a concise answer. For long questions, require a structured explanatory answer. Never invent chapter names.`;
  const result=await withTimeout(model.generateContent(prompt),25000,'Gemini generation timed out.');
  const raw=result.response.text();
  const parsed=JSON.parse(raw);
  if(!parsed || !Array.isArray(parsed.questions) || parsed.questions.length!==count) throw new Error('Gemini returned an incomplete question set.');
  const seen=new Set();
  const questions=parsed.questions.map((q,i)=>({...q,id:`ai-${i+1}-${crypto.randomBytes(3).toString('hex')}`,type}));
  if(questions.some(q=>!validateQuestion(q,type,chapters))) throw new Error('Gemini returned questions that failed validation.');
  for(const q of questions){if(seen.has(q.question.trim()))throw new Error('Gemini returned duplicate questions.');seen.add(q.question.trim());}
  return questions;
}
function publicTest(test) {
  return {testId:test.testId,board:test.board,classLevel:test.classLevel,subject:test.subject,type:test.type,source:test.source,
    createdAt:test.createdAt,expiresAt:test.expiresAt,durationSeconds:test.durationSeconds,questions:test.questions.map(safePublicQuestion)};
}
const requestTimes=new Map();
function rateLimit(req,res,next){
  const now=Date.now(),arr=(requestTimes.get(req.user.uid)||[]).filter(t=>now-t<60000);
  if(arr.length>=8)return res.status(429).json({error:'You have reached the test request limit. Please wait a minute.'});
  arr.push(now);requestTimes.set(req.user.uid,arr);next();
}
router.get('/subjects',auth,async(req,res)=>{
  try{
    const {profile,state}=await getProfile(req.user.uid);
    const savedNames=(state.subjects||[]).filter(s=>s&&typeof s.name==='string').map(s=>subjectSlug(s.name));const subjects=selectedSubjects(profile).filter(name=>savedNames.includes(subjectSlug(name))).map(name=>{const chapters=canonicalChapters(profile,name);const shortCount=offlineQuestions(profile,name,'short').length;const longCount=offlineQuestions(profile,name,'long').length;const mcqCount=offlineQuestions(profile,name,'mcq').length;return {name,available:chapters.length>0||shortCount>0||longCount>0,chapterCount:chapters.length,offlineShortCount:shortCount,offlineLongCount:longCount,offlineMcqCount:mcqCount};});
    res.json({board:profile.board,classLevel:profile.classLevel,group:profile.group,mcqAvailable:profile.board==='federal'&&profile.classLevel==='9',subjects});
  }catch(e){res.status(e.status||500).json({error:e.message||'Could not load test subjects.'});}
});
router.post('/generate',auth,rateLimit,async(req,res)=>{
  try{
    const {subject,type,board,classLevel}=req.body||{};
    // Validate inputs
    if(!['mcq','short','long'].includes(type))return res.status(400).json({error:'Choose MCQ, short-question, or long-question test.'});
    const allowedBoards=['federal','karachi'];
    const allowedClasses=['9','10'];
    const allowedSubjects=['Mathematics','Physics','Chemistry','Biology','Computer Science','English','Urdu','Islamiyat','Pakistan Studies','General Mathematics','General Science','Tarjuma Quran Majeed','Islamiat'];
    if(!board||!allowedBoards.includes(board))return res.status(400).json({error:'Choose Federal Board or Karachi Board.'});
    if(!classLevel||!allowedClasses.includes(String(classLevel)))return res.status(400).json({error:'Choose Class 9 or Class 10.'});
    if(!subject||typeof subject!=='string'||!allowedSubjects.some(s=>s.toLowerCase()===subject.toLowerCase()))return res.status(400).json({error:'That subject is not available for MCQ tests.'});
    // Build a minimal profile object for chapter/bank lookups
    const profile={board,classLevel:String(classLevel),group:'biology'};
    // Look up chapters from catalog
    const chapters=canonicalChapters(profile,subject);
    const count=type==='mcq'?30:type==='short'?10:5;
    let questions,source='gemini';
    try{
      if(!chapters.length)throw new Error('No verified chapter list is available for this subject.');
      questions=await generateWithGemini(profile,subject,type,chapters,count);
    }catch(aiError){
      source='question-bank';
      questions=bankQuestions(profile,subject,type,chapters,count);
      if(questions.length<count){
        return res.status(503).json({error:`Gemini is unavailable and the offline question bank has only ${questions.length} suitable ${type} questions for ${subject}. Please try again later.`,fallbackAvailable:questions.length});
      }
    }
    questions=shuffle(questions);
    if(type==='mcq') questions=questions.map(q=>{const opts=shuffle(q.options);return {...q,options:opts};});
    const testId=crypto.randomUUID(),now=Date.now(),durationSeconds=type==='mcq'?30*60:type==='short'?25*60:45*60;
    const test={testId,uid:req.user.uid,board,classLevel:String(classLevel),group:profile.group,subject,type,source,
      createdAt:new Date(now).toISOString(),expiresAt:new Date(now+4*60*60*1000).toISOString(),durationSeconds,
      questions,answers:null,result:null,submittedAt:null};
    await firestore().doc(`users/${req.user.uid}/tests/${testId}`).create(test);
    res.status(201).json(publicTest(test));
  }catch(e){console.error('Test generation error:',e.message);res.status(e.status||502).json({error:e.message||'Could not generate a test.'});}
});
router.post('/submit',auth,rateLimit,async(req,res)=>{
  try{
    const {testId,answers}=req.body||{};
    if(typeof testId!=='string'||!Array.isArray(answers))return res.status(400).json({error:'A test ID and answer list are required.'});
    if(answers.length>30 || answers.some(a=>!a || typeof a.questionId!=='string' || (a.optionId!==undefined && typeof a.optionId!=='string') || (a.text!==undefined && typeof a.text!=='string')))return res.status(400).json({error:'Invalid answer list.'});
    const ref=firestore().doc(`users/${req.user.uid}/tests/${testId}`),snap=await ref.get();
    if(!snap.exists)return res.status(404).json({error:'Test not found for this account.'});
    const test=snap.data();
    if(test.uid!==req.user.uid)return res.status(403).json({error:'You cannot submit another student’s test.'});
    if(test.result)return res.status(409).json({error:'This test has already been submitted.',result:test.result});
    if(Date.now()>Date.parse(test.createdAt)+test.durationSeconds*1000+120000 || Date.now()>Date.parse(test.expiresAt))return res.status(410).json({error:'The test time has expired. Generate a new test.'});
    const map=new Map(answers.filter(a=>a&&typeof a.questionId==='string').map(a=>[a.questionId,String(a.optionId||a.text||'').slice(0,8000)]));
    let result;
    if(test.type==='mcq'){
      let correct=0,incorrect=0,unanswered=0;
      const review=test.questions.map(q=>{
        const selected=map.get(q.id)||'';
        const isCorrect=!!selected&&selected===q.correctOptionId;
        if(!selected)unanswered++;else if(isCorrect)correct++;else incorrect++;
        return {questionId:q.id,question:q.question,chapter:q.chapter,selectedOptionId:selected||null,correctOptionId:q.correctOptionId,correct:isCorrect,options:q.options,explanation:q.explanation||''};
      });
      result={status:'evaluated',total:test.questions.length,correct,incorrect,unanswered,percentage:Number((correct/test.questions.length*100).toFixed(2)),review};
    }else if(test.source==='question-bank'){
      result={status:'answer-key',total:test.questions.length,answered:test.questions.filter(q=>map.has(q.id)&&map.get(q.id).trim()).length,
        review:test.questions.map(q=>({questionId:q.id,question:q.question,chapter:q.chapter,studentAnswer:map.get(q.id)||'',modelAnswer:q.modelAnswer||'',markingGuidelines:q.markingGuidelines||''}))};
    }else{
      try{
        const model=geminiModel();if(!model)throw new Error('Gemini unavailable');
        const payload=test.questions.map(q=>({id:q.id,question:q.question,chapter:q.chapter,modelAnswer:q.modelAnswer||'',studentAnswer:map.get(q.id)||''}));
        const prompt=`Evaluate these ${test.type} answers for a ${test.board} board class ${test.classLevel} ${test.subject} test. Score each answer fairly using the model answer and board-appropriate marking. Give marksAwarded, maxMarks, feedback, and a short improvement tip. Return JSON only: {"items":[{"id":"...","marksAwarded":0,"maxMarks":2,"feedback":"...","improvementTip":"..."}]}. Data: ${JSON.stringify(payload)}`;
        const generated=await withTimeout(model.generateContent(prompt),25000,'Gemini evaluation timed out.'),parsed=JSON.parse(generated.response.text());
        if(!Array.isArray(parsed.items)||parsed.items.length!==test.questions.length)throw new Error('Invalid grading response');
        const items=parsed.items.map((x,i)=>({questionId:test.questions[i].id,question:test.questions[i].question,chapter:test.questions[i].chapter,studentAnswer:map.get(test.questions[i].id)||'',marksAwarded:Math.min(Math.max(1,Number(x.maxMarks)||2),Math.max(0,Number(x.marksAwarded)||0)),maxMarks:Math.max(1,Number(x.maxMarks)||2),feedback:String(x.feedback||''),improvementTip:String(x.improvementTip||'')}));
        const awarded=items.reduce((a,x)=>a+x.marksAwarded,0),maximum=items.reduce((a,x)=>a+x.maxMarks,0);
        result={status:'evaluated-by-ai',total:test.questions.length,marksAwarded:awarded,maxMarks:maximum,percentage:Number((awarded/maximum*100).toFixed(2)),review:items};
      }catch(_){
        result={status:'evaluation-unavailable',total:test.questions.length,review:test.questions.map(q=>({questionId:q.id,question:q.question,chapter:q.chapter,studentAnswer:map.get(q.id)||'',modelAnswer:q.modelAnswer||'',markingGuidelines:q.markingGuidelines||''}))};
      }
    }
    await ref.update({answers:Object.fromEntries(map),result,submittedAt:new Date().toISOString()});
    res.json({testId,result,source:test.source,type:test.type});
  }catch(e){console.error('Test submission error:',e.message);res.status(e.status||500).json({error:e.message||'Could not submit this test.'});}
});
router.get('/result/:testId',auth,async(req,res)=>{
  try{
    const snap=await firestore().doc(`users/${req.user.uid}/tests/${req.params.testId}`).get();
    if(!snap.exists)return res.status(404).json({error:'Result not found.'});
    const test=snap.data();if(!test.result)return res.status(409).json({error:'This test has not been submitted yet.'});
    res.json({testId:test.testId,subject:test.subject,board:test.board,classLevel:test.classLevel,type:test.type,source:test.source,submittedAt:test.submittedAt,result:test.result});
  }catch(e){res.status(500).json({error:'Could not load this result.'});}
});
// Authenticated student feedback and website reviews. All writes use Admin SDK;
// clients cannot write directly to these collections.
const feedbackTimes=new Map();
function feedbackLimit(req,res,next){const now=Date.now(),times=(feedbackTimes.get(req.user.uid)||[]).filter(t=>now-t<60000);if(times.length>=5)return res.status(429).json({error:'Please wait before sending more feedback.'});times.push(now);feedbackTimes.set(req.user.uid,times);next();}
router.post('/feedback',auth,feedbackLimit,async(req,res)=>{
  try{
    const {kind,rating,message}=req.body||{};
    if(!['feedback','review'].includes(kind))return res.status(400).json({error:'Choose feedback or website review.'});
    if(kind==='review' && (!Number.isInteger(rating)||rating<1||rating>5))return res.status(400).json({error:'Choose a rating from 1 to 5 stars.'});
    if(typeof message!=='string'||message.trim().length<5||message.trim().length>2000)return res.status(400).json({error:'Write between 5 and 2,000 characters.'});
    const now=new Date().toISOString();
    if(kind==='review'){
      const doc={uid:req.user.uid,displayName:String(req.user.name||'Learnix student').slice(0,80),rating,message:message.trim(),updatedAt:now,createdAt:now};
      await firestore().doc(`websiteReviews/${req.user.uid}`).set(doc,{merge:true});
      return res.status(201).json({ok:true,message:'Thank you for reviewing Learnix.'});
    }
    await firestore().collection('studentFeedback').add({uid:req.user.uid,message:message.trim(),createdAt:now,status:'new'});
    return res.status(201).json({ok:true,message:'Thank you. Your feedback has been sent.'});
  }catch(e){console.error('Feedback save failed:',e.message);res.status(500).json({error:'Could not save your feedback right now.'});}
});
router.get('/feedback/reviews',auth,async(_req,res)=>{
  try{
    const snap=await firestore().collection('websiteReviews').orderBy('updatedAt','desc').limit(30).get();
    const reviews=snap.docs.map(d=>{const x=d.data();return {displayName:x.displayName||'Learnix student',rating:x.rating,message:x.message,updatedAt:x.updatedAt};});
    res.json({reviews});
  }catch(e){res.status(500).json({error:'Could not load website reviews.'});}
});
module.exports=router;
