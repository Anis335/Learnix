(function(){
  'use strict';

  var rootId = 'learnixTestsRoot';
  var state = {
    profile: null,
    test: null,
    index: 0,
    answers: {},
    seconds: 0,
    timer: null,
    result: null,
    busy: false
  };

  /* ---- helpers ---- */
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.from((r || document).querySelectorAll(s)); };
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

  /* ---- board/class/subject picker ---- */
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

  /* Fallback static chapter catalog for instant UI rendering before API responds */
  var FALLBACK_CATALOG = {
    federal: {
      '9': {
        Mathematics: ['Real Numbers','Logarithms','Sets and Relations','Factorization and Algebraic Manipulation','Linear Equations and Inequalities','Trigonometry and Bearing','Coordinate Geometry','Geometry of Straight Lines','Geometry and Polygons','Practical Geometry','Basic Statistics'],
        Physics: ['Physical Quantities and Measurement','Kinematics','Dynamics I','Dynamics II','Pressure and Deformation in Solids','Work and Energy','Density and Temperature','Magnetism','Nature of Science and Physics'],
        Chemistry: ['Nature of Science in Chemistry','Matter','Atomic Structure','Periodic Table and Periodicity of Properties','Chemical Bonding','Stoichiometry','Electrochemistry','Energetics','Chemical Equilibrium','Acids, Bases and Salts','Environmental Chemistry — Air','Environmental Chemistry — Water','Organic Chemistry','Hydrocarbons','Biochemistry','Separation Techniques'],
        Biology: ['The Science of Biology','Biodiversity','Cell','Cell Cycle','Tissues, Organ and Organ Systems','Molecular Biology','Metabolism','Plant Physiology','Plant Reproduction','Evolution'],
        'Computer Science': ['Fundamentals of Computer','Fundamentals of Operating System','Office Automation','Data Communication','Computer Networks'],
        English: ["Hazrat Muhammad Rasulullah ﷺ — A Mercy for All Creation","The Art of Muslim Women's Entrepreneurship","Modern World and Age of Digital Globalization","Nothing Is Impossible","Say No to Drugs","Travel and Tourism","The Metamorphosis","Good Health and Well-being"]
      },
      '10': {
        Mathematics: ['Complex Numbers','Quadratic Equations','Matrices and Determinants','Linear and Quadratic Inequalities','Algebraic Functions','Functions and Graphs','Vectors in Plane','Application of Trigonometry','Practical Geometry of Circles','Basic Statistics'],
        Physics: ['Simple Harmonic Motion and Waves','Sound','Geometrical Optics','Electrostatics','Current Electricity','Electromagnetism','Basic Electronics','Information and Communication Technology','Atomic and Nuclear Physics'],
        Chemistry: ['Chemical Equilibrium','Acids, Bases and Salts','Organic Chemistry','Hydrocarbons','Biochemistry','Environmental Chemistry I — Atmosphere','Environmental Chemistry II — Water','Chemical Industries'],
        Biology: ['Gaseous Exchange','Homeostasis','Coordination and Control','Support and Movement','Reproduction','Inheritance','Man and His Environment','Biotechnology','Pharmacology']
      }
    },
    karachi: {
      '9': {
        Mathematics: ['Real and Complex Numbers','Logarithms','Algebraic Expressions and Formulas','Factorization','Algebraic Manipulation','Linear Equations and Inequalities','Linear Graphs and Their Applications','Quadratic Equations','Congruent Triangles','Parallelograms and Triangles','Line Bisectors and Angle Bisectors','Practical Geometry — Triangles','Introduction to Coordinate Geometry'],
        Physics: ['Physical Quantities and Measurements','Kinematics','Dynamics','Turning Effect of Forces','Gravitation','Work and Energy','Properties of Matter','Thermal Properties of Matter','Transfer of Heat'],
        Chemistry: ['Fundamentals of Chemistry','Atomic Structure','Periodic Table and Periodicity of Properties','Chemical Bonding','Physical States of Matter','Solutions','Electrochemistry','Chemical Reactivity'],
        Biology: ['Introduction to Biology','Solving a Biological Problem','Biodiversity','Cells and Tissues','Cell Cycle','Enzymes','Bioenergetics','Nutrition','Transport'],
        'Computer Science': ['Fundamentals of Computer','Fundamentals of Operating System','Office Automation','Data Communication and Computer Network','Computer Security and Ethics','Web Development','Introduction to Database System']
      },
      '10': {
        Mathematics: ['Quadratic Equations','Theory of Quadratic Equations','Variations','Partial Fractions','Sets and Functions','Basic Statistics','Introduction to Trigonometry','Projection of a Side of a Triangle','Chords of a Circle','Tangents to a Circle','Angle in a Segment of a Circle','Practical Geometry — Circles'],
        Physics: ['Simple Harmonic Motion and Waves','Sound','Geometrical Optics','Electrostatics','Current Electricity','Electromagnetism','Basic Electronics','Information and Communication Technology','Atomic and Nuclear Physics'],
        Chemistry: ['Chemical Equilibrium','Acids, Bases and Salts','Organic Chemistry','Hydrocarbons','Biochemistry','The Atmosphere','Water','Chemical Industries'],
        Biology: ['Gaseous Exchange','Homeostasis','Coordination and Control','Support and Movement','Reproduction','Inheritance','Man and His Environment','Biotechnology','Pharmacology'],
        'Computer Science': ['Problem Solving and Algorithm Designing','Basics of Programming in C++','Input/Output Handling in C++','Control Structure','Functions','Digital Logic and Design','Introduction to Scratch'],
        'Pakistan Studies': ['Ideological Basis of Pakistan','Making of Pakistan','Constitutional Development in Pakistan','Land and Climate of Pakistan','Resources of Pakistan','Industrial Development of Pakistan','Culture of Pakistan','Education in Pakistan']
      }
    }
  };

  /* State for the test picker */
  var pick = {
    board: 'federal',
    classLevel: '9',
    subject: 'Mathematics',
    count: 15,
    chapters: [],
    availableChapters: [],
    loadingChapters: false
  };

  /* ---- Load chapters dynamically from backend or fallback ---- */
  async function loadChapters() {
    pick.loadingChapters = true;
    var fallback = ((FALLBACK_CATALOG[pick.board] || {})[pick.classLevel] || {})[pick.subject] || [];
    pick.availableChapters = fallback.slice();
    pick.chapters = fallback.slice(); // select all by default
    renderChaptersGrid();

    try {
      var data = await api('/chapters?board=' + encodeURIComponent(pick.board) + '&classLevel=' + encodeURIComponent(pick.classLevel) + '&subject=' + encodeURIComponent(pick.subject));
      if (Array.isArray(data.chapters) && data.chapters.length > 0) {
        pick.availableChapters = data.chapters;
        pick.chapters = data.chapters.slice();
      }
    } catch (_) {
      // Keep fallback
    } finally {
      pick.loadingChapters = false;
      renderChaptersGrid();
    }
  }

  /* ---- Render dispatcher ---- */
  function render(){
    if(!isTests()) return;
    if(state.test){
      if(state.result) renderResult();
      else { if(!state.timer) startTimer(); renderRunner(); }
      return;
    }
    renderSetup();
  }

  /* ---- Setup screen ---- */
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

    var countOpts = [10, 15, 20, 30].map(function(cnt){
      return '<option value="' + cnt + '"' + (pick.count === cnt ? ' selected' : '') + '>' + cnt + ' Questions (' + cnt + ' min)' + (cnt === 15 ? ' — Recommended' : '') + '</option>';
    }).join('');

    shell(
      '<div class="page-head test-page-head">' +
        '<div>' +
          '<p class="eyebrow">PRACTISE WITH PURPOSE</p>' +
          '<h1>Practice <em>Tests.</em></h1>' +
          '<p class="sub">Generate AI-powered chapter-wise MCQ tests for Sindh &amp; Federal boards — practice with purpose and get instant results.</p>' +
        '</div>' +
        '<span class="chip line">Gemini AI · Syllabus-Aligned</span>' +
      '</div>' +

      '<section class="test-builder card">' +
        '<div class="test-builder-heading">' +
          '<div><p class="eyebrow">CUSTOMIZE YOUR TEST</p><h2>What would you like to practise?</h2></div>' +
          '<span class="test-step">MCQ · Instant Evaluation</span>' +
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
            '<span>Question Count</span>' +
            '<select id="testCount">' + countOpts + '</select>' +
          '</label>' +
        '</div>' +

        '<div class="test-chapters-wrap">' +
          '<div class="test-chapters-head">' +
            '<h3>' +
              '<span>Select Chapters (Chapter-wise Practice)</span>' +
              '<span class="test-chapters-count" id="testChapterCount">' + pick.chapters.length + ' of ' + pick.availableChapters.length + ' selected</span>' +
            '</h3>' +
            '<div class="test-chapters-actions">' +
              '<button type="button" class="test-chip-btn" data-test-action="select-all-chapters">Select All</button>' +
              '<button type="button" class="test-chip-btn" data-test-action="clear-all-chapters">Clear All</button>' +
            '</div>' +
          '</div>' +
          '<div class="test-chapters-grid" id="testChaptersGrid">' +
            renderChaptersHTML() +
          '</div>' +
        '</div>' +

        '<div class="test-rule">' +
          '<b>✦ Gemini AI Curriculum-Aware Generation</b>' +
          '<p>Questions are generated dynamically by Gemini AI matching your exact board syllabus and chosen chapters. Each question comes with four multiple-choice options, instant scoring, and step-by-step explanations.</p>' +
        '</div>' +

        '<p class="test-error" id="testError" role="alert" hidden></p>' +
        '<button class="btn btn-primary test-start" data-test-action="generate">Generate Practice Test <span>↗</span></button>' +
      '</section>' +

      '<section class="test-info-grid">' +
        '<article class="card"><span>01</span><b>Pick chapters &amp; length</b><p>Choose specific chapters or practice the entire syllabus with 10 to 30 MCQs.</p></article>' +
        '<article class="card"><span>02</span><b>Solve with a timed clock</b><p>Select your choices freely, flag questions, and track your time left.</p></article>' +
        '<article class="card"><span>03</span><b>Instant score &amp; explanations</b><p>Get immediate grading, see correct answers, and learn from AI explanations.</p></article>' +
      '</section>'
    );

    // Initial chapter load if empty
    if (!pick.availableChapters.length) {
      loadChapters();
    }
  }

  /* ---- Render chapter checkboxes list ---- */
  function renderChaptersHTML() {
    if (pick.loadingChapters) {
      return '<div class="muted" style="padding:16px;">Loading syllabus chapters…</div>';
    }
    if (!pick.availableChapters || pick.availableChapters.length === 0) {
      return '<div class="muted" style="padding:16px;">All syllabus chapters included for this subject.</div>';
    }

    return pick.availableChapters.map(function(ch, idx){
      var isChecked = pick.chapters.indexOf(ch) >= 0;
      return '<label class="test-chapter-card ' + (isChecked ? 'selected' : '') + '">' +
        '<input type="checkbox" data-chapter="' + esc(ch) + '" ' + (isChecked ? 'checked' : '') + '>' +
        '<span>' + esc(ch) + '</span>' +
      '</label>';
    }).join('');
  }

  function renderChaptersGrid() {
    var grid = $('#testChaptersGrid');
    if (grid) grid.innerHTML = renderChaptersHTML();
    updateChapterCountBadge();
  }

  function updateChapterCountBadge() {
    var badge = $('#testChapterCount');
    if (badge) {
      badge.textContent = pick.chapters.length + ' of ' + pick.availableChapters.length + ' selected';
    }
  }

  /* ---- Refresh subjects & reload chapters ---- */
  function refreshSubjectDropdown(){
    var subSel = $('#testSubject'); if(!subSel) return;
    var subjects = (SUBJECTS_BY_BOARD[pick.board] || {})[pick.classLevel] || [];
    if(subjects.indexOf(pick.subject) < 0) pick.subject = subjects[0] || '';
    subSel.innerHTML = subjects.map(function(s){
      return '<option value="' + esc(s) + '"' + (pick.subject === s ? ' selected' : '') + '>' + esc(s) + '</option>';
    }).join('');
    loadChapters();
  }

  /* ---- Generate Practice Test ---- */
  async function generate(){
    var err = $('#testError');
    if(err) err.hidden = true;

    if (pick.availableChapters.length > 0 && pick.chapters.length === 0) {
      if(err){
        err.textContent = 'Please select at least one chapter for your practice test.';
        err.hidden = false;
      }
      return;
    }

    var btn = $('[data-test-action="generate"]');
    if(btn){
      btn.disabled = true;
      btn.innerHTML = '<span class="test-spinner small-spin"></span> Generating Practice Test…';
    }

    try {
      var test = await api('/generate', {
        board: pick.board,
        classLevel: pick.classLevel,
        subject: pick.subject,
        chapters: pick.chapters,
        count: pick.count
      });
      state.test = test;
      state.index = 0;
      state.answers = {};
      state.result = null;
      state.seconds = test.durationSeconds || (test.questions.length * 60);
      startTimer();
      renderRunner();
    } catch(e){
      if(err){ err.textContent = e.message; err.hidden = false; }
      if(btn){ btn.disabled = false; btn.innerHTML = 'Generate Practice Test <span>↗</span>'; }
    }
  }

  /* ---- Question navigation ---- */
  function answeredCount(){
    return Object.keys(state.answers).filter(function(k){ return String(state.answers[k] || '').trim(); }).length;
  }

  function questionMarkup(q){
    var val = state.answers[q.id] || '';
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

  function renderRunner(){
    var t = state.test; if(!t) return;
    var q = t.questions[state.index];
    var answered = answeredCount(), total = t.questions.length;

    var chapterSummary = t.chapters && t.chapters.length ? (t.chapters.length + ' chapters selected') : 'All chapters';

    shell(
      '<div class="test-run-top">' +
        '<div>' +
          '<p class="eyebrow">ASSESSMENT IN PROGRESS</p>' +
          '<h1>' + esc(t.subject) + ' <em>Practice Test.</em></h1>' +
          '<p class="sub">' + esc(boardName(t.board)) + ' · Class ' + esc(t.classLevel) + ' · ' + esc(chapterSummary) + ' · ' +
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
            '<span>QUESTION ' + String(state.index + 1).padStart(2, '0') + ' OF ' + total + '</span>' +
            '<span>' + esc(q.chapter || t.subject) + '</span>' +
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
        '<button class="btn btn-primary" data-test-action="submit">Submit Practice Test <span>✓</span></button>' +
      '</div>'
    );
  }

  function startTimer(){
    stopTimer();
    var deadline = Date.parse(state.test.createdAt) + (state.test.durationSeconds || (state.test.questions.length * 60)) * 1000;
    state.timer = setInterval(function(){
      if(!state.test || state.result) return;
      state.seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      var el = $('#testClock'); if(el) el.textContent = fmtTime(state.seconds);
      if(state.seconds <= 0){ stopTimer(); submit(true); }
    }, 1000);
  }

  function saveCurrentAnswer(){
    var q = state.test && state.test.questions[state.index]; if(!q) return;
    var checked = $('input[name="testAnswer"]:checked');
    if(checked) state.answers[q.id] = checked.value;
  }

  async function submit(auto){
    if(!state.test) return;
    saveCurrentAnswer();
    var total = state.test.questions.length, answered = answeredCount();
    if(!auto && !confirm('Submit your practice test now?\nYou have answered ' + answered + ' of ' + total + ' questions.')) return;
    stopTimer();

    shell(
      '<section class="card test-state">' +
        '<div class="test-spinner"></div>' +
        '<h2>Evaluating your practice test…</h2>' +
        '<p class="muted">Checking your answers and compiling results.</p>' +
      '</section>'
    );

    try {
      var answers = state.test.questions.map(function(q){
        return {
          questionId: q.id,
          optionId: state.answers[q.id] || ''
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

  /* ---- Result screen ---- */
  function renderResult(){
    var r = state.result, t = state.test; if(!r || !t) return;
    var source = t.source === 'gemini' ? 'Gemini AI Generated Practice Test' : 'Offline Question Bank Test';

    var scoreCards = '<div class="test-result-stats">' +
      '<div><small>Score</small><strong>' + esc(r.correct + '/' + r.total) + '</strong></div>' +
      '<div><small>Percentage</small><strong>' + esc(r.percentage + '%') + '</strong></div>' +
      '<div><small>Correct</small><strong class="result-good">' + r.correct + '</strong></div>' +
      '<div><small>Incorrect</small><strong class="result-bad">' + r.incorrect + '</strong></div>' +
      '<div><small>Unanswered</small><strong>' + r.unanswered + '</strong></div>' +
    '</div>';

    var review = (r.review || []).map(function(x, i){
      var optionsHTML = '';
      if(Array.isArray(x.options)){
        optionsHTML = '<div class="result-options">' +
          x.options.map(function(o){
            var isCorrectOpt = o.id === x.correctOptionId;
            var isSelectedWrong = o.id === x.selectedOptionId && !x.correct;
            var cls = isCorrectOpt ? 'result-opt correct' : (isSelectedWrong ? 'result-opt wrong' : 'result-opt');
            return '<span class="' + cls + '">' +
              '<b>' + esc(o.id) + '.</b> ' + esc(o.text) +
              (isCorrectOpt ? ' <span class="result-good">✓ Correct Answer</span>' : '') +
              (isSelectedWrong ? ' <span class="result-bad">✗ Your Choice</span>' : '') +
            '</span>';
          }).join('') +
        '</div>';
      }

      var statusBadge = x.correct
        ? '<p class="review-good">✓ Correct (+1 Mark)' + (x.selectedOptionId ? ' — Chosen: Option ' + esc(x.selectedOptionId) : '') + '</p>'
        : '<p class="review-bad">✗ Incorrect' + (x.selectedOptionId ? ' — Chosen: Option ' + esc(x.selectedOptionId) : ' — Unanswered') + ' · Correct: Option ' + esc(x.correctOptionId || '') + '</p>';

      var explanationHTML = x.explanation
        ? '<div class="review-explanation"><b>Explanation:</b> ' + esc(x.explanation) + '</div>'
        : '';

      return '<article class="test-review-item">' +
        '<span>QUESTION ' + (i + 1) + ' · ' + esc(x.chapter || t.subject) + '</span>' +
        '<h3>' + esc(x.question) + '</h3>' +
        statusBadge +
        optionsHTML +
        explanationHTML +
      '</article>';
    }).join('');

    shell(
      '<div class="page-head">' +
        '<div>' +
          '<p class="eyebrow">ASSESSMENT COMPLETE</p>' +
          '<h1>Your Practice Test <em>result.</em></h1>' +
          '<p class="sub">' + esc(t.subject) + ' · ' + esc(boardName(t.board)) + ' · Class ' + esc(t.classLevel) + '</p>' +
        '</div>' +
        '<span class="chip line">' + esc(source) + '</span>' +
      '</div>' +

      '<section class="card test-result-card">' +
        '<div class="test-result-icon">' + (r.percentage >= 60 ? '🎉' : '📝') + '</div>' +
        '<h2>' + (r.percentage >= 80 ? 'Excellent work!' : r.percentage >= 50 ? 'Good effort!' : 'Keep practicing!') + '</h2>' +
        '<p class="muted">Here is your comprehensive score breakdown and chapter-wise question review.</p>' +
        scoreCards +
        '<button class="btn btn-primary" data-test-action="new">Start another practice test ↗</button>' +
      '</section>' +

      '<section class="test-review">' +
        '<div class="test-review-heading">' +
          '<div><p class="eyebrow">DETAILED EXPLANATIONS</p><h2>Question-by-question review</h2></div>' +
        '</div>' +
        review +
      '</section>'
    );
  }

  /* ---- Event listeners ---- */
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-test-action]');
    if(!b) return;
    var a = b.getAttribute('data-test-action');

    if(a === 'generate'){ generate(); return; }
    if(a === 'select-all-chapters'){
      pick.chapters = pick.availableChapters.slice();
      renderChaptersGrid();
      return;
    }
    if(a === 'clear-all-chapters'){
      pick.chapters = [];
      renderChaptersGrid();
      return;
    }
    if(a === 'previous' || a === 'next' || a === 'jump'){
      saveCurrentAnswer();
      if(a === 'previous') state.index = Math.max(0, state.index - 1);
      if(a === 'next') state.index = Math.min(state.test.questions.length - 1, state.index + 1);
      if(a === 'jump') state.index = Math.max(0, Math.min(state.test.questions.length - 1, Number(b.dataset.index) || 0));
      renderRunner();
      return;
    }
    if(a === 'submit'){ submit(false); return; }
    if(a === 'new'){
      stopTimer();
      state.test = null;
      state.result = null;
      state.answers = {};
      renderSetup();
      return;
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
    if(e.target && e.target.id === 'testSubject'){
      pick.subject = e.target.value;
      loadChapters();
    }
    if(e.target && e.target.id === 'testCount'){
      pick.count = Number(e.target.value) || 15;
    }
    if(e.target && e.target.name === 'testAnswer'){
      var q = state.test && state.test.questions[state.index];
      if(q){
        state.answers[q.id] = e.target.value;
        renderRunner();
      }
    }
    // Chapter checkbox toggle
    if(e.target && e.target.matches('[data-chapter]')){
      var ch = e.target.getAttribute('data-chapter');
      if (e.target.checked) {
        if (pick.chapters.indexOf(ch) < 0) pick.chapters.push(ch);
      } else {
        pick.chapters = pick.chapters.filter(function(c){ return c !== ch; });
      }
      var card = e.target.closest('.test-chapter-card');
      if (card) card.classList.toggle('selected', e.target.checked);
      updateChapterCountBadge();
    }
  });

  window.addEventListener('hashchange', function(){ if(isTests()) render(); });
  window.learnixTests = { render: render };
})();
