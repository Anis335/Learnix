(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var THEME_KEY='learnix.theme';   /* only the light/dark + accent look is remembered on this device; all user data lives in Firestore */

/* ---------- icons ---------- */
var ICONS={
  dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  calc:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  paper:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
  test:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  book:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  chev:'<path d="m6 9 6 6 6-6"/>',
  flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  flag:'<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  play:'<path d="M6 3l14 9-14 9z"/>',
  pause:'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  reset:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  note:'<path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><path d="M15 3v6h6M8 13h8M8 17h5"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  send:'<path d="M12 19V5M5 12l7-7 7 7"/>',
  stop:'<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  files:'<path d="M4 7V4h13v3M7 7h13v13H7z"/><path d="M4 7v13h3"/>',
  pin:'<path d="m16 3 5 5-4 1-4 5-1 5-2-2-2-2-2-2 5-1 5-4z"/><path d="m8 16-5 5"/>',
  archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M10 13h4"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  undo:'<path d="M3 7v6h6"/><path d="M5 13a7 7 0 1 1 2 5"/>',
  redo:'<path d="M21 7v6h-6"/><path d="M19 13a7 7 0 1 0-2 5"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  'list-ordered':'<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 5h2v4M4 9h2M4 13h2l-2 2h2M4 19h2"/>',
  'align-left':'<path d="M3 6h18M3 10h12M3 14h18M3 18h12"/>',
  'align-center':'<path d="M3 6h18M6 10h12M3 14h18M6 18h12"/>',
  'align-right':'<path d="M3 6h18M9 10h12M3 14h18M9 18h12"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7"/>',
  eraser:'<path d="m7 21-4-4a2 2 0 0 1 0-3l9-9a2 2 0 0 1 3 0l6 6a2 2 0 0 1 0 3l-7 7z"/><path d="m7 21 7-7"/>'
};
function ic(n,s){s=s||18;return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[n]+'</svg>'}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function uid(){return Math.random().toString(36).slice(2,9)}

/* ---------- dates ---------- */
var NAV=[['dashboard','Dashboard','dash'],['syllabus','My Syllabus','book'],['keynotes','Keynotes','note'],['chatbot','Linux AI','chat'],['tests','MCQ Tests','test'],['paper-generator','Exam Paper','paper'],['feedback','Feedbacks & Reviews','star'],['coming-soon','Courses','book']];
var SUBJECT_OPTIONS=['Mathematics','General Mathematics','Urdu','English','Chemistry','Physics','General Science','Computer Science','Biology','Tarjuma Quran Majeed','Islamiat','Pakistan Studies','Other'];
var DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
var DAYS_LONG=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
var WEEK_GOAL=25;          /* study hours per week */
var STREAK_MIN=600;        /* seconds of study that make a day count toward the streak */
function dateKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n)}
function todayKey(){return dateKey(new Date())}
function todayIdx(){return (new Date().getDay()+6)%7}
function weekKeys(){var n=new Date();var mon=addDays(n,-todayIdx());return DAYS.map(function(_,i){return dateKey(addDays(mon,i))})}
function daysUntil(iso){var t=new Date(iso+'T00:00:00'),n=new Date();n=new Date(n.getFullYear(),n.getMonth(),n.getDate());return Math.round((t-n)/86400000)}
function gap(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000)}
function fmt(t){var p=t.split(':').map(Number);var ap=p[0]>=12?'pm':'am';var h=p[0]%12||12;return h+':'+String(p[1]).padStart(2,'0')+' '+ap}
function range(s,e){var a=fmt(s),b=fmt(e);if(a.slice(-2)===b.slice(-2))a=a.slice(0,-3);return a+'–'+b}
function toMin(t){var p=t.split(':').map(Number);return p[0]*60+p[1]}
function fmtDate(iso){if(!iso)return '';var d=new Date(iso+'T00:00:00');return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function fmtShort(sec){var m=sec/60;if(m<1)return '<1m';if(m<60)return Math.round(m)+'m';return (sec/3600).toFixed(1).replace(/\.0$/,'')+'h'}
function fmtLong(sec){if(sec>0&&sec<60)return 'under 1 min';var m=Math.floor(sec/60);if(m<60)return m+' min';return Math.floor(m/60)+'h '+(m%60)+'m'}
function big(sec){if(sec<3600)return {v:Math.round(sec/60),u:'m'};return {v:(sec/3600).toFixed(1).replace(/\.0$/,''),u:'h'}}

/* ---------- data ---------- */
function makeSubject(id,name,total,done){
  var ch=[];for(var i=1;i<=total;i++)ch.push({id:id+i,name:'Chapter '+i,done:i<=done});
  return {id:id,name:name,chapters:ch};
}
function seedLog(){return {log:{},keys:[]};}
function defaults(){
  var t=new Date(),seed=seedLog();
  function d(n){return dateKey(addDays(t,n))}
  return {
    profile:{name:'',photo:''},
    onboarding:null,
    syllabusProfiles:{},
    notes:[],
    slots:[],
    goals:[],
    subjects:[],
    deadlines:[],
    log:seed.log,
    sampleKeys:seed.keys
  };
}

/* ---------- board-aware syllabus data ---------- */
var SYLLABUS_DATA={
  federal:{
    '9':{
      'Mathematics':['Real Numbers','Logarithms','Sets and Relations','Factorization and Algebraic Manipulation','Linear Equations and Inequalities','Trigonometry and Bearing','Coordinate Geometry','Geometry of Straight Lines','Geometry and Polygons','Practical Geometry','Basic Statistics'],
      'Physics':['Physical Quantities and Measurement','Kinematics','Dynamics I','Dynamics II','Pressure and Deformation in Solids','Work and Energy','Density and Temperature','Magnetism','Nature of Science and Physics'],
      'Chemistry':['Nature of Science in Chemistry','Matter','Atomic Structure','Periodic Table and Periodicity of Properties','Chemical Bonding','Stoichiometry','Electrochemistry','Energetics','Chemical Equilibrium','Acids, Bases and Salts','Environmental Chemistry — Air','Environmental Chemistry — Water','Organic Chemistry','Hydrocarbons','Biochemistry','Empirical Data Collection and Analysis','Separation Techniques','Qualitative Analysis','Chromatography'],
      'Biology':['The Science of Biology','Biodiversity','Cell','Cell Cycle','Tissues, Organ and Organ Systems','Molecular Biology','Metabolism','Plant Physiology','Plant Reproduction','Evolution'],
      'Computer Science':['Fundamentals of Computer','Fundamentals of Operating System','Office Automation','Data Communication','Computer Networks'],
      'English':['Hazrat Muhammad Rasulullah ﷺ — A Mercy for All Creation',"The Art of Muslim Women's Entrepreneurship",'Modern World and Age of Digital Globalization','Nothing Is Impossible — The Construction of the Brooklyn Bridge',"5 of Jeff Bezos's Best Lessons for Success from His 27 Years as Amazon CEO",'Say No to Drugs','Mowing — Robert Frost','The Eagle — Alfred Tennyson','Travel and Tourism','Two Mothers Remembered — Joann Snow Duncanson','The Metamorphosis','Good Health and Well-being'],
      'Urdu':['اخلاقِ حسنہ','کتبہ','بھیڑیا','آرام و سکون','کلیم اور مرزا ظاہر دار بیگ','نام دیو مالی','ابتدائی حساب','لڑی میں پروئے ہوئے مناظر','اپنی مدد آپ','حمد','نعت','جاوید کے نام','محنت کی برکات','کرکٹ اور مشاعرہ','پیامِ لطیف','فقیرانہ آئے صدا کر چلے','سن تو سہی جہاں میں ہے تیرا افسانہ کیا','غم ہے یا خوشی ہے تو','کاش طوفاں میں سفینے کو اتار ہوتا'],
      'Islamiat':['تعارف قرآن مجید','احادیث نبوی ﷺ','عقیدہ توحید','عقیدہ رسالت','نماز','روزہ','فتح مکہ','غزوہ حنین','عام الوفود','حضرت محمد رسول اللہ خاتم النبیین ﷺ کا بچپن اور جوانی','حضرت محمد رسول اللہ خاتم النبیین ﷺ کا ذوقِ عبادت','نبی کریم ﷺ کی سخاوت و ایثار','شکر و قناعت','امانت و دیانت','تکبر','حسد','قسم کے احکام و مسائل','گواہی کے احکام و مسائل','ہمسایوں کے حقوق','حضرت امام زین العابدینؓ','صحابہ کرامؓ','صحابیاتؓ','صوفیائے کرام','علماء و مفکرین','خود اعتمادی و خود انحصاری','ذہنی صحت اور جسمانی ریاضت'],
      'Tarjuma Quran Majeed':null
    },
    '10':{
      'Mathematics':['Complex Numbers','Quadratic Equations','Matrices and Determinants','Linear and Quadratic Inequalities','Algebraic Functions','Functions and Graphs','Vectors in Plane','Application of Trigonometry','Chord and Arcs of a Circle','Tangents and Angles of a Circle','Practical Geometry of Circles','Basic Statistics'],
      'Physics':['Simple Harmonic Motion and Waves','Sound','Geometrical Optics','Electrostatics','Current Electricity','Electromagnetism','Basic Electronics','Information and Communication Technology','Atomic and Nuclear Physics'],
      'Chemistry':['Chemical Equilibrium','Acids, Bases and Salts','Organic Chemistry','Hydrocarbons','Biochemistry','Environmental Chemistry I — Atmosphere','Environmental Chemistry II — Water','Chemical Industries'],
      'Biology':['Gaseous Exchange','Homeostasis','Coordination and Control','Support and Movement','Reproduction','Inheritance','Man and His Environment','Biotechnology','Pharmacology'],
      'Computer Science':null,
      'English':['Animal Rights in Islam: Showing Compassion','Cultural Festivals of Pakistan: Unity in Diversity','Media Literacy in the Modern Age',"Thank You, Ma'am",'Mother Nature','How to Make Better Decisions About Your Career','The Alchemist','Blue'],
      'Urdu':null,
      'Pakistan Studies':null,
      'Tarjuma Quran Majeed':null
    }
  },
  karachi:{
    '9':{
      'Mathematics':['Real and Complex Numbers','Logarithms','Algebraic Expressions and Formulas','Factorization','Algebraic Manipulation','Linear Equations and Inequalities','Linear Graphs and Their Applications','Quadratic Equations','Congruent Triangles','Parallelograms and Triangles','Line Bisectors and Angle Bisectors','Sides and Angles of a Triangle','Practical Geometry — Triangles','Theorems Related to Area','Projection of a Side of a Triangle','Introduction to Coordinate Geometry / Analytical Geometry'],
      'Physics':['Physical Quantities and Measurements','Kinematics','Dynamics','Turning Effect of Forces','Gravitation','Work and Energy','Properties of Matter','Thermal Properties of Matter','Transfer of Heat'],
      'Chemistry':['Fundamentals of Chemistry','Atomic Structure','Periodic Table and Periodicity of Properties','Chemical Bonding','Physical States of Matter','Solutions','Electrochemistry','Chemical Reactivity'],
      'Biology':['Introduction to Biology','Solving a Biological Problem','Biodiversity','Cells and Tissues','Cell Cycle','Enzymes','Bioenergetics','Nutrition','Transport'],
      'Computer Science':['Fundamentals of Computer','Fundamentals of Operating System','Office Automation','Data Communication and Computer Network','Computer Security and Ethics','Web Development','Introduction to Database System'],
      'English':['Ethics — Character Building','Role Model','Education and Careers','Pakistan and National Pride','Healthy Lifestyle','Gender Equity','Life Skills','People and Places'],
      'Urdu':null,
      'Islamiat':['The Holy Quran','The Blessed Hadith','Thematic Study','Pearls of Guidance and Personalities of Islam']
    },
    '10':{
      'Mathematics':['Quadratic Equations','Theory of Quadratic Equations','Variations','Partial Fractions','Sets and Functions','Basic Statistics','Introduction to Trigonometry','Projection of a Side of a Triangle','Chords of a Circle','Tangents to a Circle','Chords and Arcs','Angle in a Segment of a Circle','Practical Geometry — Circles'],
      'Physics':['Simple Harmonic Motion and Waves','Sound','Geometrical Optics','Electrostatics','Current Electricity','Electromagnetism','Basic Electronics','Information and Communication Technology','Atomic and Nuclear Physics'],
      'Chemistry':['Chemical Equilibrium','Acids, Bases and Salts','Organic Chemistry','Hydrocarbons','Biochemistry','The Atmosphere','Water','Chemical Industries'],
      'Biology':['Gaseous Exchange','Homeostasis','Coordination and Control','Support and Movement','Reproduction','Inheritance','Man and His Environment','Biotechnology','Pharmacology'],
      'Computer Science':['Problem Solving and Algorithm Designing','Basics of Programming in C++','Input/Output Handling in C++','Control Structure','Functions','Digital Logic and Design','Introduction to Scratch'],
      'English':['Vocabulary','Grammar','Writing Skills','Reading Comprehension','Hazrat Muhammad (SAW), an Embodiment of Justice','Chinese New Year','Try Again','First Aid','The Rain','Television vs Newspapers','Little by Little One Walks Far!','Peace','Selecting the Right Career','A World Without Books','Great Expectations','Population Growth and World Food Supplies','Faithfulness'],
      'Urdu':null,
      'Pakistan Studies':['Ideological Basis of Pakistan','Making of Pakistan','Constitutional Development in Pakistan','Land and Climate of Pakistan','Resources of Pakistan','Industrial Development of Pakistan','The Population of Pakistan','Culture of Pakistan','Education in Pakistan','Pakistan — A Welfare State','The Civic Life in Pakistan','Protection of Human Rights']
    }
  },
  cbse:{'9':{},'10':{}}
};
var SUBJECTS_PENDING_NOTE='The chapter list for this subject has not been verified against the current official textbook edition yet.';
function profileKey(p){return [p.board,p.classLevel,p.group].join('-')}
function currentSetup(){return state.onboarding||{board:'federal',classLevel:'9',group:'biology'};}
function boardLabel(k){return k==='federal'?'Federal Board (FBISE)':k==='karachi'?'Karachi Board (BSEK / Sindh)':'CBSE'}
function groupLabel(k){return k==='biology'?'Science — Biology':k==='computer'?'Science — Computer Science':'Humanities'}
function selectedSubjectNames(p){
  var names=p.group==='humanities'?['General Mathematics','Urdu','English','General Science']:['Mathematics','Urdu','English','Physics','Chemistry',p.group==='biology'?'Biology':'Computer Science'];
  names=names.filter(function(n,i,a){return a.indexOf(n)===i;});
  if(String(p.classLevel)==='9')names.push('Islamiat');else names.push('Pakistan Studies');
  if(p.board==='federal')names.push('Tarjuma Quran Majeed');
  return names;
}
function syllabusFor(p,name){
  if(p.board==='cbse')return null;
  if(p.group==='humanities'&&(name==='General Mathematics'||name==='General Science'))return null;
  var byBoard=SYLLABUS_DATA[p.board]||{},byClass=byBoard[String(p.classLevel)]||{};
  if(name==='Islamiat'&&String(p.classLevel)==='10')return null;
  if(name==='Pakistan Studies'&&String(p.classLevel)==='9')return null;
  if(name==='Tarjuma Quran Majeed'&&p.board!=='federal')return null;
  return Object.prototype.hasOwnProperty.call(byClass,name)?byClass[name]:null;
}
function buildSubjectsForProfile(p){
  var key=profileKey(p),saved=state.syllabusProfiles&&state.syllabusProfiles[key];
  if(saved&&Array.isArray(saved))return saved;
  return selectedSubjectNames(p).map(function(name){
    var data=syllabusFor(p,name),pending=!Array.isArray(data)||!data.length;
    var id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    return {id:id,name:name,pending:pending,chapters:(Array.isArray(data)?data:[]).map(function(ch,i){return {id:id+'-'+(i+1),name:ch,done:false};})};
  });
}
function configureSubjectsForProfile(p){
  state.onboarding={board:p.board,classLevel:String(p.classLevel),group:p.group};
  state.subjects=buildSubjectsForProfile(state.onboarding);
  state.syllabusProfiles=state.syllabusProfiles||{};
  state.syllabusProfiles[profileKey(state.onboarding)]=state.subjects;
  save();
}
function onboardingHTML(){
  var p=currentSetup();
  return '<div class="onboarding-overlay" id="onboardingOverlay" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle"><section class="onboarding-card">'+
    '<div class="onboarding-brand"><span class="mark">L</span><span>learnix.</span></div>'+
    '<p class="eyebrow">Personalise your workspace</p><h1 id="onboardingTitle">Your syllabus, <em>your pace.</em></h1><p class="intro">Choose your board, class and study group. Learnix will organise your subjects, chapters and progress around your selection.</p>'+ 
    '<form id="onboarding-form" novalidate><div class="onboarding-fields">'+
    '<div class="choice-group"><label>1. Select your education board</label><div class="choice-grid">'+
      [['federal','Federal Board (FBISE)','Federal curriculum'],['karachi','Karachi Board (BSEK / Sindh)','Sindh textbook curriculum'],['cbse','CBSE Board','Chapter list not configured yet']].map(function(x){return '<label class="choice-card"><input type="radio" name="board" value="'+x[0]+'" '+(p.board===x[0]?'checked':'')+'><span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></span></label>'}).join('')+
    '</div></div><div class="choice-group"><label>2. Which class are you in?</label><div class="choice-grid">'+
      [['9','Class 9','SSC-I / Grade 9'],['10','Class 10','SSC-II / Grade 10']].map(function(x){return '<label class="choice-card"><input type="radio" name="classLevel" value="'+x[0]+'" '+(String(p.classLevel)===x[0]?'checked':'')+'><span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></span></label>'}).join('')+
    '</div></div><div class="choice-group"><label>3. Select your study group</label><div class="choice-grid">'+
      [['biology','Science — Biology','Biology as the optional subject'],['computer','Science — Computer Science','Computer Science as the optional subject'],['humanities','Humanities','Available to all students']].map(function(x){return '<label class="choice-card"><input type="radio" name="group" value="'+x[0]+'" '+(p.group===x[0]?'checked':'')+'><span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></span></label>'}).join('')+
    '</div></div></div><p class="onboarding-note">Some syllabus lists still need confirmation against the latest official textbook. CBSE chapter data has not been added yet. Humanities subject combinations can vary by school and board.</p><div class="onboarding-footer"><span class="small muted">You can change these choices later from the My syllabus page.</span><button class="btn btn-primary" type="submit">Build my dashboard '+ic('send',15)+'</button></div><p class="err" id="onboardingError" role="alert" hidden></p></form></section></div>';
}
function showOnboarding(){var root=$('#onboardingRoot');if(!root)return;root.innerHTML=onboardingHTML();document.body.classList.add('onboarding-open');}
function hideOnboarding(){var root=$('#onboardingRoot');if(root)root.innerHTML='';document.body.classList.remove('onboarding-open');}
function startOnboarding(){showOnboarding();}

var state=defaults();
state.onboarding=null;state.syllabusProfiles={};
var cloudReady=false,saveTimer=null,savePending=false;

function saveNow(){
  clearTimeout(saveTimer);saveTimer=null;
  if(!savePending)return;savePending=false;
  var A=window.learnixAuth;
  if(!cloudReady||!A||!A.user||A.deleting)return;
  A.saveState(state).catch(function(e){toast('Could not save to your account: '+(e.message||'please try again.'))});
}
function save(){
  try{if(state.onboarding&&state.subjects){state.syllabusProfiles=state.syllabusProfiles||{};state.syllabusProfiles[profileKey(state.onboarding)]=state.subjects;}}catch(e){}
  if(!cloudReady)return;
  savePending=true;clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,700);
}
var selDay=todayIdx();
var openNotes={};

/* ---------- helpers ---------- */
function firstName(){var n=(state.profile.name||'').trim().split(/\s+/)[0];return n||'there'}
function initials(){var p=(state.profile.name||'').trim().split(/\s+/).filter(Boolean);if(!p.length)return 'L';return (p[0][0]+(p[1]?p[1][0]:'')).toUpperCase()}
var tt;
function toast(msg){var el=$('#toast');el.textContent=msg;el.hidden=false;clearTimeout(tt);tt=setTimeout(function(){el.hidden=true},3000)}
function pctClass(p,n){if(!n)return ['No chapters','line'];return p>=90?['Strong','good']:p>=85?['On track','']:['Needs revision','warn']}
function subjDone(s){return (s.chapters||[]).filter(function(c){return c.done}).length}
function subjPct(s){return !s.pending&&s.chapters&&s.chapters.length?Math.round(subjDone(s)/s.chapters.length*100):0}
function byDue(a,b){return a.due<b.due?-1:a.due>b.due?1:0}

/* ---------- study log, streak, chart data ---------- */
function studied(k){return state.log[k]||0}
function counted(k){return studied(k)>=STREAK_MIN}
function weekStudiedSec(){var ks=weekKeys(),ti=todayIdx(),s=0;for(var i=0;i<=ti;i++)s+=studied(ks[i]);return s}
function streakInfo(){
  var n=new Date(),todayDone=counted(dateKey(n)),cur=0,i=todayDone?0:1;
  while(counted(dateKey(addDays(n,-i)))){cur++;i++}
  var keys=Object.keys(state.log).filter(counted).sort(),best=0,run=0,prev=null;
  keys.forEach(function(k){run=(prev&&gap(prev,k)===1)?run+1:1;if(run>best)best=run;prev=k});
  return {cur:cur,best:Math.max(best,cur),todayDone:todayDone};
}
function plannedHours(dayIdx){
  return state.slots.filter(function(s){return s.day===dayIdx}).reduce(function(a,s){return a+Math.max(0,(toMin(s.end)-toMin(s.start))/60)},0);
}

/* ---------- theme ---------- */
function isDark(){var t=document.documentElement.getAttribute('data-theme');if(t)return t==='dark';return window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches}
function paintTheme(){var b=$('#themeBtn');b.innerHTML=isDark()?ic('sun',16)+'Light mode':ic('moon',16)+'Dark mode'}
try{var st=localStorage.getItem(THEME_KEY);if(st==='dark'||st==='light')document.documentElement.setAttribute('data-theme',st)}catch(e){}
if(window.matchMedia){try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',paintTheme)}catch(e){}}
var ACCENT_KEY='learnix.accent';
var ACCENTS=['mono','blue','green','purple','orange','rose'];
function paintAccent(value){value=ACCENTS.indexOf(value)>-1?value:'mono';document.documentElement.setAttribute('data-accent',value);document.querySelectorAll('.accent-dot').forEach(function(b){b.setAttribute('aria-checked',String(b.getAttribute('data-accent')===value))});try{localStorage.setItem(ACCENT_KEY,value)}catch(e){}}
try{paintAccent(localStorage.getItem(ACCENT_KEY)||'mono')}catch(e){paintAccent('mono')}

/* ---------- top bar ---------- */
function avatarHTML(withPlus){
  var inner=state.profile.photo?'<img src="'+state.profile.photo+'" alt="">':esc(initials());
  return inner+(withPlus&&!state.profile.photo?'<span class="plus">'+ic('plus',11)+'</span>':'');
}
function paintProfile(){
  $('#profileBtn').innerHTML='<span class="avatar">'+avatarHTML(true)+'</span><span class="who"><b>'+esc(state.profile.name||'Add your name')+'</b><span>'+esc(state.onboarding?boardLabel(state.onboarding.board)+' · Class '+state.onboarding.classLevel:'Study profile not set up')+'</span></span>';
  $('#pfPreview').innerHTML=avatarHTML(false);
  $('#removePhoto').hidden=!state.profile.photo;
  var g=$('#greet');if(g)g.innerHTML=greeting();
}
function greeting(){
  var h=new Date().getHours();var w=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  return w+', <em>'+esc(firstName())+'</em>.';
}
function paintToday(){$('#today').textContent=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
function paintNav(){
  var v=currentView();
  $('#nav').innerHTML=NAV.map(function(n){return '<a href="#'+n[0]+'"'+(n[0]===v?' aria-current="page"':'')+'>'+ic(n[2],19)+n[1]+'</a>'}).join('');
}

/* ---------- views ---------- */
function currentView(){var h=location.hash.replace('#','');if(h==='courses')return 'coming-soon';return h==='gpa-calculator'||NAV.some(function(n){return n[0]===h})?h:'dashboard'}

function dashboardHTML(){return ''+
'<div class="page-head">'+
  '<div><h1 id="greet"></h1><p class="sub">Plan your study days, practise with purpose and understand your progress.</p></div>'+
  '<div class="create-wrap">'+
    '<button class="btn btn-primary" id="createBtn" type="button" data-action="toggle-create" aria-haspopup="menu" aria-expanded="false">'+ic('plus')+'Create'+ic('chev',16)+'</button>'+
    '<div class="menu" id="createMenu" role="menu" hidden>'+
      '<p class="menu-label">Create new</p>'+
      '<button class="menu-item" type="button" role="menuitem" data-action="open-slot"><span class="mi-ic">'+ic('cal')+'</span><span><strong>Study timetable</strong><small>Add a study block to your weekly schedule.</small></span></button>'+
      '<button class="menu-item" type="button" role="menuitem" data-action="open-deadline"><span class="mi-ic">'+ic('flag')+'</span><span><strong>Deadline</strong><small>Track an assignment, test or essay with a due date.</small></span></button>'+
    '</div>'+
  '</div>'+
'</div>'+
'<div class="layout">'+
  '<div class="main">'+
    '<section class="card syllabus-overall"><div class="top"><div><p class="eyebrow">Your study setup</p><strong>'+esc(state.onboarding?boardLabel(state.onboarding.board)+' · Class '+state.onboarding.classLevel+' · '+groupLabel(state.onboarding.group):'Setup required')+'</strong></div><a class="btn btn-line btn-sm" href="#syllabus">View syllabus</a></div><p class="small muted">Track completed chapters and study hours. Progress is saved to your account.</p></section>'+
  '<section class="stats" id="stats" aria-label="This week at a glance"></section>'+
    '<section class="row row-chart">'+
      '<article class="card"><div class="card-head"><h2>'+ic('clock',17)+'Weekly study hours</h2><span class="chip" id="weekTotal"></span></div><div id="chart"></div></article>'+
      '<article class="card dark timer" aria-label="Focus timer">'+
        '<div class="card-head" style="margin-bottom:0"><h2>Focus timer</h2></div>'+
        '<div class="modes" id="timerModes"></div>'+
        '<p class="clock" id="timerClock" aria-live="off">25:00</p>'+
        '<div><p class="state" id="timerState"></p><p class="state" id="timerToday"></p></div>'+
        '<div class="ctrls"><button class="round main-btn" id="timerToggle" type="button" data-action="timer-toggle" aria-label="Start timer"></button><button class="round" type="button" data-action="timer-reset" aria-label="Reset timer">'+ic('reset',18)+'</button></div>'+
      '</article>'+
    '</section>'+
    '<section class="row row-2">'+
      '<article class="card"><div class="card-head"><h2>Subject progress</h2><a class="btn btn-line btn-sm" href="#syllabus">Open syllabus</a></div><div id="subjects"></div></article>'+
      '<article class="card"><div class="card-head"><h2>Timetable</h2><button class="btn btn-line btn-sm" type="button" data-action="open-slot">'+ic('plus',14)+'Add</button></div><div class="daytabs" id="dayTabs" role="group" aria-label="Choose a day"></div><div id="timetable"></div></article>'+
    '</section>'+
    '<section class="row row-2">'+
      '<article class="card"><div class="card-head"><h2>Deadlines <span class="chip" id="dlCount"></span></h2><button class="btn btn-line btn-sm" type="button" data-action="open-deadline">'+ic('plus',14)+'Add</button></div><div id="deadlines"></div></article>'+
    '</section>'+
  '</div>'+
  '<aside class="card goals" aria-labelledby="goalsTitle">'+
    '<div class="card-head" style="margin-bottom:0"><h2 id="goalsTitle">'+ic('target',17)+'Set a goal</h2><span class="chip" id="goalCount"></span></div>'+
    '<p class="muted">Pick something small enough to finish this week.</p>'+
    '<form id="goal-form" novalidate>'+
      '<div class="field"><label for="goalText">Your goal</label><input id="goalText" type="text" maxlength="120" placeholder="Finish chapter 6 revision"></div>'+
      '<div class="two"><div class="field"><label for="goalSubject">Subject</label><select id="goalSubject"><option>All subjects</option>'+SUBJECT_OPTIONS.map(function(s){return '<option>'+s+'</option>'}).join('')+'</select></div>'+
      '<div class="field"><label for="goalDate">Target date</label><input id="goalDate" type="date"></div></div>'+
      '<p class="err" id="goalErr" role="alert" hidden></p>'+
      '<button class="btn btn-primary" type="submit">'+ic('plus',16)+'Add goal</button>'+
    '</form>'+
    '<div class="suggest" aria-label="Goal ideas"><button type="button" data-action="suggest" data-text="Revise one chapter every day">Revise one chapter a day</button><button type="button" data-action="suggest" data-text="Score 85% or more in the next test">Score 85% in the next test</button><button type="button" data-action="suggest" data-text="Finish all past papers for one subject">Finish past papers</button></div>'+
    '<div class="goal-sum" id="goalSum"></div>'+
    '<ul id="goalList"></ul>'+
  '</aside>'+
'</div>'}

function coursesHTML(){return '<div class="page-head"><div><p class="eyebrow">Learnix roadmap</p><h1>More ways to <em>learn.</em></h1><p class="sub">Structured course materials are being prepared.</p></div></div><section class="coming-grid">'+
   '<article class="card soon"><span class="chip line">In development</span><h2>Courses</h2><p>Course materials and structured lessons will be available here.</p></article></section>'; }
function paperSubjectOptions(classLevel){
  var subjects=(SYLLABUS_DATA.karachi&&SYLLABUS_DATA.karachi[classLevel])||{};
  return Object.keys(subjects).filter(function(name){return Array.isArray(subjects[name])&&subjects[name].length;});
}
function paperPatternUI(subject){return subject==='Mathematics'?{mcq:15,short:10,long:5,shortMarks:3,longMarks:6,shortAttempt:6,longAttempt:3}:{mcq:12,short:12,long:6,shortMarks:3,longMarks:6,shortAttempt:8,longAttempt:4};}
function paperHTML(){
  var setup=currentSetup(),classLevel=String(setup.classLevel)==='10'?'10':'9',subjects=paperSubjectOptions(classLevel);
  var pattern=paperPatternUI(subjects[0]||'');
  return '<div class="page-head"><div><p class="eyebrow">AI academic tools</p><h1>Exam <em>paper generator</em></h1><p class="sub">Create a Karachi Board practice paper for Class 9 or 10 and download it as a Word document.</p></div></div>'+
    '<section class="paper-layout"><section class="card paper-form-card"><div class="card-head"><div><h2>Paper setup</h2><p class="small muted">Karachi Board · AI practice format</p></div><span class="chip">BSEK</span></div><form id="paper-form" novalidate><div class="paper-fields"><div class="field"><label for="paperClass">Class</label><select id="paperClass"><option value="9" '+(classLevel==='9'?'selected':'')+'>Class 9</option><option value="10" '+(classLevel==='10'?'selected':'')+'>Class 10</option></select></div><div class="field"><label for="paperSubject">Subject</label><select id="paperSubject">'+subjects.map(function(name){return '<option value="'+esc(name)+'">'+esc(name)+'</option>';}).join('')+'</select></div></div><label class="paper-check"><input id="paperAnswerKey" type="checkbox"><span><strong>Include answer key</strong><small>Add AI model answers at the end for self-checking.</small></span></label><div class="paper-format"><strong>Included in this paper</strong><span id="paperPatternText">'+pattern.mcq+' MCQs · '+pattern.short+' short questions · '+pattern.long+' descriptive questions</span><small>Questions follow the Karachi Board 20% / 40% / 40% structure and use the verified Karachi chapter list in Learnix. This is a practice resource, not an official board paper.</small></div><p class="err" id="paperError" role="alert" hidden></p><button class="btn btn-primary" id="paperGenerateBtn" type="submit">Generate Word paper '+ic('paper',16)+'</button><p class="paper-status" id="paperStatus" role="status" aria-live="polite"></p></form></section><aside class="card paper-info"><span class="paper-info-icon">✦</span><h2>Practice with a real exam feel.</h2><p>Choose your class and subject. Learnix will create a clean, printable .docx paper with board-aware topics and balanced question sections.</p><ul><li>Karachi Board syllabus chapters</li><li>Class 9 and Class 10 subjects</li><li>Optional AI answer key</li><li>Downloads directly to your device</li></ul></aside></section>';
}
function updatePaperPattern(){var subject=$('#paperSubject'),text=$('#paperPatternText');if(!subject||!text)return;var p=paperPatternUI(subject.value);text.textContent=p.mcq+' MCQs · '+p.short+' short questions · '+p.long+' descriptive questions';}
async function generatePaper(){
  var btn=$('#paperGenerateBtn'),err=$('#paperError'),status=$('#paperStatus');if(!btn)return;
  err.hidden=true;status.textContent='Generating your paper with Gemini…';btn.disabled=true;
  try{
    var token=window.learnixAuth.user?await window.learnixAuth.user.getIdToken():'';if(!token)throw new Error('Please sign in with Google again.');
    var resp=await fetch(chatApiUrl('/api/papers/generate'),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({classLevel:$('#paperClass').value,subject:$('#paperSubject').value,includeAnswerKey:$('#paperAnswerKey').checked})});
    if(!resp.ok){var raw=await resp.text(),data={};try{data=raw?JSON.parse(raw):{};}catch(_){ }throw new Error(data.error||'Paper generation failed (HTTP '+resp.status+').');}
    var blob=await resp.blob(),url=URL.createObjectURL(blob),a=document.createElement('a'),disposition=resp.headers.get('Content-Disposition')||'',match=/filename="([^"]+)"/i.exec(disposition);a.href=url;a.download=match?match[1]:'learnix-practice-paper.docx';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);status.textContent='Your Word paper is ready and downloading.';
  }catch(e){err.textContent=e.message||'Could not generate the paper. Please try again.';err.hidden=false;status.textContent='';}
  finally{btn.disabled=false;}
}
function keynotesHTML(){return '<section class="notes-app" id="notesApp"><aside class="notes-rail"><div class="notes-brand">'+ic('note',20)+'<span>Notebook</span></div><button class="notes-new" type="button" data-action="open-note">'+ic('plus',16)+' New note</button><label class="notes-search">'+ic('search',16)+'<input id="notesSearch" type="search" placeholder="Search notes…" aria-label="Search notes"></label><div class="notes-rail-label">LIBRARY</div><button class="notes-filter active" data-notes-filter="all">'+ic('files',16)+' All notes <span id="notesTotal">0</span></button><button class="notes-filter" data-notes-filter="pinned">'+ic('pin',16)+' Pinned</button><button class="notes-filter" data-notes-filter="favorites">'+ic('star',16)+' Favorites</button><button class="notes-filter" data-notes-filter="archived">'+ic('archive',16)+' Archived</button><div class="notes-rail-label">SORT BY</div><select id="notesSort" class="notes-sort" aria-label="Sort notes"><option value="edited">Recently edited</option><option value="created">Date created</option><option value="alpha">Alphabetical</option></select><div class="notes-rail-foot">Your notes sync with your Learnix account.</div></aside><section class="notes-list-pane"><div class="notes-list-head"><div><p class="eyebrow">YOUR STUDY NOTEBOOK</p><h1>Notes <span id="notesCount"></span></h1></div><button class="notes-icon-btn" data-action="open-note" aria-label="Create note" title="New note">'+ic('plus',18)+'</button></div><div id="notesList" class="notes-list"></div></section><section class="notes-detail" id="notesDetail"><div class="notes-preview-empty"><div class="notes-empty-mark">'+ic('note',26)+'</div><h2>Select a note</h2><p>Choose a note from your library or create a new one to get started.</p><button class="btn btn-primary" data-action="open-note">'+ic('plus',16)+' New note</button></div></section></section>'; }

var notesFilter='all',selectedNoteId=null,notesQuery='';
function noteDate(n){return n.updatedAt||n.createdAt||''}
function noteMeta(n){return (n.tags||[]).join(', ')}
function notesDashboardList(){
 var list=$('#notesList');if(!list)return;
 var notes=state.notes.filter(function(n){
  if(notesFilter==='pinned'&&!n.pinned)return false;
  if(notesFilter==='favorites'&&!n.favorite)return false;
  if(notesFilter==='archived'&&!n.archived)return false;
  if(notesFilter!=='archived'&&n.archived)return false;
  var q=notesQuery.toLowerCase();return !q||(n.title+' '+noteText(n.body||'')+' '+noteMeta(n)).toLowerCase().includes(q);
 });
 var sort=$('#notesSort')?$('#notesSort').value:'edited';
 notes.sort(function(a,b){if(sort==='alpha')return (a.title||'').localeCompare(b.title||'');if(sort==='created')return (b.createdAt||'').localeCompare(a.createdAt||'');return noteDate(b).localeCompare(noteDate(a));});
 $('#notesTotal').textContent=state.notes.filter(function(n){return !n.archived}).length;
 $('#notesCount').textContent=notes.length?'· '+notes.length:'';
 if(!notes.length){list.innerHTML='<div class="notes-empty-list"><div class="notes-empty-mark">'+ic('search',22)+'</div><b>'+(notesQuery?'No matching notes':'Your notebook is ready')+'</b><p>'+(notesQuery?'Try another search term.':'Create a note to collect ideas, class notes, and revision points.')+'</p>'+(notesQuery?'':'<button class="btn btn-primary" data-action="open-note">'+ic('plus',15)+' New note</button>')+'</div>';return;}
 list.innerHTML=notes.map(function(n){var preview=noteText(n.body||'').replace(/\s+/g,' ').trim();return '<button class="note-list-card'+(n.id===selectedNoteId?' selected':'')+'" data-action="select-note" data-id="'+esc(n.id)+'"><div class="note-card-top"><span>'+esc(n.subject||'General')+'</span><span class="note-card-icons">'+(n.pinned?ic('pin',13):'')+(n.favorite?ic('star',13):'')+'</span></div><b>'+esc(n.title||'Untitled note')+'</b><p>'+esc(preview||'No content yet')+'</p><div class="note-card-bottom"><span>'+esc((n.tags||[]).slice(0,2).join(' · '))+'</span><time>'+esc(formatNoteDate(noteDate(n)))+'</time></div></button>';}).join('');
}
function formatNoteDate(v){if(!v)return 'Just now';var d=new Date(v);return isNaN(d)?'Just now':d.toLocaleDateString(undefined,{month:'short',day:'numeric'});}
function renderNoteDetail(){
 var pane=$('#notesDetail');if(!pane)return;var n=state.notes.find(function(x){return x.id===selectedNoteId&&(notesFilter==='archived'?x.archived:!x.archived)});
 if(!n){pane.innerHTML='<div class="notes-preview-empty"><div class="notes-empty-mark">'+ic('note',26)+'</div><h2>Select a note</h2><p>Choose a note from your library or create a new one to get started.</p><button class="btn btn-primary" data-action="open-note">'+ic('plus',16)+' New note</button></div>';return;}
 pane.innerHTML='<div class="notes-detail-head"><div class="notes-detail-meta"><span>'+esc(n.subject||'General')+'</span><span>Updated '+esc(formatNoteDate(noteDate(n)))+'</span></div><div class="notes-detail-actions"><button class="notes-icon-btn" data-action="toggle-pin" data-id="'+esc(n.id)+'" title="'+(n.pinned?'Unpin':'Pin')+'" aria-label="'+(n.pinned?'Unpin':'Pin')+'">'+ic('pin',17)+'</button><button class="notes-icon-btn" data-action="toggle-favorite" data-id="'+esc(n.id)+'" title="Favorite" aria-label="Favorite">'+ic('star',17)+'</button><button class="notes-icon-btn" data-action="duplicate-note" data-id="'+esc(n.id)+'" title="Duplicate" aria-label="Duplicate">'+ic('copy',17)+'</button><button class="notes-icon-btn" data-action="archive-note" data-id="'+esc(n.id)+'" title="'+(n.archived?'Restore':'Archive')+'" aria-label="'+(n.archived?'Restore':'Archive')+'">'+ic('archive',17)+'</button><button class="notes-icon-btn" data-action="edit-note" data-id="'+esc(n.id)+'" title="Edit note" aria-label="Edit note">'+ic('edit',17)+'</button><button class="notes-icon-btn danger" data-action="del-note" data-id="'+esc(n.id)+'" title="Delete" aria-label="Delete">'+ic('trash',17)+'</button></div></div><article class="note-reading"><h1>'+esc(n.title||'Untitled note')+'</h1><div class="note-reading-tags">'+(n.tags||[]).map(function(tag){return '<span>'+esc(tag)+'</span>';}).join('')+'</div><div class="note-reading-body">'+cleanNote(n.body||'')+'</div></article>';
}
function renderNotesDashboard(){if(!selectedNoteId){var first=state.notes.find(function(n){return notesFilter==='archived'?n.archived:!n.archived});if(first)selectedNoteId=first.id;}notesDashboardList();renderNoteDetail();}
function renderKeynotes(){var el=$('#keynotesList');if(!el)return;if(!state.notes.length){el.innerHTML='<div class="empty"><b>No keynotes yet.</b><span>Create your first note with text, formatting, colors, and images.</span></div>';return;}el.innerHTML=state.notes.map(function(n){return '<article class="note keynote-row"><div class="body"><button class="note-toggle" type="button" data-action="edit-note" data-id="'+n.id+'"><b>'+esc(n.title)+'<span class="chip">'+esc(n.subject||'General')+'</span></b><p>'+esc(noteText(n.body||'')).slice(0,240)+'</p></button></div><button class="iconbtn" type="button" data-action="del-note" data-id="'+n.id+'" aria-label="Delete keynote">'+ic('trash',16)+'</button></article>';}).join('');}
function subjectCard(s){
  var n=(s.chapters||[]).length,done=subjDone(s),p=subjPct(s),c=pctClass(p,n);
  var rows=(s.chapters||[]).map(function(ch){
    return '<li class="chapter'+(ch.done?' done':'')+'"><button class="check" type="button" role="checkbox" aria-checked="'+!!ch.done+'" data-action="ch-toggle" data-sid="'+s.id+'" data-id="'+ch.id+'" aria-label="Mark completed: '+esc(s.name)+' '+esc(ch.name)+'">'+ic('check',13)+'</button><span>'+esc(ch.name)+'</span></li>';
  }).join('');
  return '<article class="card syllabus-card"><div class="card-head"><h2>'+esc(s.name)+'</h2><span class="chip '+(s.pending?'line':c[1])+'">'+(s.pending?'Needs verification':p+'% complete')+'</span></div>'+
    (s.pending?'<div class="syllabus-pending">'+esc(s.name==='Tarjuma Quran Majeed'?'Tarjuma Quran Majeed chapter/surah list needs to be added from the applicable official textbook.':SUBJECTS_PENDING_NOTE)+'</div>':
    '<div class="track" role="progressbar" aria-valuenow="'+p+'" aria-valuemin="0" aria-valuemax="100" aria-label="'+esc(s.name)+' progress"><span class="fill" style="width:'+p+'%"></span></div><p class="small muted" style="margin:8px 0 10px">'+done+' of '+n+' chapters completed ('+p+'%)</p>'+ (n?'<ul class="chapters">'+rows+'</ul>':'<div class="syllabus-pending">No verified chapter list available.</div>'))+'</article>';
}
function syllabusHTML(){
  var p=currentSetup(),done=0,total=0;
  (state.subjects||[]).forEach(function(s){if(!s.pending){done+=subjDone(s);total+=(s.chapters||[]).length;}});
  var pct=total?Math.round(done/total*100):0;
  return '<div class="page-head"><div><p class="eyebrow">Chapter tracker</p><h1>My <em>syllabus</em></h1><p class="sub">Mark a chapter completed when you finish it. Subject progress and overall completion update automatically.</p></div><button class="btn btn-line" type="button" data-action="change-setup">Change study setup</button></div>'+ 
  '<section class="card syllabus-overall"><div class="top"><div><p class="eyebrow">Selected curriculum</p><h2>'+esc(boardLabel(p.board))+' · Class '+esc(p.classLevel)+' · '+esc(groupLabel(p.group))+'</h2></div><strong>'+pct+'%</strong></div><div class="track" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100" aria-label="Overall syllabus completion"><span class="fill" style="width:'+pct+'%"></span></div><p class="small muted" style="margin-top:9px">'+done+' of '+total+' verified chapters completed. Subjects marked “Needs verification” are excluded until their chapter lists are confirmed.</p></section>'+ 
  '<div class="syllabus-toolbar"><span class="chip">'+state.subjects.length+' subjects in this setup</span><span class="small muted">Progress is saved to your account.</span></div><section class="syllabus-grid">'+state.subjects.map(subjectCard).join('')+'</section>';
}


/* ---------- Class 9–10 marks, GPA and matric projection ---------- */
var GPA_SUBJECTS=[
  {id:'maths',name:'Mathematics',max:75,required:true},
  {id:'urdu',name:'Urdu',max:75,required:true},
  {id:'english',name:'English',max:75,required:true},
  {id:'chemistry',name:'Chemistry',max:60,required:true},
  {id:'physics',name:'Physics',max:60,required:true},
  {id:'quranic-arabic',name:'Quranic Arabic',max:50,required:true},
  {id:'social',name:'Islamiat',max:100,required:true},
  {id:'biology',name:'Biology',max:60,required:false},
  {id:'computer',name:'Computer Science',max:60,required:false}
];
var PROJECTION_TARGETS=[95,90,85,80,75,70,60,50];
function activeGpaSubjects(){
  var p=currentSetup(),cls=$('#gpaClass')?$('#gpaClass').value:String(p.classLevel),list=[];
  if(p.group==='humanities'){
    list=[{id:'genmath',name:'General Mathematics',max:75},{id:'urdu',name:'Urdu',max:75},{id:'english',name:'English',max:75},{id:'genscience',name:'General Science',max:60}];
  }else{
    list=[{id:'maths',name:'Mathematics',max:75},{id:'urdu',name:'Urdu',max:75},{id:'english',name:'English',max:75},{id:'chemistry',name:'Chemistry',max:60},{id:'physics',name:'Physics',max:60}];
    var selected=(p.group==='computer'?'computer':($('#gpaOptional')?$('#gpaOptional').value:'biology'));
    list.push(selected==='computer'?{id:'computer',name:'Computer Science',max:60}:{id:'biology',name:'Biology',max:60});
  }
  list.push({id:'social',name:cls==='9'?'Islamiat':'Pakistan Studies',max:100});
  if(p.board==='federal')list.push({id:'quranic-arabic',name:'Tarjuma Quran Majeed',max:50});
  return list;
}
function gpaHTML(){
  var setup=currentSetup();
  var optionalField=setup.group==='humanities'?'':'<div class="field"><label for="gpaOptional">Science option (choose one)</label><select id="gpaOptional"><option value="biology" '+(setup.group==='biology'?'selected':'')+'>Biology (60 marks)</option><option value="computer" '+(setup.group==='computer'?'selected':'')+'>Computer Science (60 marks)</option></select></div>';
  return '<section class="gpa-page">'+
    '<div class="page-head"><div><p class="eyebrow">Academic tools</p><h1>Marks &amp; <em>GPA calculator</em></h1><p class="sub">Enter your subject marks using the correct maximum marks for Class 9 or Class 10.</p></div></div>'+
    '<div class="gpa-layout"><section class="card"><div class="card-head"><h2>Student results</h2><span class="chip">Classes 9–10</span></div>'+
    '<div class="gpa-top-fields"><div class="field"><label for="gpaClass">Class</label><select id="gpaClass"><option value="9" '+(String(setup.classLevel)==='9'?'selected':'')+'>Class 9</option><option value="10" '+(String(setup.classLevel)==='10'?'selected':'')+'>Class 10</option></select></div>'+optionalField+'</div>'+
    '<p class="gpa-help">For board-specific subject totals, verify the applicable scheme of studies. Class 9 uses Islamiat and Class 10 uses Pakistan Studies in this Learnix setup.</p>'+
    '<div class="gpa-subjects" id="gpaSubjects"></div><div class="gpa-actions"><button class="btn btn-primary" type="button" data-action="gpa-calculate">Calculate result</button><button class="btn btn-line" type="button" data-action="gpa-reset">Reset</button></div><p id="gpaError" class="err" role="alert" hidden></p></section>'+
    '<aside class="card gpa-result" aria-live="polite"><p class="eyebrow">Your result</p><p class="gpa-number" id="gpaNumber">—</p><p class="muted">Estimated GPA out of 4.00</p><div class="gpa-divider"></div><div class="gpa-result-row"><span>Marks obtained</span><strong id="gpaMarks">—</strong></div><div class="gpa-result-row"><span>Total marks</span><strong id="gpaTotal">—</strong></div><div class="gpa-result-row"><span>Percentage</span><strong id="gpaAverage">—</strong></div><div class="gpa-progress-track" role="progressbar" id="gpaProgress" aria-label="Overall percentage" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"><span id="gpaProgressFill"></span></div><p class="gpa-progress-label" id="gpaProgressLabel">Enter marks to calculate your percentage.</p><div class="gpa-result-row"><span>Overall grade</span><strong id="gpaGrade">—</strong></div><div class="gpa-result-row"><span>Subjects included</span><strong id="gpaCount">8</strong></div><p class="gpa-disclaimer">Percentage is calculated from entered marks and maximum marks. GPA is an illustrative estimate, not an official board conversion. Each subject requires at least 45% to pass.</p></aside></div>'+
    '<section class="card projection-card"><div class="card-head"><div><p class="eyebrow">Matric planning</p><h2>What do I need in Class 10?</h2></div><span class="chip">Equal weighting</span></div><p class="sub projection-intro">Enter your Class 9 percentage. The calculator assumes Class 9 and Class 10 percentages contribute equally to the final matric average.</p><div class="projection-input"><div class="field"><label for="class9Percent">Class 9 percentage</label><input id="class9Percent" type="number" min="0" max="100" step="0.1" placeholder="e.g. 70"></div><button class="btn btn-primary" type="button" data-action="projection-calculate">Calculate Class 10 target</button></div><p id="projectionError" class="err" role="alert" hidden></p><div class="projection-table-wrap"><table class="projection-table"><thead><tr><th>Target matric average</th><th>Needed in Class 10</th><th>Result</th></tr></thead><tbody id="projectionRows"><tr><td colspan="3">Enter your Class 9 percentage to see the targets.</td></tr></tbody></table></div><p class="gpa-disclaimer">Required Class 10 percentage = (2 × target overall percentage) − Class 9 percentage. A requirement above 100% is not achievable under this equal-weight assumption; below 50% is marked as fail per your rule.</p></section></section>';
}
function initGPA(){
  var box=$('#gpaSubjects');if(!box)return;
  box.innerHTML=activeGpaSubjects().map(function(s){return '<div class="gpa-subject" data-subject="'+s.id+'"><label for="mark-'+s.id+'">'+esc(s.name)+' <span class="muted">(max '+s.max+')</span></label><div class="gpa-mark-wrap"><input id="mark-'+s.id+'" type="number" min="0" max="'+s.max+'" step="0.5" inputmode="decimal" placeholder="0–'+s.max+'" aria-label="'+esc(s.name)+' marks out of '+s.max+'"><span>/ '+s.max+'</span></div></div>';}).join('');
  updateGPAOptional();
}
function updateGPAOptional(){var cls=$('#gpaClass');var social=document.querySelector('[data-subject="social"]');if(social){var label=social.querySelector('label');if(label)label.innerHTML=(cls&&cls.value==='10'?'Pakistan Studies':'Islamiat')+' <span class="muted">(max 100)</span>';}var count=$('#gpaCount');if(count)count.textContent=String(activeGpaSubjects().length);}
function gradePoint(mark){if(mark>=90)return {grade:'A+',point:4};if(mark>=80)return {grade:'A',point:3.7};if(mark>=70)return {grade:'B',point:3};if(mark>=60)return {grade:'C',point:2};if(mark>=50)return {grade:'D',point:1};return {grade:'F',point:0};}
function calculateGPA(){
  var err=$('#gpaError');err.hidden=true;var used=activeGpaSubjects(),obtained=0,total=0,points=0,failed=false;
  for(var i=0;i<used.length;i++){var sub=used[i],input=$('#mark-'+sub.id),raw=input&&input.value;if(raw===''||raw===null||raw===undefined||!isFinite(Number(raw))||Number(raw)<0||Number(raw)>sub.max){err.textContent='Enter a mark from 0 to '+sub.max+' for '+sub.name+'.';err.hidden=false;if(input)input.focus();return;}var mark=Number(raw);obtained+=mark;total+=sub.max;points+=gradePoint(mark/sub.max*100).point;}
  var pct=obtained/total*100,gpa=gradePoint(pct).point;failed=used.some(function(sub){var inp=$('#mark-'+sub.id);return Number(inp.value)/sub.max*100<45;});
  $('#gpaNumber').textContent=gpa.toFixed(2);$('#gpaMarks').textContent=obtained.toFixed(1).replace(/\.0$/,'');$('#gpaTotal').textContent=String(total);$('#gpaAverage').textContent=pct.toFixed(2)+'%';$('#gpaGrade').textContent=failed?'Fail (subject below 45%)':gradePoint(pct).grade;$('#gpaCount').textContent=String(used.length);
  var fill=$('#gpaProgressFill'),track=$('#gpaProgress');if(fill)fill.style.width=Math.max(0,Math.min(100,pct))+'%';if(track)track.setAttribute('aria-valuenow',pct.toFixed(2));$('#gpaProgressLabel').textContent=pct.toFixed(2)+'% overall · '+(failed?'Fail (at least one subject below 45%)':'Pass');
  var projection=$('#class9Percent');if(projection&&$('#gpaClass').value==='9')projection.value=pct.toFixed(2);
  calculateProjection(false);
}
function resetGPA(){activeGpaSubjects().forEach(function(s){var el=$('#mark-'+s.id);if(el)el.value='';});$('#gpaError').hidden=true;$('#gpaNumber').textContent='—';$('#gpaMarks').textContent='—';$('#gpaTotal').textContent='—';$('#gpaAverage').textContent='—';$('#gpaGrade').textContent='—';$('#gpaCount').textContent=String(activeGpaSubjects().length);$('#gpaProgressFill').style.width='0%';$('#gpaProgress').setAttribute('aria-valuenow','0');$('#gpaProgressLabel').textContent='Enter marks to calculate your percentage.';}
function calculateProjection(showError){var input=$('#class9Percent'),err=$('#projectionError'),body=$('#projectionRows');if(!input||!body)return;var raw=input.value;if(raw===''||!isFinite(Number(raw))||Number(raw)<0||Number(raw)>100){if(showError){err.textContent='Enter a Class 9 percentage from 0 to 100.';err.hidden=false;input.focus();}return;}err.hidden=true;var c9=Number(raw);body.innerHTML=PROJECTION_TARGETS.map(function(target){var need=2*target-c9,result,display;if(need>100){display=need.toFixed(1)+'%';result='Not achievable (over 100%)';}else if(need<=0){display='0%';result='Target already secured';}else{display=need.toFixed(1)+'%';result=need<50?'Mathematically possible; below 50% would fail under your rule':'Possible';}return '<tr><td>'+target+'%</td><td><strong>'+display+'</strong></td><td>'+result+'</td></tr>';}).join('');}

var SOON={
  'gpa-calculator':['GPA Calculator','Enter your marks for each subject to see your grade and GPA in one place.','The calculator is still being set up. Your subject progress on the dashboard shows where you stand until it is ready.'],
  'coming-soon':['Coming soon','New Learnix tools are being prepared.','This area will be updated with more study resources in a future release.']
};
function soonHTML(v){var s=SOON[v];return '<section class="card soon"><p class="eyebrow">Coming soon</p><h2>'+s[0]+'</h2><p>'+s[1]+'</p><p class="muted">'+s[2]+'</p><a class="btn btn-primary" href="#dashboard">Back to dashboard</a></section>'}

function renderView(){
  if(!cloudReady)return;
  var v=currentView();paintNav();closeCreate();closeProfile();
  $('#view').innerHTML=v==='dashboard'?dashboardHTML():v==='tests'?'<div id="learnixTestsRoot"></div>':v==='feedback'?'<div id="learnixFeedbackRoot"></div>':v==='syllabus'?syllabusHTML():v==='coming-soon'?coursesHTML():v==='keynotes'?keynotesHTML():v==='chatbot'?chatHTML():v==='paper-generator'?paperHTML():v==='gpa-calculator'?gpaHTML():soonHTML(v);
  if(v==='dashboard'){renderStats();renderChart();paintTimer(true);renderSubjects();renderDayTabs();renderTimetable();renderDeadlines();renderGoals()}
  if(v==='tests'&&window.learnixTests)window.learnixTests.render();
  if(v==='feedback'&&window.learnixFeedback)window.learnixFeedback.render();
  if(v==='syllabus'){}
  if(v==='keynotes')renderNotesDashboard();
  if(v==='chatbot')chatAfterRender();
  if(v==='paper-generator'){
    var paperSubject=$('#paperSubject'),paperSubjects=paperSubjectOptions($('#paperClass').value);
    if(paperSubject&&paperSubjects.indexOf(paperSubject.value)<0)paperSubject.value=paperSubjects[0]||'';
    updatePaperPattern();
  }
  if(v==='gpa-calculator')initGPA();
  paintProfile();
  if(!state.onboarding)showOnboarding();else hideOnboarding();
}
function renderCourses(){if(currentView()==='syllabus'){$('#view').innerHTML=syllabusHTML();}else if(currentView()==='dashboard'){renderSubjects();renderStats();}}

/* ---------- dashboard sections ---------- */
function renderStats(){
  var el=$('#stats');if(!el)return;
  var done=0,total=0;state.subjects.forEach(function(s){if(!s.pending){done+=subjDone(s);total+=(s.chapters||[]).length;}});
  var pct=total?Math.round(done/total*100):0;
  var secs=weekStudiedSec(),b=big(secs),sk=streakInfo();
  var skSub=sk.todayDone?'Best so far: '+sk.best+(sk.best===1?' day':' days'):sk.cur>0?'Study 10 min today to keep it going':'Study 10 min to start a streak';
  var open=state.deadlines.filter(function(d){return !d.done});
  var soon=open.filter(function(d){var n=daysUntil(d.due);return n>=0&&n<=6});
  var over=open.filter(function(d){return daysUntil(d.due)<0});
  var next=open.filter(function(d){return daysUntil(d.due)>=0}).sort(byDue)[0];
  var dlSub=(over.length?over.length+' overdue. ':'')+(next?'Next: '+esc(next.title)+', '+fmtDate(next.due):'Nothing coming up');
  el.innerHTML=
  '<article class="card dark stat"><p class="stat-label">'+ic('book',15)+'Syllabus covered</p><p class="stat-val">'+pct+'<span>%</span></p><div class="track"><span class="fill" style="width:'+pct+'%"></span></div><p class="stat-sub">'+done+' of '+total+' verified chapters completed</p></article>'+
  '<article class="card stat"><p class="stat-label">'+ic('flame',15)+'Day streak</p><p class="stat-val">'+sk.cur+'</p><p class="stat-sub">'+skSub+'</p></article>'+
  '<article class="card stat"><p class="stat-label">'+ic('clock',15)+'Studied this week</p><p class="stat-val">'+b.v+'<span>'+b.u+'</span></p><div class="track"><span class="fill" style="width:'+Math.min(100,secs/3600/WEEK_GOAL*100)+'%"></span></div><p class="stat-sub">of your '+WEEK_GOAL+'h goal</p></article>'+
  '<article class="card stat"><p class="stat-label">'+ic('cal',15)+'Due in 7 days</p><p class="stat-val">'+soon.length+'</p><p class="stat-sub">'+dlSub+'</p></article>';
}
function renderChart(){
  var el=$('#chart');if(!el)return;
  var keys=weekKeys(),ti=todayIdx();
  var vals=keys.map(function(k,i){return i<=ti?studied(k)/3600:plannedHours(i)});
  var top=Math.max(4,2*Math.ceil(Math.max.apply(null,vals)/2)),px=160/top;
  var lines=[0,top/2,top].map(function(h){return '<div class="grid-line" style="bottom:'+(h*px)+'px"><span>'+h+'h</span></div>'}).join('');
  var cols=vals.map(function(v,i){
    var c=i<ti?'past':i===ti?'today':'plan';
    var label=v<=0?(i>ti?'–':'0'):fmtShort(v*3600);
    return '<div class="col '+c+'"><span class="val">'+label+'</span><span class="bar" style="height:'+Math.max(4,v*px).toFixed(1)+'px"></span></div>';
  }).join('');
  var days=DAYS.map(function(d,i){return '<span'+(i===ti?' class="today"':'')+'>'+d+'</span>'}).join('');
  el.innerHTML='<div class="plot" role="img" aria-label="Study time for each day this week">'+lines+'<div class="cols">'+cols+'</div></div><div class="days">'+days+'</div>'+
  '<div class="legend"><span><i style="background:var(--bar)"></i>Studied</span><span><i style="background:var(--ink)"></i>Today</span><span><i style="background:repeating-linear-gradient(135deg,var(--hatch) 0 2px,transparent 2px 5px);border:1px solid var(--hatch)"></i>Planned in timetable</span>'+
  '</div>';
  $('#weekTotal').textContent=fmtShort(weekStudiedSec())+' of '+WEEK_GOAL+'h';
}
function refreshStudy(){renderStats();renderChart()}
function renderSubjects(){
  var el=$('#subjects');if(!el)return;
  el.innerHTML=state.subjects.map(function(s){
    if(s.pending)return '<div class="subject"><div class="top"><b>'+esc(s.name)+'</b><span class="chip line">Needs verification</span></div><p class="small muted">'+esc(SUBJECTS_PENDING_NOTE)+'</p></div>';
    var n=s.chapters.length,p=subjPct(s),c=pctClass(p,n);
    var revise=c[1]==='warn'?'<a class="btn btn-line btn-sm" href="#syllabus">Review chapters</a>':'';
    return '<div class="subject"><div class="top"><b>'+esc(s.name)+'</b><span>'+p+'%</span></div><div class="track" role="progressbar" aria-valuenow="'+p+'" aria-valuemin="0" aria-valuemax="100" aria-label="'+esc(s.name)+' progress"><span class="fill" style="width:'+p+'%"></span></div><div class="bot"><span>'+subjDone(s)+' of '+n+' chapters</span><span class="r">'+revise+'<span class="chip '+c[1]+'">'+c[0]+'</span></span></div></div>';
  }).join('');
}
function renderDayTabs(){
  var el=$('#dayTabs');if(!el)return;
  el.innerHTML=DAYS.map(function(d,i){return '<button class="daytab" type="button" data-action="day" data-day="'+i+'" aria-pressed="'+(i===selDay)+'" aria-label="'+DAYS_LONG[i]+'">'+d+'</button>'}).join('');
}
function renderTimetable(){
  var el=$('#timetable');if(!el)return;
  var items=state.slots.filter(function(s){return s.day===selDay}).sort(function(a,b){return a.start<b.start?-1:1});
  if(!items.length){el.innerHTML='<div class="empty"><b>Nothing planned for '+DAYS_LONG[selDay]+'.</b><span>Choose Create, then Study timetable, to add your first study block for this day.</span></div>';return}
  el.innerHTML=items.map(function(s){return '<div class="slot"><span class="t">'+range(s.start,s.end)+'</span><span><b>'+esc(s.subject)+'</b><small>'+esc(s.topic)+'</small></span><button class="iconbtn" type="button" data-action="del-slot" data-id="'+s.id+'" aria-label="Remove '+esc(s.subject)+' block">'+ic('x',16)+'</button></div>'}).join('');
}
function dueLabel(iso){
  var n=daysUntil(iso);
  if(n<0)return 'Overdue by '+(-n)+(n===-1?' day':' days');
  if(n===0)return 'Due today';if(n===1)return 'Due tomorrow';
  return 'Due in '+n+' days';
}
function renderDeadlines(){
  var el=$('#deadlines');if(!el)return;
  var open=state.deadlines.filter(function(d){return !d.done}).sort(byDue);
  var done=state.deadlines.filter(function(d){return d.done}).sort(byDue).slice(-2);
  $('#dlCount').textContent=open.length+' open';
  if(!state.deadlines.length){el.innerHTML='<div class="empty"><b>No deadlines yet.</b><span>Choose Create, then Deadline, to add your first assignment, test or essay.</span></div>';return}
  var shown=open.slice(0,6).concat(done);
  el.innerHTML=shown.map(function(d){
    var n=daysUntil(d.due),cls=d.done?' done':n<0?' overdue':n<=2?' soon':'';
    return '<div class="due'+cls+'"><button class="check" type="button" role="checkbox" aria-checked="'+d.done+'" data-action="dl-toggle" data-id="'+d.id+'" aria-label="Mark deadline done: '+esc(d.title)+'">'+ic('check',13)+'</button><span class="tx"><b>'+esc(d.title)+'</b><small>'+esc(d.subject)+' · '+fmtDate(d.due)+(d.done?'':' · '+dueLabel(d.due))+'</small></span><span class="chip '+(d.type==='Test'?'solid':'line')+'">'+esc(d.type)+'</span><button class="iconbtn" type="button" data-action="dl-del" data-id="'+d.id+'" aria-label="Delete deadline '+esc(d.title)+'">'+ic('x',16)+'</button></div>';
  }).join('')+(open.length>6?'<p class="small muted" style="margin-top:8px">+'+(open.length-6)+' more open deadlines</p>':'');
}
function renderNotes(){var el=$('#notes');if(!el)return;if(!state.notes.length){el.innerHTML='<div class="empty"><b>No key notes yet.</b><span>Choose Create, then Key notes, to save the formulas and definitions you want to revise.</span></div>';return}el.innerHTML=state.notes.map(function(n){return '<div class="note"><div class="body"><button class="note-toggle" type="button" data-action="edit-note" data-id="'+n.id+'"><b>'+esc(n.title)+'<span class="chip">'+esc(n.subject)+'</span></b><p>'+esc(noteText(n.body||'')).slice(0,220)+'</p></button></div><button class="iconbtn" type="button" data-action="del-note" data-id="'+n.id+'" aria-label="Delete note">'+ic('trash',16)+'</button></div>'}).join('');}
function noteText(html){var d=document.createElement('div');d.innerHTML=html;return d.textContent||d.innerText||'';}
function cleanNote(html){var d=document.createElement('div');d.innerHTML=html||'';d.querySelectorAll('script,style,iframe,object,embed,form').forEach(function(x){x.remove()});d.querySelectorAll('*').forEach(function(el){Array.from(el.attributes).forEach(function(a){if(/^on/i.test(a.name)||((a.name==='href'||a.name==='src')&&!/^(https?:|mailto:|data:image\/(png|jpeg|webp|gif);base64,)/i.test(a.value)))el.removeAttribute(a.name)});});return d.innerHTML;}
function renderGoals(){
  var el=$('#goalList');if(!el)return;
  var done=state.goals.filter(function(g){return g.done}).length,total=state.goals.length,today=todayKey();
  $('#goalCount').textContent=done+' of '+total+' done';
  $('#goalSum').innerHTML=total?'<div class="track"><span class="fill" style="width:'+(done/total*100)+'%"></span></div>':'';
  if(!total){el.innerHTML='<div class="empty"><b>No goals yet.</b><span>Add one above and tick it off when it is done.</span></div>';return}
  el.innerHTML=state.goals.map(function(g){
    var over=!g.done&&g.due&&g.due<today;
    return '<li class="goal'+(g.done?' done':'')+'"><button class="check" type="button" role="checkbox" aria-checked="'+g.done+'" data-action="goal-toggle" data-id="'+g.id+'" aria-label="Mark goal done: '+esc(g.text)+'">'+ic('check',13)+'</button><div class="gt"><b>'+esc(g.text)+'</b><div class="meta"><span class="chip">'+esc(g.subject)+'</span>'+(g.due?'<span class="chip '+(over?'crit':'line')+'">'+(over?'Overdue · ':'')+fmtDate(g.due)+'</span>':'')+'</div></div><button class="iconbtn" type="button" data-action="goal-del" data-id="'+g.id+'" aria-label="Remove goal">'+ic('x',16)+'</button></li>';
  }).join('');
}

/* ---------- focus timer (focus minutes are added to today's study log) ---------- */
var timer={mode:25,left:25*60,running:false,id:null,finished:false,endAt:0,last:0,ticks:0};
function paintTimer(rebuildModes){
  var clock=$('#timerClock');if(!clock)return;
  if(rebuildModes){$('#timerModes').innerHTML=[[25,'Focus 25'],[5,'Break 5']].map(function(m){return '<button type="button" data-action="timer-mode" data-mins="'+m[0]+'" aria-pressed="'+(timer.mode===m[0])+'">'+m[1]+' min</button>'}).join('')}
  var m=Math.floor(timer.left/60),s=timer.left%60;
  clock.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  $('#timerState').textContent=timer.finished?(timer.mode===25?'Session complete. Take a 5 minute break.':'Break over. Ready for another session?'):timer.running?(timer.mode===25?'Focus session running.':'Break running.'):(timer.mode===25?'Focus time is added to your study hours.':'Breaks are not counted as study time.');
  $('#timerToday').textContent='Studied today: '+fmtLong(studied(todayKey()));
  var b=$('#timerToggle');b.innerHTML=timer.running?ic('pause',18):ic('play',18);b.setAttribute('aria-label',timer.running?'Pause timer':'Start timer');
}
function timerStop(){clearInterval(timer.id);timer.running=false;save();refreshStudy()}
function timerTick(){
  var now=Date.now(),prev=timer.left;
  var left=Math.max(0,Math.ceil((timer.endAt-now)/1000));
  var credit=Math.min((now-timer.last)/1000,prev);       /* real elapsed time, so background tabs still count */
  timer.last=now;
  if(timer.mode===25&&credit>0){var k=todayKey();state.log[k]=(state.log[k]||0)+credit}
  timer.left=left;
  if(left<=0){
    timerStop();timer.finished=true;
    toast(timer.mode===25?'Focus session complete. The time is added to today.':'Break over.');
  }else{
    timer.ticks++;
    if(timer.ticks%10===0)save();
    if(timer.ticks%30===0)refreshStudy();
  }
  paintTimer();
}
function timerToggle(){
  if(timer.running){timerTick();if(timer.running)timerStop()}
  else{
    if(timer.left<=0)timer.left=timer.mode*60;
    timer.finished=false;timer.endAt=Date.now()+timer.left*1000;timer.last=Date.now();timer.running=true;
    timer.id=setInterval(timerTick,1000);
  }
  paintTimer();
}
function timerReset(){if(timer.running)timerTick();timerStop();timer.finished=false;timer.left=timer.mode*60;paintTimer()}
function timerMode(m){if(timer.running)timerTick();timerStop();timer.mode=m;timer.finished=false;timer.left=m*60;paintTimer(true)}

/* ---------- menus ---------- */
function closeCreate(){var m=$('#createMenu'),b=$('#createBtn');if(m){m.hidden=true;b.setAttribute('aria-expanded','false')}}
function closeProfile(){var p=$('#profilePop');if(p){p.hidden=true;$('#profileBtn').setAttribute('aria-expanded','false')}}
function toggleCreate(){var m=$('#createMenu'),b=$('#createBtn');var open=m.hidden;closeProfile();m.hidden=!open;b.setAttribute('aria-expanded',String(open));if(open){var f=m.querySelector('.menu-item');if(f)f.focus()}}
function toggleProfile(){var p=$('#profilePop'),b=$('#profileBtn');var open=p.hidden;closeCreate();p.hidden=!open;b.setAttribute('aria-expanded',String(open));if(open){$('#pfName').value=state.profile.name||'';$('#pfErr').hidden=true;$('#pfName').focus()}}

/* ---------- modals ---------- */
var lastFocus=null;
function openModal(html,focusId){
  lastFocus=document.activeElement;
  $('#modalRoot').innerHTML='<div class="scrim'+(html.indexOf('id="note-form"')>=0?' note-editor-scrim':'')+'"><div class="sheet'+(html.indexOf('id="note-form"')>=0?' note-editor-sheet':'')+'" role="dialog" aria-modal="true" aria-labelledby="mTitle">'+html+'</div></div>';
  var f=$(focusId);if(f)f.focus();var lang=$('#nLanguage');if(lang&&lang.dataset.noteLanguage)lang.value=lang.dataset.noteLanguage;
}
function closeModal(){var form=$('#note-form');if(form&&form.dataset.dirty==='true'&&!confirm('Discard unsaved changes?'))return;clearTimeout(noteAutosaveTimer);$('#modalRoot').innerHTML='';if(lastFocus&&lastFocus.focus){try{lastFocus.focus()}catch(e){}}}
function subjectSelect(id,selected){return '<select id="'+id+'">'+SUBJECT_OPTIONS.map(function(s){return '<option'+(s===selected?' selected':'')+'>'+s+'</option>'}).join('')+'</select>'}
function closeBtn(){return '<button class="iconbtn" type="button" data-action="close-modal" aria-label="Close">'+ic('x',18)+'</button>'}
function openNote(pre){
 closeCreate();var n=pre&&pre.id?state.notes.find(function(x){return x.id===pre.id}):null;
 var original=n?JSON.stringify({title:n.title,body:n.body,subject:n.subject,language:n.language}):'';
 openModal('<header><div><h2 id="mTitle">'+(n?'Edit note':'New note')+'</h2><p>Capture ideas without distractions. Changes save to your Learnix account.</p></div>'+closeBtn()+'</header><form id="note-form" novalidate><div class="note-editor-top"><input id="nTitle" maxlength="120" value="'+esc(n?n.title:(pre&&pre.title||''))+'" placeholder="Untitled note" aria-label="Note title"><div class="note-editor-meta"><span id="noteSaveStatus">Saved</span><span id="noteStats">0 words · 0 characters · 0 min read</span></div></div><div class="note-toolbar" role="toolbar" aria-label="Text formatting"><button type="button" data-format="undo" title="Undo (Ctrl+Z)" aria-label="Undo">'+ic('undo',16)+'</button><button type="button" data-format="redo" title="Redo (Ctrl+Y)" aria-label="Redo">'+ic('redo',16)+'</button><span class="toolbar-sep"></span><select id="noteBlock" aria-label="Text style"><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Quote</option></select><select id="noteSize" aria-label="Font size"><option value="3">12</option><option value="4" selected>14</option><option value="5">18</option><option value="6">24</option><option value="7">32</option></select><select id="noteFont" aria-label="Font family"><option value="Georgia">Georgia</option><option value="Arial">Arial</option><option value="Verdana">Verdana</option><option value="Tahoma">Tahoma</option><option value="Trebuchet MS">Trebuchet</option><option value="Times New Roman">Times New Roman</option><option value="Courier New">Courier</option></select><button type="button" data-format="bold" title="Bold (Ctrl+B)"><b>B</b></button><button type="button" data-format="italic" title="Italic (Ctrl+I)"><i>I</i></button><button type="button" data-format="underline" title="Underline (Ctrl+U)"><u>U</u></button><button type="button" data-format="insertUnorderedList" title="Bulleted list">'+ic('list',16)+'</button><button type="button" data-format="insertOrderedList" title="Numbered list">'+ic('list-ordered',16)+'</button><button type="button" data-format="justifyLeft" title="Align left">'+ic('align-left',16)+'</button><button type="button" data-format="justifyCenter" title="Align center">'+ic('align-center',16)+'</button><button type="button" data-format="justifyRight" title="Align right">'+ic('align-right',16)+'</button><button type="button" data-action="note-link" title="Insert link">'+ic('link',16)+'</button><span class="toolbar-sep"></span><div class="note-palette-wrap"><button type="button" class="palette-trigger" data-action="toggle-palette" data-palette="text" title="Text colour" aria-label="Text colour"><span class="palette-dot text-dot"></span></button><div class="note-palette" id="textPalette" hidden>'+['#252525','#64748b','#dc2626','#ea580c','#ca8a04','#16a34a','#0891b2','#2563eb','#7c3aed','#db2777'].map(function(c){return '<button class="palette-color" style="--swatch:'+c+'" data-action="apply-color" data-color="'+c+'" data-kind="text" title="'+c+'" aria-label="Text colour '+c+'"></button>';}).join('')+'</div></div><div class="note-palette-wrap"><button type="button" class="palette-trigger" data-action="toggle-palette" data-palette="highlight" title="Highlight colour" aria-label="Highlight colour"><span class="palette-dot highlight-dot"></span></button><div class="note-palette" id="highlightPalette" hidden>'+['#fff2a8','#fde68a','#fecaca','#fed7aa','#bbf7d0','#bae6fd','#c7d2fe','#e9d5ff','#fbcfe8','#e5e7eb'].map(function(c){return '<button class="palette-color" style="--swatch:'+c+'" data-action="apply-color" data-color="'+c+'" data-kind="highlight" title="'+c+'" aria-label="Highlight colour '+c+'"></button>';}).join('')+'</div></div><button type="button" data-format="removeFormat" title="Clear formatting">'+ic('eraser',16)+'</button><button type="button" data-action="note-image" title="Insert image">'+ic('image',16)+'</button><input id="noteImageInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></div><div class="field note-body-field"><div id="nBody" class="note-editor" contenteditable="true" role="textbox" aria-label="Note content" aria-multiline="true" data-placeholder="Start writing…">'+cleanNote(n?n.body:(pre&&pre.body||''))+'</div></div><div class="note-editor-footer"><label>Subject '+subjectSelect('nSubject',n?n.subject:(pre&&pre.subject||'Physics'))+'</label><label>Language <select id="nLanguage"><option>English</option><option>Urdu</option><option>Arabic</option><option>Other</option></select></label><label>Tags <input id="nTags" placeholder="Add tags, separated by commas" value="'+esc((n&&n.tags||[]).join(', '))+'"></label><span class="autosave-inline" id="noteAutosave">Autosave enabled</span></div><p class="err" id="nErr" role="alert" hidden></p><div class="actions"><button class="btn btn-line" type="button" data-action="close-note-editor">Cancel</button><button class="btn btn-primary" type="submit">Save note</button></div></form>','#nTitle');
 $('#note-form').dataset.editId=n?n.id:'';$('#note-form').dataset.original=original;$('#nLanguage').value=n&&n.language||'English';
 updateNoteStats();setupNoteAutosave();
}
function openSlot(subject){
  closeCreate();
  openModal('<header><div><h2 id="mTitle">Add to timetable</h2><p>Plan one study block. You can add as many as you need.</p></div>'+closeBtn()+'</header>'+
  '<form id="slot-form" novalidate>'+
    '<div class="two"><div class="field"><label for="sSubject">Subject</label>'+subjectSelect('sSubject',subject||'Mathematics')+'</div>'+
    '<div class="field"><label for="sDay">Day</label><select id="sDay">'+DAYS_LONG.map(function(d,i){return '<option value="'+i+'"'+(i===selDay?' selected':'')+'>'+d+'</option>'}).join('')+'</select></div></div>'+
    '<div class="field"><label for="sTopic">What will you study?</label><input id="sTopic" type="text" maxlength="80" placeholder="Chapter 6 revision"></div>'+
    '<div class="two"><div class="field"><label for="sStart">From</label><input id="sStart" type="time" value="16:00"></div><div class="field"><label for="sEnd">To</label><input id="sEnd" type="time" value="17:00"></div></div>'+
    '<p class="err" id="sErr" role="alert" hidden></p>'+
    '<div class="actions"><button class="btn btn-line" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Add to timetable</button></div>'+
  '</form>','#sTopic');
}
function openDeadline(){
  closeCreate();
  openModal('<header><div><h2 id="mTitle">New deadline</h2><p>Add the date and Learnix will count down to it.</p></div>'+closeBtn()+'</header>'+
  '<form id="deadline-form" novalidate>'+
    '<div class="field"><label for="dTitle">What is due?</label><input id="dTitle" type="text" maxlength="80" placeholder="Chemistry lab journal"></div>'+
    '<div class="two"><div class="field"><label for="dType">Type</label><select id="dType"><option>Assignment</option><option>Test</option><option>Essay</option><option>Project</option></select></div>'+
    '<div class="field"><label for="dSubject">Subject</label>'+subjectSelect('dSubject','Mathematics')+'</div></div>'+
    '<div class="field"><label for="dDate">Due date</label><input id="dDate" type="date" value="'+dateKey(addDays(new Date(),1))+'"></div>'+
    '<p class="err" id="dErr" role="alert" hidden></p>'+
    '<div class="actions"><button class="btn btn-line" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Add deadline</button></div>'+
  '</form>','#dTitle');
}
function showErr(id,msg){var e=$(id);e.textContent=msg;e.hidden=false}

/* ---------- persistent, authenticated Learnix AI chat ---------- */
var chat={convs:[],activeId:null,loaded:false},draft={text:'',files:[],thumbs:[]},blobs={};
function imgCfg(){return {max:4,bytes:10*1024*1024,types:['image/jpeg','image/png','image/webp','image/gif']};}
function chatSave(c){if(c&&window.learnixAuth&&window.learnixAuth.user)window.learnixAuth.saveChat(c).catch(function(e){toast('Chat save failed: '+(e.message||'Please retry.'));});}
function activeConv(){return chat.convs.find(function(c){return c.id===chat.activeId})||null;}
async function loadChats(){if(chat.loaded||!window.learnixAuth||!window.learnixAuth.user)return;try{var rows=await window.learnixAuth.listChats();chat.convs=rows.map(function(c){return {id:c.id,title:c.title||'New chat',messages:Array.isArray(c.messages)?c.messages:[]}});chat.activeId=chat.convs.length?chat.convs[0].id:null;chat.loaded=true;if(currentView()==='chatbot')paintChat();}catch(e){toast('Could not load saved chats.');}}
function chatHTML(){return '<section class="chat-shell" id="chatShell"><aside class="chat-list" aria-label="Chats"><button class="btn btn-primary" type="button" data-action="chat-new">'+ic('plus',16)+'New chat</button><div class="convs" id="convs"></div><div class="privacy">'+ic('lock',15)+'<span>Your chats are saved to your Google account.</span></div><button class="linkbtn" id="clearAll" type="button" data-action="chat-clear-all">Clear chats</button></aside><div class="chat-main" id="chatMain"><div class="chat-head"><div class="ch-l"><button class="iconbtn list-toggle" type="button" data-action="chat-toggle-list" aria-label="Show chats">'+ic('menu',18)+'</button><h2 id="chatTitle">'+esc(firstName())+'’s Learnix AI</h2></div></div><div class="chat-scroll" id="chatScroll"><div class="thread" id="thread"></div></div><div class="composer-wrap"><form class="composer" id="composer" novalidate><div class="draft-thumbs" id="draftThumbs"></div><textarea id="chatInput" rows="1" maxlength="12000" aria-label="Draft a message" placeholder="Ask Learnix a study question…"></textarea><div class="row-b"><button class="tool" type="button" data-action="chat-pick">'+ic('image',17)+'Add image</button><input id="chatFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden><span class="hint" id="modelHint">Gemini</span><button class="send" id="sendBtn" type="button" data-action="chat-send" aria-label="Send message">'+ic('send',18)+'</button></div></form><p class="foot-note">Your questions and selected images are sent securely to Learnix AI.</p></div></div></section>';}
function chatAfterRender(){paintChat();var t=$('#chatInput');if(t){t.value=draft.text;autosize();}}
function paintChat(){if(currentView()!=='chatbot'||!$('#thread'))return;$('#chatTitle').textContent=firstName()+"’s Learnix AI";$('#convs').innerHTML=chat.convs.map(function(c){return '<div class="conv'+(c.id===chat.activeId?' active':'')+'"><button class="conv-open" type="button" data-action="chat-open" data-id="'+c.id+'">'+esc(c.title)+'</button><button class="iconbtn" type="button" data-action="chat-del" data-id="'+c.id+'" aria-label="Delete chat">'+ic('trash',15)+'</button></div>';}).join('')||'<p class="small muted" style="padding:6px 10px">No chats yet.</p>';var ca=$('#clearAll');if(ca)ca.hidden=!chat.convs.length;paintDraft();var c=activeConv();$('#thread').innerHTML=c&&c.messages.length?c.messages.map(renderMessage).join(''):'<div class="chat-empty-state"><span class="chat-empty-badge">Learnix AI</span><h2>A clean space to <em>think.</em></h2><p>Ask a study question to get started.</p></div>';var sc=$('#chatScroll');if(sc)sc.scrollTop=sc.scrollHeight;}
function renderMessage(m){var content=m.role==='assistant'?'<div class="chat-answer">'+esc(m.text||'').replace(/\n/g,'<br>')+'</div><button class="btn btn-line btn-sm" type="button" data-action="chat-add-note" data-answer="'+encodeURIComponent(m.text||'')+'">'+ic('plus',14)+' Add to Notes</button>':'<p>'+esc(m.text||'')+'</p>';return '<article class="chat-message '+(m.role==='assistant'?'assistant':'user')+'">'+content+'</article>';}
function paintDraft(){var dt=$('#draftThumbs');if(!dt)return;dt.innerHTML=draft.thumbs.map(function(t,i){return '<span class="dt"><img src="'+t+'" alt="Attachment preview"><button class="dt-x" type="button" data-action="chat-rm-file" data-i="'+i+'" aria-label="Remove attachment">'+ic('x',12)+'</button></span>';}).join('');var b=$('#sendBtn');if(b)b.disabled=!draft.text.trim()&&!draft.files.length;}
function autosize(){var t=$('#chatInput');if(t){t.style.height='auto';t.style.height=Math.min(160,t.scrollHeight)+'px';}}
function renderChat(){$('#view').innerHTML=chatHTML();chatAfterRender();loadChats();}
 function closeChatList(){var sh=$('#chatShell');if(sh)sh.classList.remove('list-open');}
 function fileToBase64(file){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(String(r.result).split(',')[1]||'')};r.onerror=reject;r.readAsDataURL(file);});}
 function chatApiUrl(path){var local=location.protocol==='file:'||(location.hostname==='localhost'||location.hostname==='127.0.0.1')&&location.port&&location.port!=='3000'&&location.port!=='8888';return local?'http://localhost:3000'+path:path;}
  async function sendMsg(){var input=$('#chatInput'),text=(input&&input.value||'').trim();if(!text&&!draft.files.length)return;var c=activeConv();if(!c){c={id:uid(),title:(text||'Image question').slice(0,48),messages:[]};chat.convs.unshift(c);chat.activeId=c.id;}if(!c.title||c.title==='New chat')c.title=(text||'Image question').slice(0,48);var images=[];for(var i=0;i<draft.thumbs.length;i++){var dataUrl=draft.thumbs[i];images.push({mimeType:'image/jpeg',data:dataUrl.split(',')[1]||''});}c.messages.push({role:'user',text:text||'[Image attached]'});var history=c.messages.slice(0,-1).map(function(m){return {role:m.role==='assistant'?'model':'user',text:m.text||''}});draft={text:'',files:[],thumbs:[]};if(input){input.value='';autosize();}paintChat();var thread=$('#thread');thread.insertAdjacentHTML('beforeend','<article class="chat-message assistant" id="chat-loading"><p>Thinking…</p></article>');chatSave(c);try{var token=window.learnixAuth.user?await window.learnixAuth.user.getIdToken():'';if(!token)throw new Error('Please sign in with Google again.');var resp=await fetch(chatApiUrl('/api/chat'),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({message:text,images:images,history:history})});var raw=await resp.text(),data={};try{data=raw?JSON.parse(raw):{};}catch(_){throw new Error('AI service returned an invalid response (HTTP '+resp.status+'). Start the Learnix API or use the deployed site.');}if(!resp.ok)throw new Error(data.error||'AI request failed (HTTP '+resp.status+').');c.messages.push({role:'assistant',text:data.reply});chatSave(c);var l=$('#chat-loading');if(l)l.outerHTML=renderMessage({role:'assistant',text:data.reply});}catch(err){c.messages.pop();chatSave(c);var l=$('#chat-loading');if(l)l.innerHTML='<p>'+esc(err.message||'Could not reach Learnix AI. Try again.')+'</p>';}}
function addChatAnswerToNote(answer){answer=decodeURIComponent(answer||'');if(!answer)return;var opts=state.notes.map(function(n,i){return (i+1)+'. '+n.title}).join('\n'),choice=prompt('Enter a note number to append, or 0 to create a new note:\n'+opts,'0');if(choice===null)return;var idx=Number(choice)-1;if(choice.trim()==='0'||!state.notes.length){var title=prompt('Title for the new note:','Chatbot response');if(!title)return;state.notes.unshift({id:uid(),title:title.trim(),subject:'Other',body:'<p>'+esc(answer).replace(/\n/g,'<br>')+'</p>'});}else if(Number.isInteger(idx)&&idx>=0&&idx<state.notes.length)state.notes[idx].body=(state.notes[idx].body||'')+'<p><br></p><p>'+esc(answer).replace(/\n/g,'<br>')+'</p>';else{toast('Please enter a valid note number.');return;}save();if(currentView()==='dashboard')renderNotes();toast('Response added to your note.');}
function chatDelete(id){if(!confirm('Delete this chat and its messages?'))return;chat.convs=chat.convs.filter(function(c){return c.id!==id});if(chat.activeId===id)chat.activeId=chat.convs.length?chat.convs[0].id:null;window.learnixAuth.deleteChat(id).catch(function(){toast('Could not delete saved chat.')});paintChat();}
function chatClearAll(){if(!confirm('Delete all saved chats? This cannot be undone.'))return;chat.convs=[];chat.activeId=null;window.learnixAuth.deleteAllChats().catch(function(){toast('Could not clear saved chats.')});paintChat();}
/* ---- images ---- */
function makeThumb(file){
  return new Promise(function(res){
    var r=new FileReader();
    r.onload=function(){
      var img=new Image();
      img.onload=function(){
        try{
          var k=Math.min(1,240/Math.max(img.width,img.height)),c=document.createElement('canvas');
          c.width=Math.max(1,Math.round(img.width*k));c.height=Math.max(1,Math.round(img.height*k));
          c.getContext('2d').drawImage(img,0,0,c.width,c.height);
          res(c.toDataURL('image/jpeg',0.72));
        }catch(e){res('')}
      };
      img.onerror=function(){res('')};
      img.src=r.result;
    };
    r.onerror=function(){res('')};
    r.readAsDataURL(file);
  });
}
function addFiles(list){
  var cfg=imgCfg();if(!cfg)return;
  var ok=[],msg='',room=cfg.max-draft.files.length;
  Array.prototype.slice.call(list).forEach(function(f){
    if(cfg.types.indexOf(f.type)<0){msg='Only JPG, PNG, WebP or GIF images can be attached.';return}
    if(f.size>cfg.bytes){msg='That image is over '+Math.round(cfg.bytes/1048576)+' MB. Try a smaller photo.';return}
    if(ok.length>=room){msg='You can attach up to '+cfg.max+' images per message.';return}
    ok.push(f);
  });
  if(msg)toast(msg);
  Promise.all(ok.map(makeThumb)).then(function(th){
    ok.forEach(function(f,i){
      if(!th[i]){toast('That image could not be read. Try another photo.');return}
      if(draft.files.length>=cfg.max)return;
      draft.files.push(f);draft.thumbs.push(th[i]);
    });
    paintDraft();
  });
}
document.addEventListener('change',function(e){if(e.target&&e.target.id==='noteFont'){document.execCommand('fontName',false,e.target.value);$('#nBody').focus();}if(e.target&&e.target.id==='noteSize'){document.execCommand('fontSize',false,e.target.value);$('#nBody').focus();}if(e.target&&e.target.id==='noteColor'){document.execCommand('foreColor',false,e.target.value);$('#nBody').focus();}});
document.addEventListener('input',function(e){if(e.target&&e.target.id==='chatInput'){draft.text=e.target.value;autosize();paintDraft()}});
document.addEventListener('paste',function(e){
  if(!e.target||e.target.id!=='chatInput'||!imgCfg())return;
  var fl=(e.clipboardData&&e.clipboardData.files)||[],fs=[];
  for(var i=0;i<fl.length;i++)if(/^image\//.test(fl[i].type))fs.push(fl[i]);
  if(fs.length){e.preventDefault();addFiles(fs)}
});
document.addEventListener('dragover',function(e){
  var m=e.target.closest&&e.target.closest('#chatMain');
  if(m&&imgCfg()&&e.dataTransfer&&Array.prototype.indexOf.call(e.dataTransfer.types||[],'Files')>-1){e.preventDefault();m.classList.add('drag')}
});
document.addEventListener('dragleave',function(e){var m=$('#chatMain');if(m&&(!e.relatedTarget||!m.contains(e.relatedTarget)))m.classList.remove('drag')});
document.addEventListener('drop',function(e){
  var m=e.target.closest&&e.target.closest('#chatMain');if(!m)return;
  e.preventDefault();m.classList.remove('drag');
  if(e.dataTransfer&&e.dataTransfer.files&&imgCfg())addFiles(e.dataTransfer.files);
});


function updateNoteStats(){var ed=$('#nBody');if(!ed)return;var s=noteText(ed.innerHTML).trim(),words=s?s.split(/\s+/).length:0,chars=s.length,mins=Math.max(1,Math.ceil(words/200));var st=$('#noteStats');if(st)st.textContent=words+' words · '+chars+' characters · '+mins+' min read';}
var noteAutosaveTimer=null;
function setupNoteAutosave(){var form=$('#note-form');if(!form)return;form.dataset.dirty='false';var mark=function(){form.dataset.dirty='true';var s=$('#noteSaveStatus');if(s)s.textContent='Unsaved changes';clearTimeout(noteAutosaveTimer);noteAutosaveTimer=setTimeout(function(){var title=$('#nTitle').value.trim(),body=cleanNote($('#nBody').innerHTML.trim());if(!title||!body)return;var id=form.dataset.editId,n= id?state.notes.find(function(x){return x.id===id}):null,now=new Date().toISOString(),tags=$('#nTags').value.split(',').map(function(x){return x.trim()}).filter(Boolean).slice(0,12);if(n){n.title=title;n.body=body;n.subject=$('#nSubject').value;n.language=$('#nLanguage').value;n.tags=tags;n.updatedAt=now;}else{n={id:uid(),title:title,body:body,subject:$('#nSubject').value,language:$('#nLanguage').value,tags:tags,createdAt:now,updatedAt:now,pinned:false,favorite:false,archived:false};state.notes.unshift(n);form.dataset.editId=n.id;selectedNoteId=n.id;}save();form.dataset.dirty='false';if(s)s.textContent='Saved';var ai=$('#noteAutosave');if(ai)ai.textContent='Saved to your account';renderNotesDashboard();},1100);};['nTitle','nBody','nSubject','nLanguage','nTags'].forEach(function(id){var el=$('#'+id);if(el){el.addEventListener(id==='nBody'?'input':'input',function(){mark();updateNoteStats();});el.addEventListener('change',mark);}});}
document.addEventListener('input',function(e){if(e.target&&e.target.id==='notesSearch'){notesQuery=e.target.value;notesDashboardList();}});
document.addEventListener('change',function(e){if(e.target&&e.target.id==='notesSort')notesDashboardList();});
document.addEventListener('click',function(e){var f=e.target.closest('[data-notes-filter]');if(f){notesFilter=f.getAttribute('data-notes-filter');document.querySelectorAll('[data-notes-filter]').forEach(function(x){x.classList.toggle('active',x===f)});notesDashboardList();}});
/* ---------- events ---------- */
document.addEventListener('change',function(e){
  if(e.target.id==='noteFont'){var ef=$('#nBody');if(ef){ef.focus();document.execCommand('fontName',false,e.target.value);}return;}if(e.target.id==='noteBlock'){var eb=$('#nBody');if(eb){eb.focus();document.execCommand('formatBlock',false,e.target.value);}return;}if(e.target.id==='noteFont'){var ed=$('#nBody');if(ed){ed.focus();document.execCommand('fontName',false,e.target.value);}return;}
  if(e.target.id==='noteSize'){var ed2=$('#nBody');if(ed2){ed2.focus();document.execCommand('fontSize',false,e.target.value);}return;}
  if(e.target.id==='noteColor'){var ed3=$('#nBody');if(ed3){ed3.focus();document.execCommand('foreColor',false,e.target.value);}return;}
  if(e.target.id==='noteHighlight'){var ed4=$('#nBody');if(ed4){ed4.focus();document.execCommand('hiliteColor',false,e.target.value);}return;}
  if(e.target.id==='noteImageInput'){var file=e.target.files&&e.target.files[0];e.target.value='';if(!file)return;if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)||file.size>2*1024*1024){toast('Choose a PNG, JPEG, WebP, or GIF image under 2 MB.');return;}var reader=new FileReader();reader.onload=function(){var img=new Image();img.onload=function(){var max=1200,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);var data=file.type==='image/gif'?reader.result:canvas.toDataURL('image/jpeg',0.72);if(data.length>420000){data=canvas.toDataURL('image/jpeg',0.55);}var ed5=$('#nBody');if(ed5){ed5.focus();document.execCommand('insertImage',false,data);}};img.src=reader.result;};reader.readAsDataURL(file);return;}
});
document.addEventListener('mousedown',function(e){if(e.target.closest('.note-toolbar [data-format],.note-palette-wrap'))e.preventDefault();});
document.addEventListener('click',function(e){
  var formatBtn=e.target.closest('[data-format]');if(formatBtn){e.preventDefault();var editor=$('#nBody');if(editor){editor.focus();document.execCommand(formatBtn.dataset.format,false,formatBtn.dataset.value||null);updateNoteStats();}return;}
  if(e.target.classList&&e.target.classList.contains('scrim')){closeModal();return}
  if(!e.target.closest('.create-wrap'))closeCreate();
  if(!e.target.closest('.profile-wrap'))closeProfile();
  var dot=e.target.closest('.accent-dot');if(dot){paintAccent(dot.getAttribute('data-accent'));return;}
  var t=e.target.closest('[data-action]');if(!t)return;
  var a=t.getAttribute('data-action'),id=t.getAttribute('data-id'),sid=t.getAttribute('data-sid');
  switch(a){
    case 'gpa-calculate':calculateGPA();break;
    case 'gpa-reset':resetGPA();break;
    case 'projection-calculate':calculateProjection(true);break;
    case 'toggle-theme':{var next=isDark()?'light':'dark';document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem(THEME_KEY,next)}catch(x){}paintTheme();break}
    case 'toggle-create':toggleCreate();break;
    case 'toggle-profile':toggleProfile();break;
    case 'change-setup':closeProfile();startOnboarding();break;
    case 'sign-out':closeProfile();saveNow();if(window.learnixAuth)window.learnixAuth.signOut().then(function(){location.href='login.html'}).catch(function(e){toast(e.message||'Could not sign out.');});break;
    case 'delete-account':if(confirm('Permanently delete your Learnix account and ALL of its data from our database? This cannot be undone.')){if(window.learnixAuth){clearTimeout(saveTimer);savePending=false;cloudReady=false;toast('Confirm with Google to finish deleting your account…');window.learnixAuth.deleteAccountData().then(function(){location.href='login.html'}).catch(function(e){cloudReady=true;var m=e&&e.code==='auth/popup-closed-by-user'?'Deletion cancelled. Your account was not deleted.':(e&&e.code==='auth/cancelled-popup-request')?'Deletion cancelled.':(e.message||'Account deletion failed.');toast(m);});}}break;
    case 'remove-photo':state.profile.photo='';save();paintProfile();toast('Profile photo removed.');break;
    case 'open-note':openNote();break;case 'edit-note':openNote({id:id});break;
    case 'select-note':selectedNoteId=id;renderNotesDashboard();break;
    case 'toggle-pin':{var pn=state.notes.find(function(x){return x.id===id});if(pn){pn.pinned=!pn.pinned;pn.updatedAt=new Date().toISOString();save();renderNotesDashboard();}break;}
    case 'toggle-favorite':{var fn=state.notes.find(function(x){return x.id===id});if(fn){fn.favorite=!fn.favorite;fn.updatedAt=new Date().toISOString();save();renderNotesDashboard();}break;}
    case 'duplicate-note':{var dn=state.notes.find(function(x){return x.id===id});if(dn){var copy=Object.assign({},dn,{id:uid(),title:(dn.title||'Untitled')+' (copy)',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),pinned:false});state.notes.unshift(copy);selectedNoteId=copy.id;save();renderNotesDashboard();toast('Note duplicated.');}break;}
    case 'archive-note':{var an=state.notes.find(function(x){return x.id===id});if(an){an.archived=!an.archived;an.updatedAt=new Date().toISOString();if(an.archived)selectedNoteId=null;save();renderNotesDashboard();toast(an.archived?'Note archived.':'Note restored.');}break;}
    case 'toggle-palette':{var pal=t.getAttribute('data-palette');var target=pal==='text'?$('#textPalette'):$('#highlightPalette');if(target)target.hidden=!target.hidden;break;}
    case 'apply-color':{var ed=$('#nBody');if(ed){ed.focus();document.execCommand(t.getAttribute('data-kind')==='highlight'?'hiliteColor':'foreColor',false,t.getAttribute('data-color'));}var p1=$('#textPalette'),p2=$('#highlightPalette');if(p1)p1.hidden=true;if(p2)p2.hidden=true;updateNoteStats();break;}
    case 'note-link':{var url=prompt('Enter link URL (https://…)');if(url&&/^https?:\/\//i.test(url)){var edl=$('#nBody');if(edl){edl.focus();document.execCommand('createLink',false,url);}}break;}
    case 'close-note-editor':{var form=$('#note-form');if(form&&form.dataset.dirty==='true'&&!confirm('Discard unsaved changes?'))break;closeModal();break;}
    case 'note-image':{var ni=$('#noteImageInput');if(ni)ni.click();break;}
    case 'open-slot':openSlot(t.getAttribute('data-subject'));break;
    case 'open-deadline':openDeadline();break;
    case 'close-modal':closeModal();break;
    case 'day':selDay=+t.getAttribute('data-day');renderDayTabs();renderTimetable();break;
    case 'del-slot':state.slots=state.slots.filter(function(s){return s.id!==id});save();renderTimetable();renderChart();toast('Study block removed.');break;
    case 'del-note':if(confirm('Delete this note? This cannot be undone.')){state.notes=state.notes.filter(function(n){return n.id!==id});if(selectedNoteId===id)selectedNoteId=null;save();renderNotes();renderKeynotes();renderNotesDashboard();toast('Note deleted.');}break;
    case 'toggle-note':openNotes[id]=!openNotes[id];renderNotes();break;
    case 'goal-toggle':state.goals.forEach(function(g){if(g.id===id)g.done=!g.done});save();renderGoals();break;
    case 'goal-del':state.goals=state.goals.filter(function(g){return g.id!==id});save();renderGoals();toast('Goal removed.');break;
    case 'suggest':{var i=$('#goalText');i.value=t.getAttribute('data-text');i.focus();$('#goalErr').hidden=true;break}
    case 'dl-toggle':state.deadlines.forEach(function(d){if(d.id===id)d.done=!d.done});save();renderDeadlines();renderStats();break;
    case 'dl-del':state.deadlines=state.deadlines.filter(function(d){return d.id!==id});save();renderDeadlines();renderStats();toast('Deadline deleted.');break;
    case 'ch-toggle':{
      state.subjects.forEach(function(s){if(s.id===sid)s.chapters.forEach(function(c){if(c.id===id)c.done=!c.done})});
      save();renderCourses();if(currentView()==='dashboard')renderStats();var again=document.querySelector('[data-action="ch-toggle"][data-id="'+id+'"]');if(again)again.focus();break}
    case 'ch-del':toast('Official syllabus chapters cannot be removed.');break;
    case 'clear-sample':{
      (state.sampleKeys||[]).forEach(function(k){delete state.log[k]});state.sampleKeys=[];save();refreshStudy();
      toast('Example history cleared. Your own sessions will build the chart and streak.');break}
    case 'chat-new':{var nc={id:uid(),title:'New chat',messages:[]};chat.convs.unshift(nc);chat.activeId=nc.id;chatSave(nc);draft={text:'',files:[],thumbs:[]};renderChat();var ni=$('#chatInput');if(ni)ni.focus();break}
    case 'chat-open':chat.activeId=id;closeChatList();paintChat();break;
    case 'chat-del':chatDelete(id);break;
    case 'chat-clear-all':chatClearAll();break;
    case 'chat-send':sendMsg();break;
    case 'chat-add-note':addChatAnswerToNote(t.getAttribute('data-answer'));break;
    case 'chat-pick':{var pf=$('#chatFile');if(pf)pf.click();break}
    case 'chat-rm-file':{var ri=+t.getAttribute('data-i');draft.files.splice(ri,1);draft.thumbs.splice(ri,1);paintDraft();break}
    case 'chat-toggle-list':{var sh=$('#chatShell');if(sh)sh.classList.toggle('list-open');break}
    case 'timer-toggle':timerToggle();break;
    case 'timer-reset':timerReset();break;
    case 'timer-mode':timerMode(+t.getAttribute('data-mins'));break;
  }
});
document.addEventListener('keydown',function(e){
  if(e.target&&e.target.id==='chatInput'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendMsg();return}
  if(e.key==='Escape'){
    if($('#modalRoot').firstChild){closeModal();return}
    var cm=$('#createMenu'),pp=$('#profilePop');
    if(cm&&!cm.hidden){closeCreate();$('#createBtn').focus()}
    if(pp&&!pp.hidden){closeProfile();$('#profileBtn').focus()}
  }
});
document.addEventListener('submit',function(e){
  e.preventDefault();
  var f=e.target.id;
  if(f==='onboarding-form'){
    var board=$('input[name="board"]:checked',e.target),cls=$('input[name="classLevel"]:checked',e.target),grp=$('input[name="group"]:checked',e.target),err=$('#onboardingError');
    if(!board||!cls||!grp){err.textContent='Choose a board, class and study group to continue.';err.hidden=false;return;}
    var next={board:board.value,classLevel:cls.value,group:grp.value};
    configureSubjectsForProfile(next);window.dispatchEvent(new CustomEvent('learnix-profile-updated'));hideOnboarding();location.hash='#dashboard';renderView();toast('Your study dashboard is ready.');return;
  }
  if(f==='note-form'){
    var title=$('#nTitle').value.trim(),body=cleanNote($('#nBody').innerHTML.trim());
    if(!title){showErr('#nErr','Add a title so you can find this note later.');$('#nTitle').focus();return}
    if(!body){showErr('#nErr','Write at least one key point to remember.');$('#nBody').focus();return}
    var editId=e.target.dataset.editId;var now=new Date().toISOString(),tags=($('#nTags')?$('#nTags').value:'').split(',').map(function(x){return x.trim();}).filter(Boolean).slice(0,12);if(editId){var existing=state.notes.find(function(n){return n.id===editId});if(existing){existing.title=title;existing.subject=$('#nSubject').value;existing.body=body;existing.language=$('#nLanguage').value;existing.tags=tags;existing.updatedAt=now;}}else{var created={id:uid(),title:title,subject:$('#nSubject').value,body:body,language:$('#nLanguage').value,tags:tags,createdAt:now,updatedAt:now,pinned:false,favorite:false,archived:false};state.notes.unshift(created);selectedNoteId=created.id;}save();closeModal();renderKeynotes();renderNotesDashboard();toast(editId?'Note updated.':'Note saved.');
  }else if(f==='slot-form'){
    var topic=$('#sTopic').value.trim(),s=$('#sStart').value,en=$('#sEnd').value;
    if(!topic){showErr('#sErr','Add what you will study, for example Chapter 6 revision.');$('#sTopic').focus();return}
    if(!s||!en){showErr('#sErr','Choose a start and finish time.');return}
    if(en<=s){showErr('#sErr','The finish time must be after the start time.');$('#sEnd').focus();return}
    var day=+$('#sDay').value;
    state.slots.push({id:uid(),day:day,subject:$('#sSubject').value,topic:topic,start:s,end:en});save();selDay=day;closeModal();renderDayTabs();renderTimetable();renderChart();toast('Added to your '+DAYS_LONG[day]+' timetable.');
  }else if(f==='deadline-form'){
    var dt=$('#dTitle').value.trim(),dd=$('#dDate').value;
    if(!dt){showErr('#dErr','Add what is due, for example Chemistry lab journal.');$('#dTitle').focus();return}
    if(!dd){showErr('#dErr','Choose a due date so Learnix can count down to it.');$('#dDate').focus();return}
    state.deadlines.push({id:uid(),title:dt,type:$('#dType').value,subject:$('#dSubject').value,due:dd,done:false});save();closeModal();renderDeadlines();renderStats();toast('Deadline added.');
  }else if(f==='goal-form'){
    var txt=$('#goalText').value.trim();
    if(!txt){showErr('#goalErr','Write your goal first, for example Finish chapter 6 revision.');$('#goalText').focus();return}
    state.goals.unshift({id:uid(),text:txt,subject:$('#goalSubject').value,due:$('#goalDate').value,done:false});save();
    $('#goalText').value='';$('#goalDate').value='';$('#goalErr').hidden=true;renderGoals();toast('Goal added.');
  }else if(f==='paper-form'){
    generatePaper();
  }else if(f==='profile-form'){
    var name=$('#pfName').value.trim();
    if(!name){showErr('#pfErr','Enter your name so Learnix can greet you.');$('#pfName').focus();return}
    state.profile.name=name;save();closeProfile();paintProfile();if(currentView()==='chatbot')paintChat();toast('Profile saved.');
  }else if(f&&f.indexOf('chForm-')===0){
    var sj=f.slice(7),inp=$('#chIn-'+sj),nm=inp.value.trim();
    if(!nm){toast('Type a chapter name first.');inp.focus();return}
    state.subjects.forEach(function(s){if(s.id===sj)s.chapters.push({id:uid(),name:nm,done:false})});
    save();renderCourses();var again=$('#chIn-'+sj);if(again)again.focus();
  }
});
document.addEventListener('change',function(e){
  if(e.target.id==='gpaOptional'||e.target.id==='gpaClass'){var values={};GPA_SUBJECTS.forEach(function(x){var el=$('#mark-'+x.id);if(el)values[x.id]=el.value;});initGPA();Object.keys(values).forEach(function(id){var el=$('#mark-'+id);if(el)el.value=values[id];});updateGPAOptional();return;}
  if(e.target.id==='paperClass'){var paperSubject=$('#paperSubject'),paperSubjects=paperSubjectOptions(e.target.value);if(paperSubject)paperSubject.innerHTML=paperSubjects.map(function(name){return '<option value="'+esc(name)+'">'+esc(name)+'</option>';}).join('');updatePaperPattern();return;}
  if(e.target.id==='paperSubject'){updatePaperPattern();return;}
  if(e.target.id==='chatFile'){addFiles(e.target.files||[]);e.target.value='';return}
  if(e.target.id!=='photoInput')return;
  var file=e.target.files&&e.target.files[0];if(!file)return;
  var r=new FileReader();
  r.onload=function(){
    var img=new Image();
    img.onload=function(){
      var s=160,c=document.createElement('canvas');c.width=c.height=s;var m=Math.min(img.width,img.height);
      c.getContext('2d').drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,s,s);
      state.profile.photo=c.toDataURL('image/jpeg',0.85);save();paintProfile();toast('Profile photo updated.');
    };
    img.onerror=function(){toast('That file could not be read as an image. Try a JPG or PNG.')};
    img.src=r.result;
  };
  r.readAsDataURL(file);e.target.value='';
});
window.addEventListener('hashchange',renderView);
window.addEventListener('pagehide',function(){saveNow();chat={convs:[],activeId:null};draft={text:'',files:[],thumbs:[]};blobs={};});

paintToday();paintTheme();paintAccent(document.documentElement.getAttribute('data-accent')||'mono');
function onAuth(detail){
  detail=detail||{};
  if(!detail.user){cloudReady=false;location.href='login.html';return;}
  chat={convs:[],activeId:null,loaded:false};
  if(detail.error){            /* never overwrite an existing database when it could not be read */
    cloudReady=false;state=defaults();
    $('#view').innerHTML='<section class="card soon"><p class="eyebrow">Connection problem</p><h2>Could not load your data</h2><p>'+esc(detail.error)+'</p><p class="muted">Your saved data was not changed. Check your internet connection and that Firestore rules are published, then reload.</p><button class="btn btn-primary" type="button" onclick="location.reload()">Reload</button></section>';
    return;
  }
  var fresh=!detail.state;
  state=Object.assign(defaults(),detail.state||{});
  ['notes','slots','goals','subjects','deadlines'].forEach(function(k){if(!Array.isArray(state[k]))state[k]=[]});
  if(!state.log||typeof state.log!=='object')state.log={};
  if(!state.profile||typeof state.profile!=='object')state.profile={name:'',photo:''};
  state.syllabusProfiles=state.syllabusProfiles||{};
  if(!state.profile.name&&detail.user.displayName)state.profile.name=detail.user.displayName;   /* full Google name */
  cloudReady=true;
  if(fresh||detail.user.displayName&&!(detail.state&&detail.state.profile&&detail.state.profile.name)){savePending=true;saveNow();}   /* creates this user's own new database */
  paintProfile();renderView();if(currentView()==='chatbot')loadChats();
}
window.addEventListener('learnix-auth',function(ev){onAuth(ev.detail)});
if(window.__learnixAuthDetail)onAuth(window.__learnixAuthDetail);
})();
