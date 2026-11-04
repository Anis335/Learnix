'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
function subjectSlug(subject){return String(subject||'').toLowerCase().replace(/\s+/g,'-').replace(/^islamiat$/,'islamiyat');}
function readBankFile(file){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch(_){return [];}}
function shuffle(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=crypto.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function getOfflineQuestions(profile,subject,type,root=path.join(__dirname,'question-bank')){
  const dir=path.join(root,profile.board,`class-${profile.classLevel}`);
  if(type==='mcq'){
    if(profile.board!=='federal'||profile.classLevel!=='9')return [];
    return readBankFile(path.join(dir,'mcqs.json')).filter(q=>q.subject===subject&&q.board==='federal'&&Number(q.class)===9);
  }
  return readBankFile(path.join(dir,`${subjectSlug(subject)}.json`)).filter(q=>q.board===profile.board&&String(q.class)===profile.classLevel&&subjectSlug(q.subject)===subjectSlug(subject)&&q.type===type);
}
function uniqueQuestions(items){const seen=new Set();return items.filter(q=>{const key=String(q.question||'').trim().toLocaleLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;});}
function sampleQuestions(items,count){return shuffle(uniqueQuestions(items)).slice(0,count);}
function toTestQuestion(q){return {...q,classLevel:String(q.class),chapter:q.chapter||'General',modelAnswer:q.answer==null?'':String(q.answer),markingGuidelines:Array.isArray(q.markingGuidelines)?q.markingGuidelines.join('\n'):String(q.markingGuidelines||'')};}
module.exports={subjectSlug,getOfflineQuestions,uniqueQuestions,shuffle,sampleQuestions,toTestQuestion};
