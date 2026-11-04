
(function(){
  'use strict';
  var rootId='learnixTestsRoot', state={profile:null,subjects:[],test:null,index:0,answers:{},seconds:0,timer:null,result:null,busy:false};
  var $=function(s,r){return (r||document).querySelector(s)};
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function root(){return document.getElementById(rootId);}
  function currentView(){return location.hash.replace('#','')||'dashboard';}
  function isTests(){return currentView()==='tests';}
  async function token(){var u=window.learnixAuth&&window.learnixAuth.user;if(!u)throw new Error('Please sign in again.');return u.getIdToken();}
  async function api(path,body){
    var t=await token(),res=await fetch('/api/tests'+path,{method:body?'POST':'GET',headers:{'Authorization':'Bearer '+t,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    var data=await res.json().catch(()=>({error:'The server returned an invalid response.'}));
    if(!res.ok)throw new Error(data.error||'Test service request failed.');
    return data;
  }
  function boardName(k){return k==='federal'?'Federal Board (FBISE)':'Sindh / Karachi Board (BSEK)';}
  function stopTimer(){if(state.timer)clearInterval(state.timer);state.timer=null;}
  function fmt(s){var m=Math.floor(s/60),r=s%60;return String(m).padStart(2,'0')+':'+String(r).padStart(2,'0');}
  function toast(msg){var el=$('#toast');if(el){el.textContent=msg;el.hidden=false;setTimeout(()=>el.hidden=true,3200);}}
  function shell(content){var el=root();if(el)el.innerHTML=content;}
  function loading(msg){shell('<section class="card test-state"><div class="test-spinner"></div><h2>'+esc(msg||'Loading your test workspace…')+'</h2><p class="muted">Connecting securely to your Learnix account.</p></section>');}
  async function loadSubjects(){
    loading('Preparing your test workspace…');
    try{
      var data=await api('/subjects');
      state.profile=data;state.subjects=data.subjects||[];
      if(!isTests())return;
      renderSetup();
    }catch(e){shell('<section class="card test-state"><h2>Tests could not load.</h2><p>'+esc(e.message)+'</p><button class="btn btn-line" data-test-action="reload">Try again</button></section>');}
  }
  function render(){
    if(!isTests())return;
    if(state.test){if(state.result)renderResult();else{if(!state.timer)startTimer();renderRunner();}return;}
    if(state.profile)renderSetup();else loadSubjects();
  }
  function renderSetup(){
    if(!state.profile){loadSubjects();return;}
    var p=state.profile,available=state.subjects.filter(s=>s.available);
    var opts=available.map(s=>'<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>').join('');
    shell('<div class="page-head test-page-head"><div><p class="eyebrow">PRACTISE WITH PURPOSE</p><h1>Your <em>tests.</em></h1><p class="sub">Create a focused assessment using your saved board, class and study group.</p></div><span class="chip line">Secure assessment</span></div>'+
      '<section class="card test-profile"><div><small>YOUR STUDY PROFILE</small><strong>'+esc(boardName(p.board))+' · Class '+esc(p.classLevel)+'</strong><span>'+esc(p.group==='biology'?'Science — Biology':p.group==='computer'?'Science — Computer Science':'Humanities')+'</span></div><span class="test-profile-mark">✓</span></section>'+
      '<section class="test-builder card"><div class="test-builder-heading"><div><p class="eyebrow">NEW ASSESSMENT</p><h2>What would you like to practise?</h2></div><span class="test-step">01 / 02</span></div>'+
      '<div class="test-fields"><label class="field"><span>Subject</span><select id="testSubject">'+(opts||'<option value="">No verified subjects available</option>')+'</select></label>'+
      '<label class="field"><span>Question format</span><select id="testType">'+(p.mcqAvailable?'<option value="mcq">Multiple choice (30 questions)</option>':'')+'<option value="short">Short questions (10 questions)</option><option value="long">Long questions (5 questions)</option></select></label></div><p class="small muted test-note" id="testOfflineNotice" hidden></p>'+
      '<div class="test-rule"><b>✦ Syllabus-aware generation</b><p>Questions are restricted to the selected board, class, subject and verified chapter list. If AI is unavailable, Learnix checks the matching board-specific question bank only.</p></div>'+
      '<p class="test-error" id="testError" role="alert" hidden></p>'+
      '<button class="btn btn-primary test-start" data-test-action="generate" '+(!available.length?'disabled':'')+'>Generate my test <span>↗</span></button>'+
      (p.board==='karachi'?'<p class="small muted test-note">MCQ tests are not available for Sindh / Karachi Board profiles.</p>':'')+
      (!available.length?'<p class="small muted test-note">Your current subjects do not have verified chapter data yet. No unrelated questions will be shown.</p>':'')+
      '</section><section class="test-info-grid"><article class="card"><span>01</span><b>Choose a subject</b><p>Only subjects in your saved profile are listed.</p></article><article class="card"><span>02</span><b>Complete your test</b><p>Move between questions and review your answers before submission.</p></article><article class="card"><span>03</span><b>Understand your result</b><p>See your score, answer review and feedback after submitting.</p></article></section>');    updateOfflineNotice();
  }
  function updateOfflineNotice(){var n=$('#testOfflineNotice'),subject=$('#testSubject')&&$('#testSubject').value,type=$('#testType')&&$('#testType').value;if(!n)return;var s=state.subjects.find(x=>x.name===subject);if(type==='mcq'&&state.profile&&state.profile.board==='federal'&&state.profile.classLevel==='9'){var count=s?Number(s.offlineMcqCount)||0:0;n.textContent=count<30?'Offline fallback has '+count+' MCQs for this subject; 30 are required. If Gemini is unavailable, this MCQ test cannot be generated.':'Offline fallback has enough MCQs for this subject.';n.hidden=false;}else n.hidden=true;}
  async function generate(){
    var subject=$('#testSubject')&&$('#testSubject').value,type=$('#testType')&&$('#testType').value,err=$('#testError');
    if(!subject){if(err){err.textContent='Select an available subject first.';err.hidden=false;}return;}
    var btn=$('[data-test-action="generate"]');if(btn){btn.disabled=true;btn.innerHTML='<span class="test-spinner small-spin"></span> Generating…';}
    if(err)err.hidden=true;
    try{
      var test=await api('/generate',{subject,type});
      state.test=test;state.index=0;state.answers={};state.result=null;state.seconds=test.durationSeconds||1800;startTimer();renderRunner();
    }catch(e){if(err){err.textContent=e.message;err.hidden=false;}if(btn){btn.disabled=false;btn.innerHTML='Generate my test <span>↗</span>';}}
  }
  function answeredCount(){return Object.keys(state.answers).filter(k=>String(state.answers[k]||'').trim()).length;}
  function questionMarkup(q,i){
    var val=state.answers[q.id]||'';
    if(q.type==='mcq')return '<div class="test-options">'+q.options.map(o=>'<label class="test-option '+(val===o.id?'selected':'')+'"><input type="radio" name="testAnswer" value="'+esc(o.id)+'" '+(val===o.id?'checked':'')+'><span class="option-letter">'+esc(o.id)+'</span><span>'+esc(o.text)+'</span></label>').join('')+'</div>';
    return '<label class="test-answer-label" for="subjectiveAnswer">Your answer</label><textarea id="subjectiveAnswer" class="test-answer" rows="'+(q.type==='long'?8:5)+'" maxlength="8000" placeholder="Write your answer here…">'+esc(val)+'</textarea>';
  }
  function renderRunner(){
    var t=state.test;if(!t)return;
    var q=t.questions[state.index],answered=answeredCount(),total=t.questions.length;
    shell('<div class="test-run-top"><div><p class="eyebrow">ASSESSMENT IN PROGRESS</p><h1>'+esc(t.subject)+' <em>test.</em></h1><p class="sub">'+esc(boardName(t.board))+' · Class '+esc(t.classLevel)+' · '+(t.source==='gemini'?'Gemini AI Generated Test':'Offline Question Bank Test')+(t.source==='question-bank'?' · Offline Mode':'')+'</p></div><div class="test-clock"><small>TIME LEFT</small><strong id="testClock">'+fmt(state.seconds)+'</strong></div></div>'+
      '<div class="test-progress-wrap"><div><span>Question '+(state.index+1)+' of '+total+'</span><span>'+answered+' answered · '+(total-answered)+' remaining</span></div><div class="test-progress"><i style="width:'+((state.index+1)/total*100)+'%"></i></div></div>'+
      '<section class="test-run-layout"><aside class="card test-question-map"><b>Question navigator</b><div class="test-map-grid">'+t.questions.map((x,i)=>'<button type="button" data-test-action="jump" data-index="'+i+'" class="'+(i===state.index?'current ':'')+(state.answers[x.id]?'answered':'')+'" aria-label="Question '+(i+1)+'">'+(i+1)+'</button>').join('')+'</div><p><i class="map-dot answered"></i> Answered <i class="map-dot"></i> Not answered</p></aside>'+
      '<article class="card test-question-card"><div class="test-question-meta"><span>QUESTION '+String(state.index+1).padStart(2,'0')+'</span><span>'+esc(q.type.toUpperCase())+' · '+esc(q.chapter)+'</span></div><h2>'+esc(q.question)+'</h2>'+questionMarkup(q,state.index)+
      '<div class="test-question-actions"><button class="btn btn-line" data-test-action="previous" '+(state.index===0?'disabled':'')+'>← Previous</button><button class="btn btn-primary" data-test-action="next" '+(state.index===total-1?'disabled':'')+'>Next question →</button></div></article></section>'+
      '<div class="test-submit-bar"><span>'+answered+' / '+total+' answers saved on this page</span><button class="btn btn-primary" data-test-action="submit">Review &amp; submit test</button></div>');
  }
  function startTimer(){
    stopTimer();
    var deadline=Date.parse(state.test.createdAt)+(state.test.durationSeconds||1800)*1000;
    state.timer=setInterval(()=>{
      if(!state.test||state.result)return;
      state.seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
      var el=$('#testClock');if(el)el.textContent=fmt(state.seconds);
      if(state.seconds<=0){stopTimer();submit(true);}
    },1000);
  }
  function saveCurrentAnswer(){
    var q=state.test&&state.test.questions[state.index];if(!q)return;
    if(q.type==='mcq'){var checked=$('input[name="testAnswer"]:checked');if(checked)state.answers[q.id]=checked.value;}
    else{var ta=$('#subjectiveAnswer');if(ta)state.answers[q.id]=ta.value;}
  }
  async function submit(auto){
    if(!state.test)return;
    saveCurrentAnswer();
    var total=state.test.questions.length,answered=answeredCount();
    if(!auto&&!confirm('Submit this test now? You have answered '+answered+' of '+total+' questions. You cannot change answers after submission.'))return;
    stopTimer();
    shell('<section class="card test-state"><div class="test-spinner"></div><h2>Submitting your test…</h2><p class="muted">Your answers are being evaluated securely.</p></section>');
    try{
      var answers=state.test.questions.map(q=>({questionId:q.id,optionId:q.type==='mcq'?(state.answers[q.id]||''):undefined,text:q.type!=='mcq'?(state.answers[q.id]||''):undefined}));
      var data=await api('/submit',{testId:state.test.testId,answers});
      state.result=data.result;renderResult();
    }catch(e){startTimer();renderRunner();toast(e.message);}
  }
  function renderResult(){
    var r=state.result,t=state.test;if(!r||!t)return;
    var evaluated=r.status==='evaluated'||r.status==='evaluated-by-ai';
    var score=evaluated?(r.percentage+'%'):'Review answers';
    var source=t.source==='gemini'?'Gemini AI Generated Test':'Offline Question Bank Test';
    var cards=evaluated?'<div class="test-result-stats"><div><small>Score</small><strong>'+esc(r.correct!==undefined?r.correct+'/'+r.total:r.marksAwarded+'/'+r.maxMarks)+'</strong></div><div><small>Percentage</small><strong>'+esc(score)+'</strong></div><div><small>Correct</small><strong>'+esc(r.correct!==undefined?r.correct:'—')+'</strong></div>'+(r.incorrect!==undefined?'<div><small>Incorrect</small><strong>'+r.incorrect+'</strong></div><div><small>Unanswered</small><strong>'+r.unanswered+'</strong></div>':'')+'</div>':'<div class="test-review-notice">'+(r.status==='evaluation-unavailable'?'AI evaluation was unavailable. Your answers and any available model answers are shown for self-review.':'This Offline Question Bank Test is not AI-graded. Source answers and marking guidelines are shown where available; missing materials are not invented.')+'</div>';
    var review=(r.review||[]).map((x,i)=>{
      var detail=x.correct!==undefined?'<p class="'+(x.correct?'review-good':'review-bad')+'">'+(x.correct?'Correct':'Incorrect')+' · Correct option: '+esc(x.correctOptionId||'')+'</p><p>'+esc(x.explanation||'')+'</p>'
        :'<p><b>Your answer:</b> '+esc(x.studentAnswer||'Not answered')+'</p><p><b>Model answer:</b> '+esc(x.modelAnswer||'Not available')+'</p><p><b>Marking guidelines:</b> '+esc(x.markingGuidelines||'')+'</p>'+(x.feedback?'<p><b>Feedback:</b> '+esc(x.feedback)+'</p>':'')+(x.improvementTip?'<p><b>Improve:</b> '+esc(x.improvementTip)+'</p>':'');
      return '<article class="test-review-item"><span>QUESTION '+(i+1)+' · '+esc(x.chapter||'')+'</span><h3>'+esc(x.question)+'</h3>'+detail+'</article>';
    }).join('');
    shell('<div class="page-head"><div><p class="eyebrow">ASSESSMENT COMPLETE</p><h1>Your test <em>result.</em></h1><p class="sub">'+esc(t.subject)+' · '+esc(boardName(t.board))+' · Class '+esc(t.classLevel)+'</p></div><span class="chip line">'+esc(source)+(t.source==='question-bank'?' · Offline Mode':'')+'</span></div>'+
      '<section class="card test-result-card"><div class="test-result-icon">✓</div><h2>'+(evaluated?'Test evaluated':'Test submitted')+'</h2><p class="muted">'+(r.status==='evaluated-by-ai'?'Your written answers were evaluated by Gemini AI.':r.status==='evaluated'?'Your MCQ answers were checked against the private answer key.':'Your answer review is ready.')+'</p>'+cards+
      '<button class="btn btn-primary" data-test-action="new">Create another test ↗</button></section>'+
      '<section class="test-review"><div class="test-review-heading"><div><p class="eyebrow">LEARNING REVIEW</p><h2>Question-by-question review</h2></div></div>'+review+'</section>');
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-test-action]');if(!b)return;
    var a=b.getAttribute('data-test-action');
    if(a==='generate'){generate();return;}
    if(a==='reload'){state.profile=null;loadSubjects();return;}
    if(a==='previous'||a==='next'||a==='jump'){
      saveCurrentAnswer();
      if(a==='previous')state.index=Math.max(0,state.index-1);
      if(a==='next')state.index=Math.min(state.test.questions.length-1,state.index+1);
      if(a==='jump')state.index=Math.max(0,Math.min(state.test.questions.length-1,Number(b.dataset.index)||0));
      renderRunner();return;
    }
    if(a==='submit'){submit(false);return;}
    if(a==='new'){stopTimer();state.test=null;state.result=null;state.answers={};state.profile=null;loadSubjects();return;}
  });
  document.addEventListener('change',function(e){
    if(e.target&&(e.target.id==='testSubject'||e.target.id==='testType'))updateOfflineNotice();
    if(e.target&&e.target.name==='testAnswer'){var q=state.test&&state.test.questions[state.index];if(q){state.answers[q.id]=e.target.value;renderRunner();}}
  });
  document.addEventListener('input',function(e){
    if(e.target&&e.target.id==='subjectiveAnswer'){var q=state.test&&state.test.questions[state.index];if(q)state.answers[q.id]=e.target.value;}
  });
  window.addEventListener('hashchange',function(){if(isTests())render();});
  window.addEventListener('learnix-profile-updated',function(){state.profile=null;state.subjects=[];});
  window.learnixTests={render:render};
})();
