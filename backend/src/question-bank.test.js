const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'question-bank');
const subjects = ['english','urdu','islamiyat','pakistan-studies','mathematics','physics','chemistry','biology','computer-science'];

test('all four board/class banks contain 30 short and 30 long source questions per subject', () => {
  for (const board of ['federal','karachi']) for (const cls of [9,10]) for (const subject of subjects) {
    const file = path.join(root,board,`class-${cls}`,`${subject}.json`);
    assert.ok(fs.existsSync(file),`missing ${file}`);
    const rows = JSON.parse(fs.readFileSync(file,'utf8'));
    assert.equal(rows.length,60,`${board} class ${cls} ${subject}`);
    assert.equal(rows.filter(q=>q.type==='short').length,30);
    assert.equal(rows.filter(q=>q.type==='long').length,30);
    assert.ok(rows.every(q=>q.board===board && q.class===cls && q.answer===null));
    assert.equal(new Set(rows.map(q=>q.id)).size,60);
  }
});

test('Federal Class 9 MCQ bank contains exactly 120 source MCQs with four options and answer keys', () => {
  const rows=JSON.parse(fs.readFileSync(path.join(root,'federal','class-9','mcqs.json'),'utf8'));
  assert.equal(rows.length,120);
  const expected={'Physics':15,'Chemistry':15,'Biology':15,'Mathematics':15,'Computer Science':12,'English':12,'Islamiyat':12,'Pakistan Studies':12,'Urdu':12};
  for(const [subject,count] of Object.entries(expected)){
    const subset=rows.filter(q=>q.subject===subject);
    assert.equal(subset.length,count,subject);
    for(const q of subset){
      assert.equal(q.options.length,4,q.id);
      assert.deepEqual(q.options.map(o=>o.id).sort(),['A','B','C','D']);
      assert.ok(q.options.some(o=>o.id===q.correctOptionId),q.id);
    }
  }
});

test('offline selection is strict to board, class, subject and test type, and samples exact requested size', () => {
  const {getOfflineQuestions,sampleQuestions}=require('./question-bank-service');
  const profile={board:'federal',classLevel:'9'};
  const all=getOfflineQuestions(profile,'Physics','short',root);
  assert.equal(all.length,30);
  const selected=sampleQuestions(all,10);
  assert.equal(selected.length,10);
  assert.equal(new Set(selected.map(q=>q.id)).size,10);
  assert.ok(selected.every(q=>q.board==='federal'&&q.class===9&&q.subject==='Physics'&&q.type==='short'));
  assert.equal(getOfflineQuestions(profile,'Physics','long',root).length,30);
  assert.equal(getOfflineQuestions(profile,'Chemistry','short',root).length,30);
  assert.equal(getOfflineQuestions({board:'karachi',classLevel:'9'},'Physics','short',root).every(q=>q.board==='karachi'),true);
  assert.equal(getOfflineQuestions({board:'federal',classLevel:'10'},'Physics','short',root).every(q=>q.class===10),true);
});

test('MCQ bank is restricted to Federal Class 9 and never silently fills a 30-question shortage', () => {
  const {getOfflineQuestions,sampleQuestions}=require('./question-bank-service');
  const physics=getOfflineQuestions({board:'federal',classLevel:'9'},'Physics','mcq',root);
  assert.equal(physics.length,15);
  assert.equal(sampleQuestions(physics,30).length,15);
  assert.deepEqual(getOfflineQuestions({board:'karachi',classLevel:'9'},'Physics','mcq',root),[]);
  assert.deepEqual(getOfflineQuestions({board:'federal',classLevel:'10'},'Physics','mcq',root),[]);
});
