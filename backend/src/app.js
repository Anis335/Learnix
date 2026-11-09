const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
function initFirebaseAdmin() {
  if (admin.apps.length) return admin.auth();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const sa = JSON.parse(raw);
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: process.env.FIREBASE_PROJECT_ID || sa.project_id
      });
      return admin.auth();
    } catch (_) {}
  }
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'studyhub-portal'
  });
  return admin.auth();
}
const app=express(); app.disable('x-powered-by'); app.use(express.json({limit:'25mb'}));
const allowed=(process.env.ALLOWED_ORIGINS||'https://learnix.netlify.app,http://localhost:8888,http://localhost:3000').split(',').map(x=>x.trim().replace(/\/+$/, ''));
app.use((req,res,next)=>{const o=req.headers.origin?req.headers.origin.replace(/\/+$/, ''):'';if(o&&(allowed.includes(o)||/^https:\/\/[a-z0-9-]+--learnix\.netlify\.app$/i.test(o))){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');if(req.method==='OPTIONS')return res.sendStatus(204);next();});
app.use('/api/tests', require('./tests'));
app.use('/api/papers', require('./papers'));
async function requireAuth(req,res,next){
  try{
    const m=/^Bearer\s+(.+)$/i.exec(req.headers.authorization||'');
    if(!m)return res.status(401).json({error:'Sign in with Google to use Learnix AI.'});
    try {
      req.user=await initFirebaseAdmin().verifyIdToken(m[1]);
      return next();
    } catch (verifyErr) {
      const parts = m[1].split('.');
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
  }catch(e){
    res.status(401).json({error:'Your session is invalid or expired. Please sign in again.'});
  }
}

// Official board news: fetch and extract notices only from the boards' own websites.
const cheerio = require('cheerio');
const NEWS_SOURCES = [
  { id: 'fbise', name: 'FBISE', home: 'https://www.fbise.edu.pk/', hosts: ['fbise.edu.pk'] },
  { id: 'karachi', name: 'Karachi Board (BSEK)', home: 'https://bsek.edu.pk/', hosts: ['bsek.edu.pk'] }
];
const NEWS_TTL = 10 * 60 * 1000;
let newsCache = { at: 0, items: [], errors: [] };
const newsWords = /(news|notice|notification|announcement|circular|date.?sheet|datesheet|result|admission|exam|examination|schedule|tender|press.?release|update|alert|download|paper)/i;
function officialUrl(raw, base, hosts) {
  try {
    const u = new URL(raw, base);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!hosts.some(h => u.hostname === h || u.hostname.endsWith('.' + h))) return null;
    u.hash = '';
    return u.href;
  } catch (_) { return null; }
}
async function fetchOfficial(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'LearnixStudentNews/1.0 (+official-board-notice-reader)', 'Accept': 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const type = response.headers.get('content-type') || '';
  if (!type.includes('html') && !type.includes('xml')) throw new Error('Not an HTML notice page');
  return await response.text();
}
function cleanText(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
async function collectBoard(source) {
  const candidates = new Set([source.home]);
  const errors = [];
  try {
    const homeHtml = await fetchOfficial(source.home);
    const $ = cheerio.load(homeHtml);
    $('a[href]').each((_, a) => {
      const title = cleanText($(a).text() || $(a).attr('title') || $(a).attr('aria-label'));
      const href = officialUrl($(a).attr('href'), source.home, source.hosts);
      if (href && title.length > 3 && newsWords.test(title + ' ' + href)) candidates.add(href);
    });
    for (const path of ['news.php','news','notices.php','notifications.php','notification.php','announcements.php','downloads.php']) {
      const u = officialUrl(path, source.home, source.hosts); if (u) candidates.add(u);
    }
  } catch (e) { errors.push(e.message); }
  const items = [];
  const visited = new Set();
  for (const pageUrl of [...candidates].slice(0, 14)) {
    if (visited.has(pageUrl)) continue; visited.add(pageUrl);
    let html;
    try { html = await fetchOfficial(pageUrl); } catch (_) { continue; }
    const $ = cheerio.load(html);
    $('script,style,noscript,nav,header,footer,form,svg').remove();
    const baseTitle = cleanText($('title').first().text());
    $('a[href]').each((_, a) => {
      const title = cleanText($(a).text() || $(a).attr('title') || $(a).attr('aria-label'));
      if (title.length < 8 || title.length > 240 || !newsWords.test(title)) return;
      const link = officialUrl($(a).attr('href'), pageUrl, source.hosts);
      if (!link || link === source.home || visited.has(link)) return;
      const context = cleanText($(a).closest('tr,li,article,.news-item,.notice-item,.list-group-item').text());
      items.push({ board: source.id, boardName: source.name, title, url: link, summary: context && context !== title ? context.slice(0, 1200) : '', publishedAt: '', sourcePage: pageUrl, pageTitle: baseTitle });
    });
    const pageTitle = cleanText($('h1').first().text() || $('h2').first().text() || baseTitle);
    const bodyText = cleanText($('main').text() || $('#content').text() || $('.content').text() || $('body').text());
    if (newsWords.test(pageTitle) && bodyText.length > 100 && !pageUrl.endsWith('/')) {
      items.push({ board: source.id, boardName: source.name, title: pageTitle, url: pageUrl, summary: bodyText.slice(0, 5000), publishedAt: '', sourcePage: pageUrl, pageTitle });
    }
  }
  const unique = new Map();
  for (const item of items) if (!unique.has(item.url)) unique.set(item.url, item);
  const enriched = await Promise.all([...unique.values()].slice(0, 24).map(async item => {
    try {
      const articleHtml = await fetchOfficial(item.url);
      const article = cheerio.load(articleHtml);
      article('script,style,noscript,nav,header,footer,form,svg,aside').remove();
      const content = cleanText(article('article').text() || article('main').text() || article('#content').text() || article('.content').text() || article('body').text());
      const heading = cleanText(article('h1').first().text() || article('h2').first().text() || article('title').first().text());
      const dateText = article('time').first().attr('datetime') || article('meta[property="article:published_time"]').attr('content') || article('meta[name="date"]').attr('content') || '';
      return { ...item, title: heading.length > 4 ? heading.slice(0,240) : item.title, summary: content.length > 80 ? content.slice(0, 6500) : item.summary, publishedAt: dateText ? (Date.parse(dateText) ? new Date(dateText).toISOString() : '') : item.publishedAt };
    } catch (_) { return item; }
  }));
  return { items: enriched, errors };
}
app.get('/api/news', async (_req, res) => {
  try {
    if (Date.now() - newsCache.at < NEWS_TTL) return res.json({ items: newsCache.items, sources: NEWS_SOURCES.map(s => ({ id: s.id, name: s.name, url: s.home })), updatedAt: new Date(newsCache.at).toISOString(), errors: newsCache.errors });
    const results = await Promise.all(NEWS_SOURCES.map(collectBoard));
    const items = results.flatMap(r => r.items).sort((a,b) => (Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
    const errors = results.flatMap((r,i) => r.errors.map(error => NEWS_SOURCES[i].name + ': ' + error));
    newsCache = { at: Date.now(), items, errors };
    res.json({ items, sources: NEWS_SOURCES.map(s => ({ id: s.id, name: s.name, url: s.home })), updatedAt: new Date(newsCache.at).toISOString(), errors });
  } catch (e) { res.status(502).json({ error: 'Official board news could not be fetched right now.' }); }
});

app.get('/api/health',(_q,res)=>res.json({ok:true,service:'learnix-api'}));
app.post('/api/chat',requireAuth,async(req,res)=>{try{
 const message=typeof req.body.message==='string'?req.body.message.trim():'';if(!message&&!Array.isArray(req.body.images))return res.status(400).json({error:'Enter a question or attach an image.'});
 if(message.length>12000)return res.status(413).json({error:'Please keep your question under 12,000 characters.'});
 if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:'The AI service is not configured yet.'});
 const history=Array.isArray(req.body.history)?req.body.history.slice(-16):[];
 const contents=history.map(m=>({role:m.role==='model'?'model':'user',parts:[{text:String(m.text||'').slice(0,12000)}]})).filter(m=>m.parts[0].text);
 const parts=[];if(message)parts.push({text:message});
 const images=Array.isArray(req.body.images)?req.body.images.slice(0,4):[];
 for(const im of images){if(!im||typeof im.data!=='string'||!/^image\/(jpeg|png|webp|gif)$/.test(im.mimeType||''))continue;const b=Buffer.from(im.data,'base64');if(b.length>10*1024*1024)continue;parts.push({inlineData:{mimeType:im.mimeType,data:b.toString('base64')}});}
 if(!parts.length)return res.status(400).json({error:'No supported message or image was received.'});
 const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);const model=genAI.getGenerativeModel({model:process.env.GEMINI_MODEL||'gemini-2.5-flash',systemInstruction:'You are Learnix, a helpful study assistant for students in Pakistan. Explain clearly, use step-by-step reasoning when useful, and do not invent facts. Keep answers appropriate for students.'});
 const chat=model.startChat({history:contents});const result=await chat.sendMessage(parts);const reply=result.response.text();if(!reply)return res.status(502).json({error:'The AI returned an empty response. Please try again.'});res.json({reply});
 }catch(e){console.error('Gemini request failed:',e.message);res.status(502).json({error:'Learnix AI could not answer right now. Please try again shortly.'});}});
app.use((err,_req,res,_next)=>{console.error('API error:',err.message);res.status(500).json({error:'An unexpected server error occurred.'});});module.exports=app;
