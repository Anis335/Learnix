
(function(){
  'use strict';

  var rootId = 'learnixTestsRoot';
  var state = {
    profile: null, subjects: [], test: null,
    index: 0, answers: {}, seconds: 0,
    timer: null, result: null, busy: false
  };

  /* ---- helpers ---- */
  var $ = function(s, r){ return (r || document).querySelector(s); };
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function root(){ return document.getElementById(rootId); }
  function currentView(){ return location.hash.replace('#','') || 'dashboard'; }
  function isTests(){ return currentView() === 'tests'; }
  async function token(){ var u = window.learnixAuth && window.learnixAuth.user; if(!u) throw new Error('Please sign in again.'); return u.getIdToken(); }
  async function api(path, body){
    var t = await token();
    var res = await fetch('/api/tests' + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    var data = await res.json().catch(function(){ return { error: 'The server returned an invalid response.' }; });
    if (!res.ok) throw new Error(data.error || 'Test service request failed.');
    return data;
  }
  function boardName(k){ return k === 'federal' ? 'Federal Board (FBISE)' : 'Sindh / Karachi Board (BSEK)'; }
  function stopTimer(){ if(state.timer) clearInterval(state.timer); state.timer = null; }
  function fmtTime(s){ var m = Math.floor(s / 60), r = s % 60; return String(m).padStart(2,'0') + ':' + String(r).padStart(2,'0'); }
  function toast(msg){ var el = $('#toast'); if(el){ el.textContent = msg; el.hidden = false; setTimeout(function(){ el.hidden = true; }, 3200); } }
  function shell(html){ var el = root(); if(el) el.innerHTML = html; }

  /* ---- board/class/subject picker (standalone — no profile required) ---- */
  var BOARDS = [
    { id: 'federal', label: 'Federal Board (FBISE)' },
    { id: 'karachi', label: 'Sindh / Karachi Board (BSEK)' }
  ];
  var CLASSES = ['9', '10'];
  var SUBJECTS_BY_BOARD = {
    federal: {
      '9':  ['Mathematics','Physics','Chemistry','Biology','Computer Science','English','Urdu','Islamiyat','Pakistan Studies'],
      '10': ['Mathematics','Physics','Chemistry','Biology','Computer Science','English','Urdu','Islamiyat','Pakistan Studies']
    },
    karachi: {
      '9':  ['Mathematics','Physics','Chemistry','Biology','Computer Science','English','Urdu','Islamiyat','Pakistan Studies'],
      '10': ['Mathematics','Physics','Chemistry','Biology','Computer Science','English','Urdu','Islamiyat','Pakistan Studies']
    }
  };
  var TEST_TYPES = [
    { id: 'mcq',   label: 'MCQ / Objective  (30 questions, 30 min)' },
    { id: 'short', label: 'Short Questions  (10 questions, 25 min)' },
    { id: 'long',  label: 'Long Questions   (5 questions, 45 min)'  }
  ];

  /* ---- state for picker ---- */
  var pick = { board: 'federal', classLevel: '9', subject: 'Mathematics', type: 'mcq' };

  /* ---- loading spinner ---- */
  function loading(msg){
    shell(
      '<section class="card test-state">' +
        '<div class="test-spinner"></div>' +
        '<h2>' + esc(msg || 'Loading…') + '</h2>' +
        '<p class="muted">Connecting securely to your Learnix account.</p>' +
      '</section>'
    );
  }

  /* ---- main render dispatcher ---- */
  function render(){
    if(!isTests()) return;
    if(state.test){
      if(state.result) renderResult();
      else { if(!state.timer) startTimer(); renderRunner(); }
      return;
    }
    renderSetup();
  }

  /* ---- setup screen ---- */
  function renderSetup(){
    var boardOpts = BOARDS.map(function(b){
      return '<option value="' + b.id + '"' + (pick.board === b.id ? ' selected' : '') + '>' + esc(b.label) + '</option>';
    }).join('');

    var classOpts = CLASSES.map(function(c){
      return '<option value="' + c + '"' + (pick.classLevel === c ? ' selected' : '') + '>Class ' + c + '</option>';
    }).join('');

    var subjects = (SUBJECTS_BY_BOARD[pick.board] || {})[pick.classLevel] || [];
    var subjectOpts = subjects.map(function(s){
      return '<option value="' + esc(s) + '"' + (pick.subject === s ? ' selected' : '') + '>' + esc(s) + '</option>';
    }).join('');

    var typeOpts = TEST_TYPES.map(function(t){
      return '<option value="' + t.id + '"' + (pick.type === t.id ? ' selected' : '') + '>' + esc(t.label) + '</option>';
    }).join('');

    shell(
      '<div class="page-head test-page-head">' +
        '<div>' +
          '<p class="eyebrow">PRACTISE WITH PURPOSE</p>' +
          '<h1>MCQ <em>Tests.</em></h1>' +
          '<p class="sub">Generate AI-powered questions for any board, class, and subject — then answer and get instant results.</p>' +
        '</div>' +
        '<span class="chip line">AI-generated · Board-verified</span>' +
      '</div>' +

      '<section class="test-builder card">' +
        '<div class="test-builder-heading">' +
          '<div><p class="eyebrow">NEW TEST</p><h2>What would you like to practise?</h2></div>' +
          '<span class="test-step">01 / 02</span>' +
        '</div>' +

        '<div class="test-fields">' +
          '<label class="field">' +
            '<span>Board</span>' +
            '<select id="testBoard">' + boardOpts + '</select>' +
          '</label>' +
          '<label class="field">' +
            '<span>Class</span>' +
            '<select id="testClass">' + classOpts + '</select>' +
          '</label>' +
          '<label class="field">' +
            '<span>Subject</span>' +
            '<select id="testSubject">' + subjectOpts + '</select>' +
          '</label>' +
          '<label class="field">' +
            '<span>Question format</span>' +
            '<select id="testType">' + typeOpts + '</select>' +
          '</label>' +
        '</div>' +

        '<div class="test-rule">' +
          '<b>✦ Syllabus-aware AI generation</b>' +
          '<p>Questions are generated by Gemini AI using the official syllabus chapters for the selected board, class, and subject. If AI is unavailable, the verified offline question bank is used as a fallback.</p>' +
        '</div>' +

        '<p class="test-error" id="testError" role="alert" hidden></p>' +
        '<button class="btn btn-primary test-start" data-test-action="generate">Generate my test <span>↗</span></button>' +
      '</section>' +

      '<section class="test-info-grid">' +
        '<article class="card"><span>01</span><b>Choose your options</b><p>Select your board, class, subject and question format.</p></article>' +
        '<article class="card"><span>02</span><b>Answer the questions</b><p>Navigate freely, save answers, and review before you submit.</p></article>' +
        '<article class="card"><span>03</span><b>See your result</b><p>Get your score, correct answers, and explanations instantly.</p></article>' +
      '</section>'
    );
  }

  /* ---- live update of subject dropdown when board/class changes ---- */
  function refreshSubjectDropdown(){
    var subSel = $('#testSubject'); if(!subSel) return;
    var subjects = (SUBJECTS_BY_BOARD[pick.board] || {})[pick.classLevel] || [];
    if(subjects.indexOf(pick.subject) < 0) pick.subject = subjects[0] || '';
    subSel.innerHTML = subjects.map(function(s){
      return '<option value="' + esc(s) + '"' + (pick.subject === s ? ' selected' : '') + '>' + esc(s) + '</option>';
    }).join('');
  }

  /* ---- generate ---- */
  async function generate(){
    var err = $('#testError');
    if(err) err.hidden = true;
    var btn = $('[data-test-action="generate"]');
    if(btn){ btn.disabled = true; btn.innerHTML = '<span class="test-spinner small-spin"></span> Generating…'; }

    // Build a minimal profile from the picker so the existing backend still works.
    // We override the profile check by passing board/classLevel/subject/type directly.
    try {
      var test = await api('/generate', {
        board: pick.board,
        classLevel: pick.classLevel,
        subject: pick.subject,
        type: pick.type
      });
      state.test = test;
      state.index = 0;
      state.answers = {};
      state.result = null;
      state.seconds = test.durationSeconds || 1800;
      startTimer();
      renderRunner();
    } catch(e){
      if(err){ err.textContent = e.message; err.hidden = false; }
      if(btn){ btn.disabled = false; btn.innerHTML = 'Generate my test <span>↗</span>'; }
    }
  }

  /* ---- question navigation ---- */
  function answeredCount(){ return Object.keys(state.answers).filter(function(k){ return String(state.answers[k] || '').trim(); }).length; }

  function questionMarkup(q){
    var val = state.answers[q.id] || '';
    if(q.type === 'mcq'){
      return '<div class="test-options">' +
        (q.options || []).map(function(o){
          return '<label class="test-option ' + (val === o.id ? 'selected' : '') + '">' +
            '<input type="radio" name="testAnswer" value="' + esc(o.id) + '" ' + (val === o.id ? 'checked' : '') + '>' +
            '<span class="option-letter">' + esc(o.id) + '</span>' +
            '<span>' + esc(o.text) + '</span>' +
          '</label>';
        }).join('') +
      '</div>';
    }
    return '<label class="test-answer-label" for="subjectiveAnswer">Your answer</label>' +
      '<textarea id="subjectiveAnswer" class="test-answer" rows="' + (q.type === 'long' ? 8 : 5) + '" maxlength="8000" placeholder="Write your answer here…">' + esc(val) + '</textarea>';
  }

  function renderRunner(){
    var t = state.test; if(!t) return;
    var q = t.questions[state.index];
    var answered = answeredCount(), total = t.questions.length;

    shell(
      '<div class="test-run-top">' +
        '<div>' +
          '<p class="eyebrow">ASSESSMENT IN PROGRESS</p>' +
          '<h1>' + esc(t.subject) + ' <em>test.</em></h1>' +
          '<p class="sub">' + esc(boardName(t.board)) + ' · Class ' + esc(t.classLevel) + ' · ' +
            (t.source === 'gemini' ? 'Gemini AI Generated' : 'Offline Question Bank') +
          '</p>' +
        '</div>' +
        '<div class="test-clock"><small>TIME LEFT</small><strong id="testClock">' + fmtTime(state.seconds) + '</strong></div>' +
      '</div>' +

      '<div class="test-progress-wrap">' +
        '<div>' +
          '<span>Question ' + (state.index + 1) + ' of ' + total + '</span>' +
          '<span>' + answered + ' answered · ' + (total - answered) + ' remaining</span>' +
        '</div>' +
        '<div class="test-progress"><i style="width:' + ((state.index + 1) / total * 100) + '%"></i></div>' +
      '</div>' +

      '<section class="test-run-layout">' +
        '<aside class="card test-question-map">' +
          '<b>Question navigator</b>' +
          '<div class="test-map-grid">' +
            t.questions.map(function(x, i){
              return '<button type="button" data-test-action="jump" data-index="' + i + '" class="' +
                (i === state.index ? 'current ' : '') + (state.answers[x.id] ? 'answered' : '') +
                '" aria-label="Question ' + (i + 1) + '">' + (i + 1) + '</button>';
            }).join('') +
          '</div>' +
          '<p><i class="map-dot answered"></i> Answered <i class="map-dot"></i> Not answered</p>' +
        '</aside>' +

        '<article class="card test-question-card">' +
          '<div class="test-question-meta">' +
            '<span>QUESTION ' + String(state.index + 1).padStart(2, '0') + '</span>' +
            '<span>' + esc(q.type.toUpperCase()) + ' · ' + esc(q.chapter) + '</span>' +
          '</div>' +
          '<h2>' + esc(q.question) + '</h2>' +
          questionMarkup(q) +
          '<div class="test-question-actions">' +
            '<button class="btn btn-line" data-test-action="previous" ' + (state.index === 0 ? 'disabled' : '') + '>← Previous</button>' +
            '<button class="btn btn-primary" data-test-action="next" ' + (state.index === total - 1 ? 'disabled' : '') + '>Next question →</button>' +
          '</div>' +
        '</article>' +
      '</section>' +

      '<div class="test-submit-bar">' +
        '<span>' + answered + ' / ' + total + ' answers saved</span>' +
        '<button class="btn btn-primary" data-test-action="submit">Review &amp; submit test</button>' +
      '</div>'
    );
  }

  function startTimer(){
    stopTimer();
    var deadline = Date.parse(state.test.createdAt) + (state.test.durationSeconds || 1800) * 1000;
    state.timer = setInterval(function(){
      if(!state.test || state.result) return;
      state.seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      var el = $('#testClock'); if(el) el.textContent = fmtTime(state.seconds);
      if(state.seconds <= 0){ stopTimer(); submit(true); }
    }, 1000);
  }

  function saveCurrentAnswer(){
    var q = state.test && state.test.questions[state.index]; if(!q) return;
    if(q.type === 'mcq'){
      var checked = $('input[name="testAnswer"]:checked');
      if(checked) state.answers[q.id] = checked.value;
    } else {
      var ta = $('#subjectiveAnswer');
      if(ta) state.answers[q.id] = ta.value;
    }
  }

  async function submit(auto){
    if(!state.test) return;
    saveCurrentAnswer();
    var total = state.test.questions.length, answered = answeredCount();
    if(!auto && !confirm('Submit this test now? You have answered ' + answered + ' of ' + total + ' questions. You cannot change answers after submission.')) return;
    stopTimer();
    shell(
      '<section class="card test-state">' +
        '<div class="test-spinner"></div>' +
        '<h2>Submitting your test…</h2>' +
        '<p class="muted">Your answers are being evaluated securely.</p>' +
      '</section>'
    );
    try {
      var answers = state.test.questions.map(function(q){
        return {
          questionId: q.id,
          optionId: q.type === 'mcq' ? (state.answers[q.id] || '') : undefined,
          text: q.type !== 'mcq' ? (state.answers[q.id] || '') : undefined
        };
      });
      var data = await api('/submit', { testId: state.test.testId, answers: answers });
      state.result = data.result;
      renderResult();
    } catch(e) {
      startTimer();
      renderRunner();
      toast(e.message);
    }
  }

  /* ---- result screen ---- */
  function renderResult(){
    var r = state.result, t = state.test; if(!r || !t) return;
    var evaluated = r.status === 'evaluated' || r.status === 'evaluated-by-ai';
    var source = t.source === 'gemini' ? 'Gemini AI Generated Test' : 'Offline Question Bank Test';

    var scoreCards = '';
    if(evaluated){
      scoreCards = '<div class="test-result-stats">' +
        '<div><small>Score</small><strong>' + esc(r.correct !== undefined ? r.correct + '/' + r.total : r.marksAwarded + '/' + r.maxMarks) + '</strong></div>' +
        '<div><small>Percentage</small><strong>' + esc(r.percentage + '%') + '</strong></div>' +
        (r.correct !== undefined ?
          '<div><small>Correct</small><strong class="result-good">' + r.correct + '</strong></div>' +
          '<div><small>Incorrect</small><strong class="result-bad">' + r.incorrect + '</strong></div>' +
          '<div><small>Unanswered</small><strong>' + r.unanswered + '</strong></div>'
        : '') +
      '</div>';
    } else {
      scoreCards = '<div class="test-review-notice">' +
        (r.status === 'evaluation-unavailable'
          ? 'AI evaluation was unavailable. Your answers and any available model answers are shown for self-review.'
          : 'This Offline Question Bank test is not AI-graded. Source answers and marking guidelines are shown where available.') +
      '</div>';
    }

    var review = (r.review || []).map(function(x, i){
      var detail = '';
      if(x.correct !== undefined){
        // MCQ review — show options with highlighting
        var optionsHTML = '';
        if(Array.isArray(x.options)){
          optionsHTML = '<div class="result-options">' +
            x.options.map(function(o){
              var cls = o.id === x.correctOptionId ? 'result-opt correct' : (o.id === x.selectedOptionId && !x.correct ? 'result-opt wrong' : 'result-opt');
              return '<span class="' + cls + '">' +
                '<b>' + esc(o.id) + '.</b> ' + esc(o.text) +
                (o.id === x.correctOptionId ? ' ✓' : '') +
                (o.id === x.selectedOptionId && !x.correct ? ' ✗' : '') +
              '</span>';
            }).join('') +
          '</div>';
        }
        detail =
          '<p class="' + (x.correct ? 'review-good' : 'review-bad') + '">' +
            (x.correct ? '✓ Correct' : '✗ Incorrect') +
            (x.selectedOptionId ? ' — You chose: <strong>' + esc(x.selectedOptionId) + '</strong>' : ' — Unanswered') +
            ' · Correct: <strong>' + esc(x.correctOptionId || '') + '</strong>' +
          '</p>' +
          optionsHTML +
          (x.explanation ? '<p class="review-explanation"><b>Explanation:</b> ' + esc(x.explanation) + '</p>' : '');
      } else {
        detail =
          '<p><b>Your answer:</b> ' + esc(x.studentAnswer || 'Not answered') + '</p>' +
          '<p><b>Model answer:</b> ' + esc(x.modelAnswer || 'Not available') + '</p>' +
          (x.markingGuidelines ? '<p><b>Marking guidelines:</b> ' + esc(x.markingGuidelines) + '</p>' : '') +
          (x.feedback ? '<p><b>Feedback:</b> ' + esc(x.feedback) + '</p>' : '') +
          (x.improvementTip ? '<p><b>Improve:</b> ' + esc(x.improvementTip) + '</p>' : '');
      }
      return '<article class="test-review-item">' +
        '<span>QUESTION ' + (i + 1) + ' · ' + esc(x.chapter || '') + '</span>' +
        '<h3>' + esc(x.question) + '</h3>' +
        detail +
      '</article>';
    }).join('');

    shell(
      '<div class="page-head">' +
        '<div>' +
          '<p class="eyebrow">ASSESSMENT COMPLETE</p>' +
          '<h1>Your test <em>result.</em></h1>' +
          '<p class="sub">' + esc(t.subject) + ' · ' + esc(boardName(t.board)) + ' · Class ' + esc(t.classLevel) + '</p>' +
        '</div>' +
        '<span class="chip line">' + esc(source) + (t.source === 'question-bank' ? ' · Offline' : '') + '</span>' +
      '</div>' +

      '<section class="card test-result-card">' +
        '<div class="test-result-icon">' + (evaluated ? (r.percentage >= 60 ? '🎉' : '📝') : '📋') + '</div>' +
        '<h2>' + (evaluated ? 'Test evaluated' : 'Test submitted') + '</h2>' +
        '<p class="muted">' +
          (r.status === 'evaluated-by-ai' ? 'Your written answers were evaluated by Gemini AI.' :
           r.status === 'evaluated' ? 'Your MCQ answers were checked against the answer key.' :
           'Your answer review is ready.') +
        '</p>' +
        scoreCards +
        '<button class="btn btn-primary" data-test-action="new">Create another test ↗</button>' +
      '</section>' +

      '<section class="test-review">' +
        '<div class="test-review-heading">' +
          '<div><p class="eyebrow">LEARNING REVIEW</p><h2>Question-by-question review</h2></div>' +
        '</div>' +
        review +
      '</section>'
    );
  }

  /* ---- event listeners ---- */
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-test-action]'); if(!b) return;
    var a = b.getAttribute('data-test-action');
    if(a === 'generate'){ generate(); return; }
    if(a === 'previous' || a === 'next' || a === 'jump'){
      saveCurrentAnswer();
      if(a === 'previous') state.index = Math.max(0, state.index - 1);
      if(a === 'next') state.index = Math.min(state.test.questions.length - 1, state.index + 1);
      if(a === 'jump') state.index = Math.max(0, Math.min(state.test.questions.length - 1, Number(b.dataset.index) || 0));
      renderRunner(); return;
    }
    if(a === 'submit'){ submit(false); return; }
    if(a === 'new'){
      stopTimer();
      state.test = null; state.result = null; state.answers = {};
      renderSetup(); return;
    }
  });

  document.addEventListener('change', function(e){
    if(!isTests()) return;
    if(e.target && e.target.id === 'testBoard'){
      pick.board = e.target.value;
      refreshSubjectDropdown();
    }
    if(e.target && e.target.id === 'testClass'){
      pick.classLevel = e.target.value;
      refreshSubjectDropdown();
    }
    if(e.target && e.target.id === 'testSubject') pick.subject = e.target.value;
    if(e.target && e.target.id === 'testType') pick.type = e.target.value;
    if(e.target && e.target.name === 'testAnswer'){
      var q = state.test && state.test.questions[state.index];
      if(q){ state.answers[q.id] = e.target.value; renderRunner(); }
    }
  });

  document.addEventListener('input', function(e){
    if(e.target && e.target.id === 'subjectiveAnswer'){
      var q = state.test && state.test.questions[state.index];
      if(q) state.answers[q.id] = e.target.value;
    }
  });

  window.addEventListener('hashchange', function(){ if(isTests()) render(); });
  window.learnixTests = { render: render };
})();
