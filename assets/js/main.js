/* CFMA Website JavaScript - cfmsanambra.org */


/* TOAST */
function showToast(msg){const t=document.getElementById('toast');document.getElementById('toastMsg').textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),4500)}

/* TABS */
function switchTab(e,name){document.querySelectorAll('.rtab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));e.target.classList.add('active');document.getElementById('tab-'+name).classList.add('active')}

/* NAV */
function goTo(id) {
  // Page map for multi-page navigation
  var pageMap = {
    'home':       'index.html',
    'about':      'about.html',
    'academics':  'academics.html',
    'earlyyears': 'academics.html#earlyyears',
    'admissions': 'admissions.html',
    'results':    'results.html',
    'portal':     'portal.html',
    'fees':       'fees.html',
    'careers':    'careers.html',
    'contact':    'contact.html',
    'database':   'database.html',
    'setupguide': 'database.html#setupguide',
  };
  var nav = document.getElementById('mobileNav');
  if (nav) nav.classList.remove('open');
  // If we're already on the right page, just scroll
  var current = window.location.pathname.split('/').pop() || 'index.html';
  var target  = pageMap[id] || (id + '.html');
  var targetPage = target.split('#')[0];
  var targetHash = target.includes('#') ? '#' + target.split('#')[1] : '';
  if (current === targetPage || (current === '' && targetPage === 'index.html')) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({behavior:'smooth'});
  } else {
    window.location.href = target;
  }
}
function toggleMenu(){document.getElementById('mobileNav').classList.toggle('open')}
window.addEventListener('scroll',()=>{document.getElementById('navbar').style.boxShadow=window.scrollY>10?'0 2px 12px rgba(0,0,0,.3)':''})

/* REVEAL */
const obs=new IntersectionObserver((entries)=>{entries.forEach((e,i)=>{if(e.isIntersecting){setTimeout(()=>e.target.classList.add('visible'),i*70);obs.unobserve(e.target)}})},{threshold:.1});
document.querySelectorAll('.reveal').forEach(r=>obs.observe(r));


/* RESULTS ENGINE */
let resultsDB=[];
function calcGrade(t){if(t>=75)return{grade:'A',remarks:'Excellent'};if(t>=60)return{grade:'B',remarks:'Very Good'};if(t>=50)return{grade:'C',remarks:'Good'};if(t>=40)return{grade:'D',remarks:'Pass'};return{grade:'F',remarks:'Fail'}}
function gpill(g){return{A:'ga',B:'gb',C:'gc',D:'gd',F:'gf'}[g]||'gf'}

/* ── RANKING HELPERS (computed live, always fresh) ──────────────────────── */
function ordinal(n) {
  var s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

// Returns subject position (e.g. "1st") for a given student within their class/term/year/subject
function computeSubjectPosition(studentId, cls, term, year, subject) {
  var classmates = resultsDB.filter(function(r) {
    return r.studentClass === cls && r.term === term && r.year === year && r.subject === subject;
  });
  if (classmates.length === 0) return '';
  var sorted = classmates.slice().sort(function(a,b){ return b.total - a.total; });
  var rank = 1;
  for (var i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].total < sorted[i-1].total) rank = i + 1;
    if (sorted[i].studentId.toUpperCase() === studentId.toUpperCase()) return ordinal(rank);
  }
  return '';
}

// Returns { average, position } for a student across ALL their subjects in a given class/term/year
function computeClassAverageAndPosition(studentId, cls, term, year) {
  // Build per-student averages for everyone in this class/term/year
  var classResults = resultsDB.filter(function(r) {
    return r.studentClass === cls && r.term === term && r.year === year;
  });
  var byStudent = {};
  classResults.forEach(function(r) {
    var key = r.studentId.toUpperCase();
    if (!byStudent[key]) byStudent[key] = [];
    byStudent[key].push(r.total);
  });
  var averages = Object.keys(byStudent).map(function(sid) {
    var scores = byStudent[sid];
    var avg = scores.reduce(function(a,b){ return a+b; }, 0) / scores.length;
    return { studentId: sid, average: avg };
  });
  if (averages.length === 0) return { average: 0, position: '' };

  averages.sort(function(a,b){ return b.average - a.average; });
  var myKey = studentId.toUpperCase();
  var myAvg = 0, rank = '';
  var currentRank = 1;
  for (var i = 0; i < averages.length; i++) {
    if (i > 0 && averages[i].average < averages[i-1].average) currentRank = i + 1;
    if (averages[i].studentId === myKey) {
      myAvg = averages[i].average;
      rank = ordinal(currentRank);
      break;
    }
  }
  return { average: Math.round(myAvg * 10) / 10, position: rank, totalInClass: averages.length };
}

function searchResults(){
  const id=document.getElementById('studentId').value.trim().toUpperCase();
  const term=document.getElementById('termSelect').value;
  const year=document.getElementById('yearSelect').value;
  if(!id){showToast('Please enter your Student ID ⚠️');return}
  if(!term){showToast('Please select a Term ⚠️');return}
  if(!year){showToast('Please select an Academic Year ⚠️');return}
  const rows=resultsDB.filter(r=>r.studentId===id&&r.term===term&&r.year===year);
  document.getElementById('resultCard').style.display=rows.length?'block':'none';
  document.getElementById('noResult').style.display=rows.length?'none':'block';
  if(!rows.length){showToast('No results found ❌');return}
  const cls = rows[0].studentClass || '';
  const classStats = computeClassAverageAndPosition(id, cls, term, year);
  const avg = classStats.average || Math.round(rows.reduce((s,r)=>s+r.total,0)/rows.length);
  const {grade:ag}=calcGrade(avg);
  document.getElementById('summaryName').textContent=rows[0].studentName;
  document.getElementById('summaryId').textContent=id;
  document.getElementById('summaryClass').textContent=cls||'—';
  document.getElementById('summaryTerm').textContent=term+' — '+year;
  document.getElementById('summaryAvg').textContent=avg+'% ('+ag+')';
  document.getElementById('summaryPosition').textContent = classStats.position
    ? classStats.position + (classStats.totalInClass ? ' of '+classStats.totalInClass : '')
    : '—';
  document.getElementById('resultsBody').innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${r.subject}</strong></td><td style="text-align:center">${r.ca}</td><td style="text-align:center">${r.exam}</td><td style="text-align:center"><strong>${r.total}</strong></td><td style="text-align:center;color:#555;font-weight:600">${r.subjectPosition||'—'}</td><td style="text-align:center"><span class="gpill ${gpill(r.grade)}">${r.grade}</span></td><td>${r.remarks}</td></tr>`).join('');

  // "Others" section — most recent non-empty values across this term's subjects
  let attendance='', teacherComment='', affectiveSkills='';
  for (let i = rows.length - 1; i >= 0; i--) {
    if (!attendance && rows[i].attendance) attendance = rows[i].attendance;
    if (!teacherComment && rows[i].teacherComment) teacherComment = rows[i].teacherComment;
    if (!affectiveSkills && rows[i].affectiveSkills) affectiveSkills = rows[i].affectiveSkills;
  }
  document.getElementById('summaryAttendance').textContent = attendance || '—';
  document.getElementById('summarySkills').textContent     = affectiveSkills || '—';
  document.getElementById('summaryComment').textContent    = teacherComment || '—';

  showToast('Results loaded for '+rows[0].studentName+' ✅');
}
function getGradeClass(grade) {
  if (grade === 'A') return 'grade-a';
  if (grade === 'B') return 'grade-b';
  if (grade === 'C') return 'grade-c';
  if (grade === 'D') return 'grade-c';
  return 'grade-f';
}

function closeResults(){document.getElementById('resultCard').style.display='none';document.getElementById('noResult').style.display='none'}


function handleDrop(e){e.preventDefault();document.getElementById('dropZone').style.borderColor='#ccc';processFile(e.dataTransfer.files[0])}
function handleFileUpload(input){if(input.files[0])processFile(input.files[0]);input.value=''}
function processFile(file){
  if(!file)return;
  const ext=file.name.split('.').pop().toLowerCase();
  if(!['xlsx','xls','csv'].includes(ext)){showToast('Please upload .xlsx, .xls or .csv ⚠️');return}
  const prog=document.getElementById('uploadProgress'),bar=document.getElementById('progressBar'),pct=document.getElementById('uploadPercent');
  document.getElementById('uploadFileName').textContent=file.name;prog.style.display='block';let p=0;
  const iv=setInterval(()=>{p=Math.min(p+Math.random()*25,90);bar.style.width=p+'%';pct.textContent=Math.round(p)+'%'},120);
  const reader=new FileReader();
  reader.onload=function(e){
    clearInterval(iv);bar.style.width='100%';pct.textContent='100%';
    try{
      let rows=ext==='csv'?parseCSV(e.target.result):XLSX.utils.sheet_to_json(XLSX.read(e.target.result,{type:'array'}).Sheets[XLSX.read(e.target.result,{type:'array'}).SheetNames[0]],{defval:''});
      setTimeout(()=>{prog.style.display='none';bar.style.width='0%'},500);
      ingestRows(rows,file.name);
    }catch(err){setTimeout(()=>prog.style.display='none',400);showToast('Error reading file ❌');console.error(err)}
  };
  if(ext==='csv')reader.readAsText(file);else reader.readAsArrayBuffer(file);
}
function parseCSV(text){const lines=text.trim().split(/\r?\n/),heads=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));return lines.slice(1).map(ln=>{const vals=ln.split(',').map(v=>v.trim().replace(/^"|"$/g,''));const obj={};heads.forEach((h,i)=>obj[h]=vals[i]||'');return obj})}
function col(row,...names){for(const n of names)for(const k of Object.keys(row))if(k.toLowerCase().replace(/[\s_]/g,'')=== n.toLowerCase().replace(/[\s_]/g,''))return String(row[k]||'').trim();return''}
function ingestRows(rows,fname){
  let added=0,skipped=0;
  const newlyAdded=[];
  const touchedGroups=new Set(); // track unique class+term+year+subject combos to recompute positions for
  rows.forEach(row=>{
    const sid=col(row,'StudentID','Student ID','ID');
    const name=col(row,'StudentName','Student Name','Name');
    const school=col(row,'School','Campus')||'Christ the Foundation Model Academy';
    const cls=col(row,'Class','Grade');
    const term=col(row,'Term');
    const year=col(row,'AcademicYear','Academic Year','Year');
    const subj=col(row,'Subject');
    const ca=parseFloat(col(row,'CAScore','CA Score','CA'))||0;
    const exam=parseFloat(col(row,'ExamScore','Exam Score','Exam'))||0;
    const attendance=col(row,'Attendance','TimesPresent','Times Present');
    const teacherComment=col(row,'TeacherComment','Teacher Comment','Comment');
    const affectiveSkills=col(row,'AffectiveSkills','Affective Skills','Skills','Conduct');
    if(!sid||!name||!subj){skipped++;return}
    const total=ca+exam;const{grade,remarks}=calcGrade(total);
    const idx=resultsDB.findIndex(r=>r.studentId===sid.toUpperCase()&&r.term===term&&r.year===year&&r.subject===subj);
    if(idx>-1)resultsDB.splice(idx,1);
    const record={studentId:sid.toUpperCase(),studentName:name,school,studentClass:cls,term,year,subject:subj,ca,exam,total,subjectPosition:'',grade,remarks,attendance,teacherComment,affectiveSkills};
    resultsDB.push(record);
    newlyAdded.push(record);
    touchedGroups.add(cls+'|'+term+'|'+year+'|'+subj);
    added++;
  });

  // Recompute subject positions for every class/term/year/subject group affected by this upload
  touchedGroups.forEach(function(key){
    const [cls,term,year,subj] = key.split('|');
    resultsDB.filter(function(r){
      return r.studentClass===cls && r.term===term && r.year===year && r.subject===subj;
    }).forEach(function(r){
      r.subjectPosition = computeSubjectPosition(r.studentId, cls, term, year, subj);
    });
  });

  renderPreview();showToast(`✅ ${added} records uploaded (${skipped} skipped)`);document.getElementById('uploadPreview').style.display='block';
  if (newlyAdded.length > 0) {
    saveResultsToSheets(newlyAdded).then(function(){
      showToast('💾 Results saved to Google Sheets ✅');
    }).catch(function(e){
      console.error('Could not save results to Sheets:', e);
      showToast('⚠️ Results saved locally only — check internet connection');
    });
  }
}
function renderPreview(){
  const unique=new Set(resultsDB.map(r=>r.studentId)).size;
  document.getElementById('uploadStats').textContent=`${resultsDB.length} records · ${unique} students`;
  document.getElementById('previewBody').innerHTML=resultsDB.slice().reverse().slice(0,100).map(r=>`<tr><td style="padding:9px 12px;color:#888;font-size:11px">${r.studentId}</td><td style="padding:9px 12px;font-weight:600">${r.studentName}</td><td style="padding:9px 12px">${r.studentClass}</td><td style="padding:9px 12px">${r.term}</td><td style="padding:9px 12px">${r.year}</td><td style="padding:9px 12px">${r.subject}</td><td style="padding:9px 12px;text-align:center">${r.ca}</td><td style="padding:9px 12px;text-align:center">${r.exam}</td><td style="padding:9px 12px;text-align:center;font-weight:700">${r.total}</td><td style="padding:9px 12px;text-align:center"><span class="gpill ${gpill(r.grade)}">${r.grade}</span></td></tr>`).join('');
}
function clearAllResults(){if(!confirm('Clear ALL uploaded results? This cannot be undone.'))return;resultsDB=[];document.getElementById('uploadPreview').style.display='none';document.getElementById('resultCard').style.display='none';document.getElementById('noResult').style.display='none';showToast('All results cleared 🗑')}
function downloadTemplate() {
  downloadSmartTemplate();
}

/* ── DB student helper for template ── */
function getStudentsForClass(cls) {
  if (!cls) return [];
  var clsNorm = cls.trim().toLowerCase().replace(/\s+/g, ' ');
  return dbRecords.filter(function(r){
    var rCls = (r.classPos || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return rCls === clsNorm;
  }).sort(function(a, b) {
    // Sort alphabetically by surname for consistent ordering
    return (a.name || '').localeCompare(b.name || '');
  });
}

function updateTemplatePreview() {
  var term    = document.getElementById('tpl_term').value;
  var year    = document.getElementById('tpl_year').value;
  var cls     = document.getElementById('tpl_class').value;
  var subject = document.getElementById('tpl_subject').value;
  var wrap    = document.getElementById('templatePreviewWrap');
  var body    = document.getElementById('templatePreviewBody');

  if (!cls || !subject) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';

  // Get students from DB for this class
  var students = getStudentsForClass(cls);

  // Always show at least 5 sample rows
  var rows = [];
  students.forEach(function(s, i) {
    rows.push({
      id:   s.studentId || ('CFMS-' + String(i+1).padStart(3,'0')),
      name: s.name || 'Student ' + (i+1)
    });
  });

  // If no students in DB yet, show sample placeholder rows
  if (rows.length === 0) {
    for (var i = 1; i <= 5; i++) {
      rows.push({
        id:   'CFMS-2025-' + String(i).padStart(3,'0'),
        name: 'Student Name ' + i
      });
    }
  }

  body.innerHTML = rows.map(function(r) {
    return '<tr>' +
      '<td style="padding:7px 10px;border:1px solid #e5e7eb;color:#6B7280;font-family:monospace">' + r.id + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e5e7eb;font-weight:600">' + r.name + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e5e7eb;color:#6B7280">' + cls + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e5e7eb;color:#6B7280">' + (term||'First Term') + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e5e7eb;color:#6B7280">' + (year||'2025/2026') + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e5e7eb;background:rgba(201,150,12,.08);font-weight:700;color:var(--green-dark)">' + subject + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;color:#ccc;font-style:italic">Enter score</td>' +
      '<td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;color:#ccc;font-style:italic">Enter score</td>' +
    '</tr>';
  }).join('');
}

function downloadSmartTemplate() {
  var term    = document.getElementById('tpl_term').value    || 'First Term';
  var year    = document.getElementById('tpl_year').value    || '2025/2026';
  var cls     = document.getElementById('tpl_class').value   || '';
  var subject = document.getElementById('tpl_subject').value || '';
  var teacher = document.getElementById('tpl_teacher').value || '';

  if (!cls)     { showToast('Please select a Class first \u26a0\ufe0f'); return; }
  if (!subject) { showToast('Please select a Subject first \u26a0\ufe0f'); return; }

  // Get students from DB for this class
  var students = getStudentsForClass(cls);
  var rows = [];

  if (students.length > 0) {
    // Use real students from database
    students.forEach(function(s) {
      rows.push([s.studentId, s.name, cls, term, year, subject, '', '', '', '', '']);
    });
  } else {
    // No students in DB yet — generate blank rows
    for (var i = 1; i <= 10; i++) {
      rows.push([
        'CFMS-' + new Date().getFullYear() + '-' + String(i).padStart(3,'0'),
        '',
        cls, term, year, subject, '', '', '', '', ''
      ]);
    }
  }

  // Build CSV
  var header = 'Student ID,Student Name,Class,Term,Academic Year,Subject,CA Score,Exam Score,Attendance,Teacher Comment,Affective Skills';
  var note   = '# CFMA Results Template — ' + cls + ' | ' + subject + ' | ' + term + ' ' + year + (teacher?' | Teacher: '+teacher:'') + ' | CA out of 40, Exam out of 60 | Attendance/Comment/Skills are optional';
  var csv    = note + '\n' + header + '\n';
  rows.forEach(function(r) {
    csv += r.map(function(v){ return '"' + String(v).replace(/"/g,'""') + '"'; }).join(',') + '\n';
  });

  var blob = new Blob([csv], { type: 'text/csv' });
  var a    = document.createElement('a');
  a.href   = URL.createObjectURL(blob);
  a.download = 'CFMS_Results_' + cls.replace(/\s/g,'_') + '_' + subject.replace(/\s/g,'_') + '_' + term.replace(/\s/g,'_') + '.csv';
  a.click();
  showToast('\u2705 Template downloaded! Fill CA & Exam scores and upload below.');
}

  function copyScript() {
    const code = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Ref','Student Name','DOB','Gender','Division','Class','Campus','Parent','Phone','Email','Prev School','Extra','Timestamp']);
  }
  sheet.appendRow([data.ref, data.firstname+' '+data.surname, data.dob, data.gender, data.division, data.class, data.campus, data.parent, data.phone, data.email, data.prevschool, data.extra, data.timestamp]);
  return ContentService.createTextOutput('OK');
}`;
    navigator.clipboard.writeText(code).then(() => {
      showToast('Apps Script code copied! Paste it in Google Apps Script ✅');
    }).catch(() => {
      showToast('Please manually copy the code from the green box ⚠️');
    });
  }


/* ── SUBJECTS TABS ── */
function switchSubjLevel(level, btn) {
  document.querySelectorAll('.subj-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.slvl-tab').forEach(function(t){ t.classList.remove('active'); });
  var panel = document.getElementById('panel-' + level);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

function switchSSStream(stream, btn) {
  document.querySelectorAll('.ss-stream-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.ss-stream-tab').forEach(function(t){ t.classList.remove('active'); });
  var panel = document.getElementById('ss-' + stream);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ── ID CARD ── */
let passportDataURL = '';

/* ── PEOPLE DATABASE ── */
let dbRecords = [];
let dbCurrentTab = 'all';
let dbPassportData = '';
let dbAuthenticated = false;

function dbAuth() {
  var pwd = document.getElementById('dbPwd').value;
  if (!pwd) { showToast('Please enter your password \u26a0\ufe0f'); return; }

  showToast('Verifying\u2026 \u23f3');
  verifyLoginReadable('admin', pwd).then(function(result) {
    if (result && result.ok) {
      dbAuthenticated = true;
      adminAuthenticated = true;
      currentStaffAccount = result.account;
      document.getElementById('dbLoginBox').style.display = 'none';
      document.getElementById('dbPanel').style.display = 'block';
      renderDB();
      updateDbStats();
      showToast('Database unlocked \u2705 Welcome, ' + (result.account.fullName || 'Admin'));
      loadAllFromSheets();
    } else {
      var msg = (result && result.error) ? result.error : 'Incorrect password';
      document.getElementById('dbPwdErr').textContent = (result && result.networkError ? '\u26a0\ufe0f ' : '\u274c ') + msg;
      document.getElementById('dbPwdErr').style.display = 'block';
      document.getElementById('dbPwd').value = '';
      setTimeout(function(){ document.getElementById('dbPwdErr').style.display = 'none'; }, 6000);
    }
  });
}

function dbLogout() {
  dbAuthenticated = false;
  document.getElementById('dbPanel').style.display = 'none';
  document.getElementById('dbLoginBox').style.display = 'block';
  document.getElementById('dbPwd').value = '';
  showToast('Logged out of database');
}

/* switchDbTab defined below in admin print results */

function updateDbStats() {
  document.getElementById('dbTotalCount').textContent   = dbRecords.length;
  document.getElementById('dbStudentCount').textContent = dbRecords.filter(function(r){ return r.role==='secondary'; }).length;
  document.getElementById('dbPrimaryCount').textContent = dbRecords.filter(function(r){ return r.role==='primary'; }).length;
  document.getElementById('dbNurseryCount').textContent = dbRecords.filter(function(r){ return r.role==='nursery'; }).length;
  document.getElementById('dbStaffCount').textContent   = dbRecords.filter(function(r){ return r.role==='staff'; }).length;
}

function renderDB() {
  var search  = (document.getElementById('dbSearchInput').value || '').toLowerCase();
  var campus  = document.getElementById('dbCampusFilter').value;
  var gender  = document.getElementById('dbGenderFilter').value;

  var filtered = dbRecords.filter(function(r) {
    var matchTab    = dbCurrentTab === 'all' || r.role === dbCurrentTab;
    var matchSearch = !search || r.name.toLowerCase().includes(search) || r.studentId.toLowerCase().includes(search);
    var matchCampus = !campus || r.campus === campus;
    var matchGender = !gender || r.gender === gender;
    return matchTab && matchSearch && matchCampus && matchGender;
  });

  var body = document.getElementById('dbTableBody');
  var empty = document.getElementById('dbEmpty');

  if (filtered.length === 0) {
    body.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  var roleLabels = { secondary:'Secondary', primary:'Primary', nursery:'Nursery', staff:'Staff' };
  var roleCls    = { secondary:'db-role-student', primary:'db-role-primary', nursery:'db-role-nursery', staff:'db-role-staff' };

  body.innerHTML = filtered.map(function(r) {
    var passportHtml = r.passport
      ? '<img src="'+r.passport+'" alt="'+r.name+'" class="db-passport-cell">'
      : '<div class="db-passport-placeholder">👤</div>';
    return '<tr>' +
      '<td>'+passportHtml+'</td>' +
      '<td><strong>'+r.name+'</strong></td>' +
      '<td style="color:var(--gray);font-family:monospace">'+r.studentId+'</td>' +
      '<td><span class="db-role-badge '+roleCls[r.role]+'">'+roleLabels[r.role]+'</span></td>' +
      '<td><span class="'+(r.gender==='Male'?'db-gender-m':'db-gender-f')+'">'+r.gender+'</span></td>' +
      '<td><span class="db-campus-badge">'+r.campus+'</span></td>' +
      '<td style="color:var(--gray)">'+r.phone+'</td>' +
      '<td><div class="db-subj-list">'+(r.subjects&&r.subjects.length?r.subjects.map(function(s){return '<span class="db-subj-tag">'+s+'</span>';}).join(''):'<span style="color:var(--gray);font-size:11px">—</span>')+'</div></td>' +
      '<td>' +
        '<button class="db-action-btn edit" onclick="editDbRecord(\'' + r.id + '\')">✏ Edit</button>' +
        '<button class="db-action-btn del" onclick="deleteDbRecord(\'' + r.id + '\')">🗑 Delete</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

/* Modal */
/* ── QUICK ADD MODE ─────────────────────────────────────────────────────── */
var qaSessionCount = 0;

var qaPassportData = '';

function qaLoadPassport(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    qaPassportData = e.target.result;
    var prev = document.getElementById('qa_passport_preview');
    prev.innerHTML = '<img src="' + qaPassportData + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
  };
  reader.readAsDataURL(input.files[0]);
}

function qaClearPassport() {
  qaPassportData = '';
  document.getElementById('qa_passport_preview').innerHTML = '👤';
  document.getElementById('qa_passport_input').value = '';
}

function toggleQuickAdd() {
  var panel = document.getElementById('quickAddPanel');
  var btn   = document.getElementById('quickAddToggleBtn');
  var isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  btn.style.background = isOpen ? '#1D4ED8' : '#1e3a8a';
  if (!isOpen) {
    // reset form fresh
    ['qa_surname','qa_firstname','qa_othername','qa_phone'].forEach(function(id){
      document.getElementById(id).value = '';
    });
    document.getElementById('qa_dob').value    = '';
    document.getElementById('qa_gender').value = '';
    document.getElementById('qa_role').value   = '';
    document.getElementById('qa_class').innerHTML = '<option value="">Select Division First</option>';
    document.getElementById('qa_campus').value = '';
    document.getElementById('qa_id_preview').textContent = 'Select division to generate';
    qaClearPassport();
    qaSessionCount = 0;
    document.getElementById('qa_count').textContent = '0 students added this session';
    document.getElementById('qa_surname').focus();
  }
}

function qaUpdateClass() {
  var role = document.getElementById('qa_role').value;
  var sel  = document.getElementById('qa_class');
  populateClassDropdown(sel, role, 'Select Class');
  qaGenerateId();
}

function qaGenerateId() {
  var role = document.getElementById('qa_role').value;
  var preview = document.getElementById('qa_id_preview');
  if (!role || role === 'staff') {
    preview.textContent = 'Select division to generate';
    return;
  }
  var year = new Date().getFullYear();
  var prefixMap = {
    secondary: 'CFMS-SEC-' + year + '-',
    primary:   'CFMS-PRY-' + year + '-',
    nursery:   'CFMS-NUR-' + year + '-'
  };
  var prefix = prefixMap[role] || 'CFMS-STU-' + year + '-';
  var maxNum = 0;
  dbRecords.forEach(function(r) {
    if (r.studentId && r.studentId.indexOf(prefix) === 0) {
      var num = parseInt(r.studentId.slice(prefix.length), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  // Also account for IDs saved in this session but not yet in dbRecords
  preview.textContent = prefix + String(maxNum + 1).padStart(3, '0');
}

function quickSaveRecord() {
  var surname   = document.getElementById('qa_surname').value.trim();
  var firstname = document.getElementById('qa_firstname').value.trim();
  var othername = document.getElementById('qa_othername').value.trim();
  var dob       = document.getElementById('qa_dob').value;
  var gender    = document.getElementById('qa_gender').value;
  var role      = document.getElementById('qa_role').value;
  var classPos  = document.getElementById('qa_class').value;
  var campus    = document.getElementById('qa_campus').value;
  var phone     = document.getElementById('qa_phone').value.trim();
  var sid       = document.getElementById('qa_id_preview').textContent.trim();

  if (!surname)   { showToast('Please enter Surname ⚠️'); document.getElementById('qa_surname').focus(); return; }
  if (!firstname) { showToast('Please enter First Name ⚠️'); document.getElementById('qa_firstname').focus(); return; }
  if (!dob)       { showToast('Please enter Date of Birth ⚠️'); document.getElementById('qa_dob').focus(); return; }
  if (!gender)    { showToast('Please select Gender ⚠️'); return; }
  if (!role)      { showToast('Please select Division ⚠️'); return; }
  if (!classPos)  { showToast('Please select a Class ⚠️'); return; }
  if (!campus)    { showToast('Please select Campus ⚠️'); return; }
  if (!sid || sid === 'Select division to generate') { showToast('ID not generated — select Division first ⚠️'); return; }

  // Clash check
  var clash = dbRecords.find(function(r){ return r.studentId.toUpperCase() === sid.toUpperCase(); });
  if (clash) { qaGenerateId(); showToast('ID clash — regenerated, please save again ⚠️'); return; }

  // Get auto-subjects for this role/class
  var autoSubjects = [];
  if (CFMS_SUBJECTS[role]) {
    var groups = CFMS_SUBJECTS[role];
    Object.keys(groups).forEach(function(gName) {
      var isJSS = classPos.indexOf('JSS') === 0;
      var isSSS = classPos.indexOf('SSS') === 0;
      // For secondary: only include JSS subjects for JSS classes
      if (role === 'secondary') {
        if (isJSS && gName === 'Junior Secondary Subjects') {
          autoSubjects = autoSubjects.concat(groups[gName]);
        }
        // SSS — no auto-subjects (manual only)
      } else {
        // Nursery and Primary — all subjects auto-included
        if (CFMS_AUTOFILL_GROUPS.indexOf(gName) > -1) {
          autoSubjects = autoSubjects.concat(groups[gName]);
        }
      }
    });
  }

  var fullName = [surname, firstname, othername].filter(Boolean).join(' ');
  var record = {
    id:        'db_' + Date.now(),
    name:      fullName,
    surname:   surname,
    firstname: firstname,
    othername: othername,
    studentId: sid,
    dob:       dob,
    gender:    gender,
    role:      role,
    classPos:  classPos,
    campus:    campus,
    phone:     phone,
    passport:  qaPassportData || '',
    subjects:  autoSubjects
  };

  dbRecords.push(record);
  saveStudentToSheets(record, false);
  qaSessionCount++;
  showToast('✅ ' + fullName + ' saved! Ready for next student.');
  document.getElementById('qa_count').textContent = qaSessionCount + ' student' + (qaSessionCount === 1 ? '' : 's') + ' added this session';
  renderDB();
  updateDbStats();

  // Clear name/DOB fields only — keep division, class, campus, gender for next student
  document.getElementById('qa_surname').value   = '';
  document.getElementById('qa_firstname').value = '';
  document.getElementById('qa_othername').value = '';
  document.getElementById('qa_dob').value       = '';
  qaClearPassport(); // clear passport for next student
  document.getElementById('qa_surname').focus();
  qaGenerateId();
}

/* ── AUTO-GENERATE STUDENT / STAFF ID ── */
function updateDbClassField() {
  var role = document.getElementById('dbRole').value;
  var sel  = document.getElementById('dbClass');
  var txt  = document.getElementById('dbClassText');
  if (role === 'staff') {
    sel.style.display = 'none';
    txt.style.display = 'block';
  } else {
    sel.style.display = 'block';
    txt.style.display = 'none';
    populateClassDropdown(sel, role, 'Select Class');
  }
}

function autoGenerateDbId() {
  // Don't regenerate when editing an existing record
  if (document.getElementById('dbEditId').value) return;

  var role = document.getElementById('dbRole').value;
  var idField = document.getElementById('dbStudentId');
  if (!role) {
    idField.value = '';
    idField.placeholder = 'Select role to generate ID';
    return;
  }

  var year = new Date().getFullYear();
  var prefixMap = {
    secondary: 'CFMS-SEC-' + year + '-',
    primary:   'CFMS-PRY-' + year + '-',
    nursery:   'CFMS-NUR-' + year + '-',
    staff:     'CFMS-STF-' + year + '-'
  };
  var prefix = prefixMap[role] || 'CFMS-STU-' + year + '-';

  // Find the highest existing number for this prefix (gap-safe, never duplicates)
  var maxNum = 0;
  dbRecords.forEach(function(r) {
    if (r.studentId && r.studentId.indexOf(prefix) === 0) {
      var num = parseInt(r.studentId.slice(prefix.length), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });

  // Safety net for multi-device use: keep incrementing past any ID that's
  // already taken locally, in case another device just saved one we haven't synced yet
  var candidate = maxNum + 1;
  var taken = {};
  dbRecords.forEach(function(r){ if (r.studentId) taken[r.studentId.toUpperCase()] = true; });
  var newId = prefix + String(candidate).padStart(3, '0');
  while (taken[newId.toUpperCase()]) {
    candidate++;
    newId = prefix + String(candidate).padStart(3, '0');
  }

  idField.value = newId;
}

function openDbModal(editId) {
  dbPassportData = '';
  document.getElementById('dbEditId').value = editId || '';
  document.getElementById('dbModalTitle').textContent = editId ? 'Edit Record' : 'Add New Record';
  document.getElementById('dbPassportPlaceholder').style.display = 'block';
  document.getElementById('dbPassportPreview').style.display = 'none';
  document.getElementById('dbPassportPreview').src = '';

  if (editId) {
    var r = dbRecords.find(function(x){ return x.id === editId; });
    if (!r) return;
    var nameParts = r.name.split(' ');
    document.getElementById('dbSurname').value    = nameParts[0] || '';
    document.getElementById('dbFirstname').value  = nameParts[1] || '';
    document.getElementById('dbOthername').value  = nameParts.slice(2).join(' ') || '';
    document.getElementById('dbStudentId').value  = r.studentId;
    document.getElementById('dbDOB').value        = r.dob || '';
    document.getElementById('dbGender').value     = r.gender;
    document.getElementById('dbRole').value       = r.role;
    updateDbClassField();
    if (r.role === 'staff') {
      document.getElementById('dbClassText').value = r.classPos || '';
    } else {
      document.getElementById('dbClass').value = r.classPos || '';
    }
    document.getElementById('dbCampus').value     = r.campus;
    document.getElementById('dbPhone').value      = r.phone;
    // Load subjects for the role then restore checked
    loadDbSubjects(r.role, r.subjects || [], true);
    if (r.passport) {
      dbPassportData = r.passport;
      document.getElementById('dbPassportPlaceholder').style.display = 'none';
      document.getElementById('dbPassportPreview').src = r.passport;
      document.getElementById('dbPassportPreview').style.display = 'block';
    }
  } else {
    document.getElementById('dbSurname').value   = '';
    document.getElementById('dbFirstname').value = '';
    document.getElementById('dbOthername').value = '';
    document.getElementById('dbStudentId').value = '';
    document.getElementById('dbStudentId').placeholder = 'Select role to generate ID';
    document.getElementById('dbDOB').value       = '';
    document.getElementById('dbGender').value    = '';
    document.getElementById('dbRole').value      = '';
    document.getElementById('dbClass').innerHTML = '<option value="">Select Role/Division First</option>';
    document.getElementById('dbClassText').value = '';
    document.getElementById('dbClass').style.display = 'block';
    document.getElementById('dbClassText').style.display = 'none';
    document.getElementById('dbCampus').value    = '';
    document.getElementById('dbPhone').value     = '';
    loadSubjectCheckboxes('', []);
    // Quietly refresh from Sheets in the background so ID generation reflects
    // records added by other devices since this session last synced
    sheetsGet('get_students').then(function(data) {
      if (data && data.ok && data.students && data.students.length > 0) {
        dbRecords = data.students;
      }
    }).catch(function(){ /* offline — keep using local data */ });
  }
  document.getElementById('dbModal').classList.add('open');
}

function closeDbModal() {
  document.getElementById('dbModal').classList.remove('open');
  document.getElementById('dbPassportInput').value = '';
}

function editDbRecord(id) { openDbModal(id); }

function deleteDbRecord(id) {
  if (!confirm('Delete this record? This cannot be undone.')) return;
  dbRecords = dbRecords.filter(function(r){ return r.id !== id; });
  renderDB();
  updateDbStats();
  showToast('Record deleted 🗑');
}

function dbLoadPassport(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    dbPassportData = e.target.result;
    document.getElementById('dbPassportPlaceholder').style.display = 'none';
    document.getElementById('dbPassportPreview').src = dbPassportData;
    document.getElementById('dbPassportPreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function saveDbRecord() {
  var surname   = document.getElementById('dbSurname').value.trim();
  var firstname = document.getElementById('dbFirstname').value.trim();
  var other     = document.getElementById('dbOthername').value.trim();
  var sid       = document.getElementById('dbStudentId').value.trim();
  var dob       = document.getElementById('dbDOB').value;
  var gender    = document.getElementById('dbGender').value;
  var role      = document.getElementById('dbRole').value;
  var classPos  = (role === 'staff')
    ? document.getElementById('dbClassText').value.trim()
    : document.getElementById('dbClass').value.trim();
  var campus    = document.getElementById('dbCampus').value;
  var phone     = document.getElementById('dbPhone').value.trim();
  var editId    = document.getElementById('dbEditId').value;

  if (!surname)   { showToast('Please enter Surname ⚠️'); return; }
  if (!firstname) { showToast('Please enter First Name ⚠️'); return; }
  if (!role)      { showToast('Please select Role/Division ⚠️'); return; }
  if (!sid)       { showToast('ID not generated — please re-select Role ⚠️'); return; }
  if (!dob && role !== 'staff') { showToast('Please enter Date of Birth — it is the student portal login password ⚠️'); return; }
  if (!classPos) { showToast(role === 'staff' ? 'Please enter Position ⚠️' : 'Please select a Class ⚠️'); return; }
  if (!gender)    { showToast('Please select Gender ⚠️'); return; }
  if (!campus)    { showToast('Please select Campus ⚠️'); return; }

  // Final safety net: if another device just saved this exact ID, refuse and ask to regenerate
  if (!editId) {
    var clash = dbRecords.find(function(r){ return r.studentId.toUpperCase() === sid.toUpperCase(); });
    if (clash) {
      showToast('⚠️ That ID was just taken by another device — regenerating, please save again');
      autoGenerateDbId();
      return;
    }
  }

  // Get selected subjects
  var selectedSubjects = [];
  document.querySelectorAll('#dbSubjectsInner input[type=checkbox]:checked').forEach(function(cb){
    selectedSubjects.push(cb.value);
  });

  var fullName = [surname, firstname, other].filter(Boolean).join(' ');
  var record = {
    id:        editId || ('db_' + Date.now()),
    name:      fullName,
    surname:   surname,
    firstname: firstname,
    othername: other,
    studentId: sid,
    dob:       dob,
    gender:    gender,
    role:      role,
    classPos:  classPos,
    campus:    campus,
    phone:     phone,
    passport:  dbPassportData,
    subjects:  selectedSubjects
  };

  if (editId) {
    var idx = dbRecords.findIndex(function(r){ return r.id === editId; });
    if (idx > -1) dbRecords[idx] = record;
    saveStudentToSheets(record, true);
    showToast('Record updated ✅');
  } else {
    dbRecords.push(record);
    saveStudentToSheets(record, false);
    showToast('Record added ✅');
  }
  closeDbModal();
  renderDB();
  updateDbStats();
}

function exportCSV() {
  if (dbRecords.length === 0) { showToast('No records to export ⚠️'); return; }
  var rows = ['ID,Name,Student ID,Gender,Role,Class/Position,Campus,Phone,Subjects'];
  dbRecords.forEach(function(r) {
    rows.push([r.id, r.name, r.studentId, r.gender, r.role, r.classPos, r.campus, r.phone]
      .concat([r.subjects&&r.subjects.length>0?r.subjects.join(';'):'']).map(function(v){ return '"'+String(v||'').replace(/"/g,'""')+'"'; }).join(','));
  });
  var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'CFMS_Database_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  showToast('Database exported as CSV ✅');
}

/* Close modal on overlay click */
document.addEventListener('DOMContentLoaded', function() {
  var overlay = document.getElementById('dbModal');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeDbModal();
    });
  }
});


/* ── SUBJECTS PER DIVISION ── */
var CFMS_SUBJECTS = {
  nursery: {
    'Nursery Subjects': [
      'English Studies',
      'Mathematics',
      'Asụsụ Igbo',
      'Food and Nutrition',
      'Health Habit',
      'Social Habit',
      'General Science',
      'Computer Studies',
      'Christian Religious Studies',
      'Writing',
      'Poems',
      'Colouring',
      'Verbal Reasoning',
      'Quantitative',
      'Summative Test'
    ]
  },
  primary: {
    'Primary Subjects': [
      'English',
      'Mathematics',
      'Igbo',
      'Basic Science',
      'Basic Technology',
      'Home Economics',
      'Social Studies',
      'Civic Education',
      'Security Education',
      'C.R.S',
      'C.C.A',
      'Agricultural Science',
      'P.H.E',
      'Computer Studies',
      'Verbal Reasoning',
      'Quantitative Reasoning',
      'Drawing',
      'Writing',
      'French',
      'Craft',
      'Vocational Studies'
    ]
  },
  secondary: {
    'Junior Secondary Subjects': [
      'Mathematics',
      'English Language',
      'Igbo Language',
      'Livestock Farming',
      'Social and Citizenship Education',
      'Home Economics',
      'Business Studies',
      'Cultural and Creative Art',
      'Physical and Health Education',
      'Intermediate Science',
      'Christian Religious Studies',
      'Digital Technologies',
      'Nigerian History',
      'Craft'
    ],
    'SS Science Stream (select manually)': [
      'English Language',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Further Mathematics',
      'Agricultural Science',
      'Computer Science'
    ],
    'SS Commercial Stream (select manually)': [
      'English Language',
      'Mathematics',
      'Financial Accounting',
      'Commerce',
      'Economics',
      'Office Practice',
      'Computer Studies',
      'Marketing'
    ],
    'SS Arts Stream (select manually)': [
      'English Language',
      'Mathematics',
      'Literature in English',
      'Government',
      'Christian Religious Studies (CRS)',
      'Igbo Language',
      'History',
      'Fine Art',
      'French'
    ]
  },
  staff: {}
};

// Subject groups that should be auto-checked (ticked) by default — JSS, Primary, Nursery
// SS stream groups are intentionally left OUT of this list so they stay manual/unchecked
var CFMS_AUTOFILL_GROUPS = [
  'Nursery Subjects',
  'Primary Subjects',
  'Junior Secondary Subjects'
];

function loadDbSubjects(role, preSelected, isEdit) {
  var wrap  = document.getElementById('dbSubjectsWrap');
  var inner = document.getElementById('dbSubjectsInner');
  var tags  = document.getElementById('dbSelectedSubjTags');

  if (!role || role === 'staff' || !CFMS_SUBJECTS[role]) {
    wrap.style.display = 'none';
    inner.innerHTML = '';
    return;
  }

  wrap.style.display = 'block';
  preSelected = preSelected || [];
  var isEditing = !!isEdit;

  var groups = CFMS_SUBJECTS[role];
  var groupNames = Object.keys(groups);

  // For secondary, only show the group matching the selected class:
  // JSS classes -> Junior Secondary Subjects (auto-filled)
  // SSS classes -> the matching stream is NOT auto-picked here (no stream field yet),
  // so show all three SS streams and let the admin tick manually.
  if (role === 'secondary') {
    var cls = (document.getElementById('dbClass').value || '');
    if (cls.indexOf('JSS') === 0) {
      groupNames = ['Junior Secondary Subjects'];
    } else if (cls.indexOf('SSS') === 0) {
      groupNames = groupNames.filter(function(g){ return g !== 'Junior Secondary Subjects'; });
    }
    // If no class selected yet, show everything (fallback) so nothing looks broken
  }

  var html = '';
  groupNames.forEach(function(groupName) {
    var isAutofillGroup = CFMS_AUTOFILL_GROUPS.indexOf(groupName) > -1;
    html += '<div class="subj-section-title">' + groupName +
      (isAutofillGroup ? ' <span style="color:var(--green);font-size:11px;font-weight:600">(auto-selected)</span>' : '') +
      '</div>';
    html += '<div class="subj-grid">';
    groups[groupName].forEach(function(subj) {
      // Auto-check subjects in autofill groups when adding a NEW record (not editing).
      // When editing, only respect what was actually saved (preSelected) — even if empty.
      var shouldCheck = isEditing
        ? preSelected.indexOf(subj) > -1
        : isAutofillGroup;
      var checked = shouldCheck ? 'checked' : '';
      html += '<label class="subj-check">' +
        '<input type="checkbox" value="' + subj + '" ' + checked + ' onchange="updateSubjTags()">' +
        subj + '</label>';
    });
    html += '</div>';
  });
  inner.innerHTML = html;
  updateSubjTags();
}

// Called when the Class dropdown changes, to refresh which subject group shows (JSS vs SSS)
function onDbClassChanged() {
  var role = document.getElementById('dbRole').value;
  var editId = document.getElementById('dbEditId').value;
  if (editId) {
    var r = dbRecords.find(function(x){ return x.id === editId; });
    loadDbSubjects(role, (r && r.subjects) || [], true);
  } else {
    loadDbSubjects(role, [], false);
  }
}

function updateSubjTags() {
  var tags = document.getElementById('dbSelectedSubjTags');
  var checked = [];
  document.querySelectorAll('#dbSubjectsInner input[type=checkbox]:checked').forEach(function(cb){
    checked.push(cb.value);
  });
  if (checked.length === 0) {
    tags.innerHTML = '<span style="color:var(--gray);font-size:12px">None selected</span>';
  } else {
    tags.innerHTML = checked.map(function(s){
      return '<span class="subj-tag">' + s + '</span>';
    }).join('');
  }
}

// Listen for role change to update subjects
document.addEventListener('DOMContentLoaded', function() {
  var roleEl = document.getElementById('dbRole');
  if (roleEl) {
    roleEl.addEventListener('change', function() {
      loadDbSubjects(this.value, []);
    });
  }
});


/* ── SUBJECT CHECKBOXES ── */
var CFMS_SUBJECTS_FLAT = {
  nursery: [
    { name:'English Language (Phonics)', core:true },
    { name:'Numbers & Counting', core:true },
    { name:'Colours & Shapes', core:true },
    { name:'Rhymes & Songs', core:true },
    { name:'Oral Igbo Language', core:true },
    { name:'Bible / CRS Stories', core:true },
    { name:'Drawing & Colouring', core:false },
    { name:'Handwriting (Pre-writing)', core:false },
    { name:'Physical Play & Motor Skills', core:false },
    { name:'Social Skills & Manners', core:false },
    { name:'Music & Dance', core:false },
    { name:'Environmental Studies', core:false },
  ],
  primary: [
    { name:'English Language', core:true },
    { name:'Mathematics', core:true },
    { name:'Basic Science & Technology', core:true },
    { name:'Social Studies', core:true },
    { name:'Igbo Language', core:true },
    { name:'Christian Religious Studies (CRS)', core:true },
    { name:'Civic Education', core:true },
    { name:'Computer Studies', core:true },
    { name:'Physical & Health Education', core:false },
    { name:'Agricultural Science', core:false },
    { name:'Fine & Creative Arts', core:false },
    { name:'Home Economics (Pry 4–6)', core:false },
    { name:'Cultural & Creative Arts', core:false },
    { name:'Security Education', core:false },
  ],
  secondary: [
    // JSS Core
    { name:'English Language', core:true },
    { name:'Mathematics', core:true },
    { name:'Basic Science', core:true },
    { name:'Basic Technology', core:true },
    { name:'Social Studies', core:true },
    { name:'Christian Religious Studies (CRS)', core:true },
    { name:'Civic Education', core:true },
    { name:'Igbo Language', core:true },
    { name:'Computer Studies', core:true },
    { name:'Agricultural Science', core:false },
    { name:'Business Studies', core:false },
    { name:'Home Economics', core:false },
    { name:'Fine & Applied Arts', core:false },
    { name:'French', core:false },
    { name:'Physical & Health Education', core:false },
    // SS Core
    { name:'Literature in English', core:true },
    { name:'Economics', core:false },
    { name:'Government', core:false },
    { name:'Commerce', core:false },
    { name:'Accounts (Financial Accounting)', core:false },
    { name:'Physics', core:false },
    { name:'Chemistry', core:false },
    { name:'Biology', core:false },
    { name:'Further Mathematics', core:false },
    { name:'Geography', core:false },
    { name:'History', core:false },
    { name:'Visual Arts', core:false },
    { name:'Technical Drawing', core:false },
    { name:'Food & Nutrition', core:false },
    { name:'Yoruba Language', core:false },
  ],
  staff: [
    { name:'N/A — Staff Member', core:true }
  ]
};

function loadSubjectCheckboxes(role, selected) {
  return loadDbSubjects(role, selected);
}


/* ── DATABASE ID CARD TAB ── */
var dbIdPassportData = '';

/* switchDbTab consolidated below */

function dbIdSearchRender() {
  var q   = (document.getElementById('dbIdSearch').value || '').toLowerCase();
  var res = document.getElementById('dbIdSearchResults');
  if (!q) { res.style.display = 'none'; return; }
  var hits = dbRecords.filter(function(r){
    return r.name.toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q);
  }).slice(0, 8);
  if (hits.length === 0) { res.style.display = 'none'; return; }
  res.style.display = 'block';
  res.innerHTML = '';
  hits.forEach(function(r) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:10px 14px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-size:13px';
    div.innerHTML = '<strong>' + r.name + '</strong> &nbsp;<span style="color:var(--gray);font-size:11px">' + r.studentId + ' · ' + (r.classPos||r.role) + '</span>';
    div.addEventListener('mouseover', function(){ this.style.background = '#f9fdf9'; });
    div.addEventListener('mouseout',  function(){ this.style.background = 'white'; });
    div.addEventListener('click', function(){ dbFillFromRecord(r.id); });
    res.appendChild(div);
  });
}

function dbFillFromRecord(id) {
  var r = dbRecords.find(function(x){ return x.id === id; });
  if (!r) return;
  var nameParts = r.name.split(' ');
  document.getElementById('idf_surname').value   = nameParts[0] || '';
  document.getElementById('idf_firstname').value = nameParts.slice(1).join(' ') || '';
  document.getElementById('idf_idno').value      = r.studentId;
  document.getElementById('idf_class').value     = r.classPos || '';
  document.getElementById('idf_campus').value    = r.campus || 'Main Campus';
  document.getElementById('idf_year').value      = '';
  document.getElementById('idf_expiry').value    = '';
  document.getElementById('dbIdSearch').value    = r.name + ' — ' + r.studentId;
  document.getElementById('dbIdSearchResults').style.display = 'none';

  // Load passport
  dbIdPassportData = r.passport || '';
  if (r.passport) {
    document.getElementById('idf_passport_ph').style.display   = 'none';
    document.getElementById('idf_passport_prev').style.display = 'block';
    document.getElementById('idf_passport_prev').src           = r.passport;
  } else {
    document.getElementById('idf_passport_ph').style.display   = 'block';
    document.getElementById('idf_passport_prev').style.display = 'none';
    document.getElementById('idf_passport_prev').src           = '';
  }
  dbLiveCard();
}

function dbLoadIdPassport(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    dbIdPassportData = e.target.result;
    document.getElementById('idf_passport_ph').style.display   = 'none';
    document.getElementById('idf_passport_prev').src           = dbIdPassportData;
    document.getElementById('idf_passport_prev').style.display = 'block';
    dbLiveCard();
  };
  reader.readAsDataURL(file);
}

function dbLiveCard() {
  var surname   = document.getElementById('idf_surname').value.trim();
  var firstname = document.getElementById('idf_firstname').value.trim();
  if (!surname && !firstname) return;

  var fullName = (surname.toUpperCase() + ' ' + firstname).trim();
  var idno     = document.getElementById('idf_idno').value.trim()    || 'CFMS-0000-000';
  var cls      = document.getElementById('idf_class').value.trim()   || '—';
  var year     = document.getElementById('idf_year').value.trim()    || '—';
  var campus   = document.getElementById('idf_campus').value         || 'Main Campus';
  var expiry   = document.getElementById('idf_expiry').value.trim()  || '—';

  document.getElementById('dbIdCardEmpty').style.display  = 'none';
  document.getElementById('dbIdCardOutput').style.display = 'block';

  document.getElementById('dbidc_name').textContent    = fullName;
  document.getElementById('dbidc_class').textContent   = cls;
  document.getElementById('dbidc_entry').textContent   = year;
  document.getElementById('dbidc_campus').textContent  = campus;
  document.getElementById('dbidc_idno').textContent    = idno;
  document.getElementById('dbidc_b_idno').textContent  = idno;
  document.getElementById('dbidc_b_name').textContent  = fullName;
  document.getElementById('dbidc_b_class').textContent = cls;
  document.getElementById('dbidc_b_campus').textContent= campus;
  document.getElementById('dbidc_b_expiry').textContent= expiry === '—' ? '—' : 'Dec ' + expiry;
  document.getElementById('dbidc_barcode_text').textContent = idno;

  // Determine type badge
  var badge = cls.startsWith('JSS')||cls.startsWith('SS') ? 'Secondary' : cls.toLowerCase().includes('primary') ? 'Primary' : cls.toLowerCase().includes('nursery')||cls.toLowerCase().includes('creche') ? 'Nursery' : 'Student';
  document.getElementById('dbidc_type').textContent = badge;

  // Passport
  var passEl = document.getElementById('dbidc_passport');
  if (dbIdPassportData) {
    if (passEl.tagName === 'DIV') {
      var img = document.createElement('img');
      img.id        = 'dbidc_passport';
      img.className = 'idc-passport';
      img.src       = dbIdPassportData;
      img.alt       = 'Passport';
      passEl.parentNode.replaceChild(img, passEl);
    } else {
      passEl.src = dbIdPassportData;
    }
  }

  // Barcode lines
  var bc = document.getElementById('dbIdcBarcodeLines');
  if (bc && bc.children.length === 0) {
    [2,1,3,1,2,1,1,3,2,1,2,3,1,2,1,3,2,1,1,2,3,1,2,1,2,1,3,2,1,2].forEach(function(w,i){
      var d = document.createElement('div');
      d.style.width  = w + 'px';
      d.style.height = (i%3===0?20:14) + 'px';
      d.style.background = '#222';
      d.style.borderRadius = '1px';
      bc.appendChild(d);
    });
  }
}

function dbPrintIdCard() {
  var front = document.getElementById('dbIdcFront');
  var back  = document.getElementById('dbIdcBack');
  if (!front||!back) { showToast('Please fill in student details first ⚠️'); return; }
  var w = window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CFMA ID Card</title>' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{background:white;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;font-family:Arial,sans-serif;gap:12px}' +
    '.id-card{width:85.6mm;min-height:54mm;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.2)}' +
    '.idc-front{background:linear-gradient(160deg,#004D26,#006B35,#008A44);padding:0 0 8px;position:relative}' +
    '.idc-front-header{background:rgba(0,0,0,.2);padding:5px 8px;display:flex;align-items:center;gap:6px;border-bottom:1.5px solid #C8981A}' +
    '.idc-school-name{color:white;font-size:5.5px;font-weight:700;text-transform:uppercase;letter-spacing:.2px;line-height:1.3}' +
    '.idc-school-motto{color:rgba(255,255,255,.55);font-size:4.5px;font-style:italic;margin-top:1px}' +
    '.idc-body{padding:7px 8px 0;display:flex;gap:7px;align-items:flex-start}' +
    '.idc-passport{width:38px;height:46px;border-radius:3px;object-fit:cover;border:1.5px solid #C8981A;flex-shrink:0}' +
    '.idc-info{flex:1}.idc-label{font-size:4.5px;color:#F5C842;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:1px;margin-top:4px}.idc-label:first-child{margin-top:0}' +
    '.idc-value{font-size:7px;color:white;font-weight:700;line-height:1.2}.idc-value.large{font-size:8px}' +
    '.idc-id-band{background:#C8981A;margin:6px 8px 0;border-radius:2px;padding:3px 6px;display:flex;justify-content:space-between;align-items:center}' +
    '.idc-id-band span{font-size:4.5px;color:#004D26;font-weight:700;text-transform:uppercase;letter-spacing:.3px}.idc-id-band strong{font-size:7.5px;color:#004D26;font-weight:900;letter-spacing:.5px}' +
    '.idc-type-badge{position:absolute;top:6px;right:6px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:white;font-size:4.5px;font-weight:700;padding:2px 5px;border-radius:2px;text-transform:uppercase}' +
    '.idc-back{background:white;padding:0 0 8px}.idc-back-header{background:#004D26;padding:5px 8px;border-bottom:1.5px solid #C8981A}' +
    '.idc-back-header p{color:rgba(255,255,255,.7);font-size:5px;text-align:center;text-transform:uppercase;letter-spacing:.3px}' +
    '.idc-back-body{padding:5px 8px}.idc-back-row{display:flex;justify-content:space-between;padding:2.5px 0;border-bottom:1px solid #f0f0f0;font-size:6px}.idc-back-row:last-child{border-bottom:none}' +
    '.idc-back-row span{color:#888;font-size:5px;font-weight:600;text-transform:uppercase}.idc-back-row strong{color:#222;font-weight:700}' +
    '.idc-barcode{margin:5px 8px 0;background:#f5f5f5;border-radius:2px;padding:4px;text-align:center}' +
    '.idc-barcode-lines{display:flex;gap:1px;justify-content:center;margin-bottom:2px;height:12px;align-items:flex-end}.idc-barcode-lines div{background:#222;border-radius:1px}' +
    '.idc-barcode p{font-size:5px;color:#888;letter-spacing:1.5px;font-family:monospace}' +
    '.idc-back-footer{margin:5px 8px 0;background:#f9f9f9;border:1px solid #eee;border-radius:2px;padding:4px 6px;font-size:5px;color:#888;line-height:1.5;text-align:center}' +
    '.btn{margin-top:14px;background:#006B35;color:white;border:none;padding:10px 28px;border-radius:4px;font-size:14px;font-weight:700;cursor:pointer}' +
    '@media print{.btn{display:none}@page{size:85.6mm 54mm;margin:0}body{padding:0;gap:0;display:block}.id-card{box-shadow:none;page-break-after:always;width:85.6mm;min-height:54mm}}' +
    '</style></head><body>' +
    '<div class="id-card">' + front.innerHTML + '</div>' +
    '<div class="id-card">' + back.innerHTML  + '</div>' +
    '<button class="btn" onclick="window.print()">🖨 Print / Save PDF</button>' +
    '</body></html>');
  w.document.close();
}

function dbSavePdf() {
  dbPrintIdCard();
  setTimeout(function(){ showToast('In the print dialog → choose Save as PDF 💾'); }, 800);
}


/* ── ADMIN PRINT RESULTS ── */
var prCurrentRows = [];
var prCurrentStudent = null;

function prAutoSuggest() {
  var q   = (document.getElementById('prStudentId').value || '').toLowerCase();
  var box = document.getElementById('prAutoSuggestBox');
  if (!q || q.length < 2) { box.style.display = 'none'; return; }

  var hits = [];
  var seen = {};
  resultsDB.forEach(function(r) {
    var key = r.studentId.toUpperCase();
    if (!seen[key] && (r.studentId.toLowerCase().includes(q) || r.studentName.toLowerCase().includes(q))) {
      seen[key] = true;
      hits.push({ id: r.studentId, name: r.studentName, cls: r.studentClass || '—' });
    }
  });
  dbRecords.forEach(function(r) {
    var key = r.studentId.toUpperCase();
    if (!seen[key] && (r.studentId.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))) {
      seen[key] = true;
      hits.push({ id: r.studentId, name: r.name, cls: r.classPos || r.role });
    }
  });

  if (hits.length === 0) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = '';
  hits.slice(0, 8).forEach(function(h) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:9px 14px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-size:13px';
    div.innerHTML = '<strong>' + h.name + '</strong> <span style="color:#666;font-size:11px">· ' + h.id + ' · ' + h.cls + '</span>';
    div.addEventListener('mouseover', function(){ this.style.background = '#f0f7f0'; });
    div.addEventListener('mouseout',  function(){ this.style.background = 'white'; });
    div.addEventListener('click', function(){ prSelectStudent(h.id, h.name); });
    box.appendChild(div);
  });
}

function prSelectStudent(id, name) {
  document.getElementById('prStudentId').value = id;
  document.getElementById('prAutoSuggestBox').style.display = 'none';
  adminSearchResults();
}

function adminSearchResults() {
  var rawId = document.getElementById('prStudentId').value.trim().toUpperCase();
  var term  = document.getElementById('prTerm').value;
  var year  = document.getElementById('prYear').value;
  var preview   = document.getElementById('prResultsPreview');
  var noResults = document.getElementById('prNoResults');

  if (!rawId)  { showToast('Please enter a Student ID or Name ⚠️'); return; }
  if (!term)   { showToast('Please select a Term ⚠️'); return; }
  if (!year)   { showToast('Please select an Academic Year ⚠️'); return; }

  // Try exact ID match first, then name match
  var rows = resultsDB.filter(function(r) {
    return r.studentId.toUpperCase() === rawId && r.term === term && r.year === year;
  });

  // If no exact match, try partial name search
  if (rows.length === 0) {
    var nameLower = rawId.toLowerCase();
    rows = resultsDB.filter(function(r) {
      return r.studentName.toLowerCase().includes(nameLower) && r.term === term && r.year === year;
    });
  }

  if (rows.length === 0) {
    preview.style.display   = 'none';
    noResults.style.display = 'block';
    showToast('No results found ❌');
    return;
  }

  noResults.style.display = 'none';
  preview.style.display   = 'block';
  prCurrentRows = rows;

  var studentName  = rows[0].studentName;
  var studentId    = rows[0].studentId;
  var studentClass = rows[0].studentClass || '—';
  var classStats   = computeClassAverageAndPosition(studentId, studentClass, term, year);
  var avg = classStats.average || Math.round(rows.reduce(function(s,r){ return s+r.total; }, 0) / rows.length);
  var gradeInfo = calcGrade(avg);
  prCurrentStudent = { name: studentName, id: studentId, cls: studentClass, term: term, year: year, avg: avg, grade: gradeInfo.grade };

  // Summary card
  document.getElementById('prSummaryName').textContent  = studentName;
  document.getElementById('prSummaryId').textContent    = studentId;
  document.getElementById('prSummaryClass').textContent = studentClass;
  document.getElementById('prSummaryTerm').textContent   = term + ' — ' + year;
  document.getElementById('prSummaryAvg').textContent    = avg + '%';
  document.getElementById('prSummaryPosition').textContent = classStats.position
    ? classStats.position + (classStats.totalInClass ? ' of ' + classStats.totalInClass + ' in class' : ' in class')
    : '';

  // Try to find passport from dbRecords
  var personRecord = dbRecords.find(function(r){ return r.studentId.toUpperCase() === studentId.toUpperCase(); });
  var passportEl   = document.getElementById('prStudentPassport');
  if (personRecord && personRecord.passport) {
    passportEl.innerHTML = '<img src="'+personRecord.passport+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
  } else {
    passportEl.innerHTML = '👤';
  }

  // Footer summary
  document.getElementById('prFooterAvg').textContent     = avg + '/100';
  document.getElementById('prFooterPosition').textContent= classStats.position || '—';
  document.getElementById('prFooterGrade').innerHTML     = '<span class="grade-badge ' + getGradeClass(gradeInfo.grade) + '">' + gradeInfo.grade + '</span>';
  document.getElementById('prFooterRemark').textContent  = gradeInfo.remarks;

  // Table rows
  var body = document.getElementById('prResultsBody');
  body.innerHTML = rows.map(function(r, i) {
    return '<tr style="border-bottom:1px solid #f0f0f0">' +
      '<td style="padding:10px 14px;color:var(--gray)">' + (i+1) + '</td>' +
      '<td style="padding:10px 14px;font-weight:600">' + r.subject + '</td>' +
      '<td style="padding:10px 14px;text-align:center">' + r.ca + '</td>' +
      '<td style="padding:10px 14px;text-align:center">' + r.exam + '</td>' +
      '<td style="padding:10px 14px;text-align:center;font-weight:700">' + r.total + '</td>' +
      '<td style="padding:10px 14px;text-align:center;font-weight:600;color:#555">' + (r.subjectPosition || '—') + '</td>' +
      '<td style="padding:10px 14px;text-align:center"><span class="grade-badge ' + getGradeClass(r.grade) + '">' + r.grade + '</span></td>' +
      '<td style="padding:10px 14px;color:var(--gray)">' + r.remarks + '</td>' +
    '</tr>';
  }).join('');

  showToast('Results loaded for ' + studentName + ' ✅');
}

function buildResultSlipHTML(rows, student, forPDF) {
  var gradeRows = rows.map(function(r, i) {
    return '<tr style="border-bottom:1px solid #eee">' +
      '<td style="padding:8px 12px">' + (i+1) + '</td>' +
      '<td style="padding:8px 12px;font-weight:600">' + r.subject + '</td>' +
      '<td style="padding:8px 12px;text-align:center">' + r.ca + '</td>' +
      '<td style="padding:8px 12px;text-align:center">' + r.exam + '</td>' +
      '<td style="padding:8px 12px;text-align:center;font-weight:700;font-size:15px">' + r.total + '</td>' +
      '<td style="padding:8px 12px;text-align:center;font-weight:600;color:#555">' + (r.subjectPosition || '—') + '</td>' +
      '<td style="padding:8px 12px;text-align:center"><span style="padding:3px 10px;border-radius:100px;font-size:12px;font-weight:700;background:' +
        (r.grade==='A'?'rgba(5,150,105,.1)':r.grade==='B'?'rgba(59,130,246,.1)':r.grade==='C'?'rgba(245,158,11,.1)':'rgba(239,68,68,.1)') + ';color:' +
        (r.grade==='A'?'#047857':r.grade==='B'?'#1D4ED8':r.grade==='C'?'#B45309':'#B91C1C') + '">' + r.grade + '</span></td>' +
      '<td style="padding:8px 12px;color:#666">' + r.remarks + '</td>' +
    '</tr>';
  }).join('');

  var personRecord = dbRecords.find(function(r){ return r.studentId.toUpperCase() === student.id.toUpperCase(); });
  var passportImg  = (personRecord && personRecord.passport)
    ? '<img src="'+personRecord.passport+'" style="width:80px;height:80px;object-fit:cover;border-radius:4px;border:2px solid #006B35">'
    : '<div style="width:80px;height:80px;border:2px solid #006B35;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#ccc;background:#f5f5f5">👤</div>';

  // Compute overall average and position in class live from resultsDB
  var classStats = computeClassAverageAndPosition(student.id, student.cls, student.term, student.year);
  var avg       = classStats.average || student.avg;
  var posInClass= classStats.position || '—';
  var totalInClass = classStats.totalInClass || '';
  var gradeInfo = calcGrade(avg);
  var school    = (rows[0] && rows[0].school) ? rows[0].school : 'Christ the Foundation Model Academy';

  // "Others" section — Attendance / Teacher Comment / Affective Skills (take from most recent row that has them)
  var attendance = '', teacherComment = '', affectiveSkills = '';
  for (var i = rows.length - 1; i >= 0; i--) {
    if (!attendance && rows[i].attendance) attendance = rows[i].attendance;
    if (!teacherComment && rows[i].teacherComment) teacherComment = rows[i].teacherComment;
    if (!affectiveSkills && rows[i].affectiveSkills) affectiveSkills = rows[i].affectiveSkills;
  }

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Result Slip — ' + student.name + '</title>' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#222;background:white;padding:30px}' +
    '.slip{max-width:700px;margin:0 auto;border:2px solid #006B35;border-radius:8px;overflow:hidden}' +
    '.slip-head{background:#004D26;padding:20px 24px;display:flex;align-items:center;gap:16px}' +
    '.slip-school{color:white}.slip-school h1{font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:.5px}' +
    '.slip-school p{font-size:11px;color:rgba(255,255,255,.7);margin-top:3px;font-style:italic}' +
    '.slip-title{background:#C8981A;padding:8px 24px;text-align:center;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#004D26}' +
    '.slip-info{padding:16px 24px;display:flex;gap:20px;border-bottom:2px solid #e0e0e0;align-items:flex-start}' +
    '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;flex:1}' +
    '.info-item{font-size:13px}.info-item .label{color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700}' +
    '.info-item .val{font-weight:700;color:#004D26;font-size:15px;margin-top:2px}' +
    '.avg-box{background:#004D26;color:white;padding:12px 18px;border-radius:6px;text-align:center;min-width:110px}' +
    '.avg-box .label{font-size:10px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px}' +
    '.avg-box .val{font-size:28px;font-weight:900;color:#C8981A}' +
    '.avg-box .pos{font-size:11px;color:white;font-weight:700;margin-top:4px}' +
    'table{width:100%;border-collapse:collapse}thead tr{background:#004D26;color:white}' +
    'th{padding:10px 12px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}' +
    'th:nth-child(3),th:nth-child(4),th:nth-child(5),th:nth-child(6),th:nth-child(7){text-align:center}' +
    '.foot-row{background:#f5f5f5;font-weight:700}' +
    '.foot-row td{padding:10px 12px;font-size:13px;color:#004D26}' +
    '.others-box{padding:16px 24px;border-top:2px solid #e0e0e0;background:#fafafa}' +
    '.others-box h4{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:10px}' +
    '.others-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}' +
    '.others-item{font-size:13px}.others-item .ol{color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:3px}' +
    '.others-item .ov{color:#222;font-weight:600}' +
    '.sig-box{padding:14px 24px;border-top:2px solid #e0e0e0;display:flex;justify-content:flex-end}' +
    '.sig-inner{text-align:center}' +
    '.sig-img{height:48px;object-fit:contain;display:block;margin:0 auto 2px}' +
    '.sig-line{width:160px;border-top:1.5px solid #333;margin:0 auto 4px}' +
    '.sig-label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;font-weight:700}' +
    '.slip-foot{padding:14px 24px;display:flex;justify-content:space-between;align-items:center;border-top:2px solid #e0e0e0;font-size:11px;color:#888;flex-wrap:wrap;gap:10px}' +
    '.stamp{border:2px solid #006B35;border-radius:4px;padding:6px 14px;color:#006B35;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1px}' +
    '.btn{display:block;width:fit-content;margin:20px auto 0;background:#006B35;color:white;border:none;padding:12px 32px;border-radius:4px;font-size:14px;font-weight:700;cursor:pointer}' +
    '@media print{.btn{display:none}body{padding:0}@page{margin:10mm}}' +
    '</style></head><body>' +
    '<div class="slip">' +
      '<div class="slip-head">' + passportImg +
        '<div class="slip-school"><h1>' + school + '</h1><p>Consolidated Knowledge Through Education · Est. 1998 · cfmsanambra.org</p><p style="margin-top:4px;font-size:11px;color:rgba(255,255,255,.5)">Okija, Ihiala, Anambra State · +234 806 268 6710</p></div>' +
      '</div>' +
      '<div class="slip-title">Student Academic Result Slip</div>' +
      '<div class="slip-info">' +
        '<div class="info-grid">' +
          '<div class="info-item"><div class="label">Student Name</div><div class="val">' + student.name + '</div></div>' +
          '<div class="info-item"><div class="label">Student ID</div><div class="val">' + student.id + '</div></div>' +
          '<div class="info-item"><div class="label">Class</div><div class="val">' + student.cls + '</div></div>' +
          '<div class="info-item"><div class="label">Term / Year</div><div class="val">' + student.term + ' · ' + student.year + '</div></div>' +
        '</div>' +
        '<div class="avg-box"><div class="label">Average</div><div class="val">' + avg + '%</div>' +
          '<div class="pos">' + posInClass + (totalInClass ? ' of ' + totalInClass : '') + ' in class</div></div>' +
      '</div>' +
      '<table><thead><tr><th>#</th><th>Subject</th><th style="text-align:center">CA (40)</th><th style="text-align:center">Exam (60)</th><th style="text-align:center">Total</th><th style="text-align:center">Position</th><th style="text-align:center">Grade</th><th>Remarks</th></tr></thead>' +
      '<tbody>' + gradeRows + '</tbody>' +
      '<tfoot><tr class="foot-row"><td colspan="4">Overall Average Score</td><td style="text-align:center;font-size:15px">' + avg + '/100</td><td style="text-align:center;font-size:13px">' + posInClass + '</td><td style="text-align:center;font-size:15px">' + gradeInfo.grade + '</td><td>' + gradeInfo.remarks + '</td></tr></tfoot>' +
      '</table>' +
      '<div class="others-box">' +
        '<h4>Other Remarks</h4>' +
        '<div class="others-grid">' +
          '<div class="others-item"><div class="ol">Attendance</div><div class="ov">' + (attendance || 'Not recorded') + '</div></div>' +
          '<div class="others-item"><div class="ol">Affective &amp; Psychomotor Skills</div><div class="ov">' + (affectiveSkills || 'Not recorded') + '</div></div>' +
          '<div class="others-item" style="grid-column:1 / -1"><div class="ol">Teacher / Principal Comment</div><div class="ov">' + (teacherComment || 'Not recorded') + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="sig-box">' +
        '<div class="sig-inner">' +
          '<img class="sig-img" src="assets/img/img_07.png" alt="Signature">' +
          '<div class="sig-line"></div>' +
          '<div class="sig-label">Authorised Signature</div>' +
        '</div>' +
      '</div>' +
      '<div class="slip-foot">' +
        '<div><strong>Printed by:</strong> CFMA Admin &nbsp;|&nbsp; <strong>Date:</strong> ' + new Date().toLocaleDateString('en-NG') + '</div>' +
        '<div class="stamp">Official Result Slip</div>' +
      '</div>' +
    '</div>' +
    '<button class="btn" onclick="window.print()">🖨 Print / Save PDF</button>' +
    '</body></html>';
}

function adminPrintResult() {
  if (!prCurrentRows.length || !prCurrentStudent) { showToast('Please search for a student first ⚠️'); return; }
  var w = window.open('','_blank');
  w.document.write(buildResultSlipHTML(prCurrentRows, prCurrentStudent, false));
  w.document.close();
}

function adminSaveResultPDF() {
  adminPrintResult();
  setTimeout(function(){ showToast('In the print dialog → choose "Save as PDF" 💾'); }, 800);
}

function adminPrintAllResults() {
  var term = document.getElementById('prTerm').value;
  var year = document.getElementById('prYear').value;
  if (!term || !year) { showToast('Please select Term and Year first ⚠️'); return; }

  // Group results by student
  var students = {};
  resultsDB.filter(function(r){ return r.term===term && r.year===year; }).forEach(function(r){
    if (!students[r.studentId]) students[r.studentId] = { rows:[], name:r.studentName, id:r.studentId, cls:r.studentClass||'—', term:term, year:year };
    students[r.studentId].rows.push(r);
  });

  var keys = Object.keys(students);
  if (keys.length === 0) { showToast('No results uploaded for this term and year ⚠️'); return; }

  var w = window.open('','_blank');
  var combined = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>All Results — '+term+' '+year+'</title>' +
    '<style>@media print{.page-break{page-break-after:always}}body{font-family:Arial,sans-serif;padding:20px}' +
    '.btn{background:#006B35;color:white;border:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:700;cursor:pointer;display:block;margin:20px auto}' +
    '@media print{.btn{display:none}}</style></head><body>' +
    '<button class="btn" onclick="window.print()">🖨 Print All / Save PDF</button>';

  keys.forEach(function(sid, i) {
    var s = students[sid];
    var avg = Math.round(s.rows.reduce(function(acc,r){return acc+r.total;},0)/s.rows.length);
    var studentObj = { name:s.name, id:s.id, cls:s.cls, term:s.term, year:s.year, avg:avg, grade:calcGrade(avg).grade };
    var slipBody = buildResultSlipHTML(s.rows, studentObj, true);
    var bodyContent = slipBody.substring(slipBody.indexOf('<div class="slip">'), slipBody.lastIndexOf('</div>'));
    combined += '<div class="page-break">' + bodyContent + '</div></div>';
  });

  combined += '</body></html>';
  w.document.write(combined);
  w.document.close();
  showToast('Printing ' + keys.length + ' result slips ✅');
}

/* Update switchDbTab to handle printresults tab */
function switchDbTab(tab, btn) {
  dbCurrentTab = tab;
  document.querySelectorAll('.db-tab').forEach(function(t){ t.classList.remove('active'); });
  btn.classList.add('active');

  var isIdCard      = tab === 'idcard';
  var isPrintResult = tab === 'printresults';
  var isTable       = !isIdCard && !isPrintResult;

  var idPanel   = document.getElementById('dbIdCardPanel');
  var prPanel   = document.getElementById('dbPrintResultsPanel');
  var tableWrap = document.getElementById('dbTableWrap');
  var controls  = document.querySelector('.db-controls');
  var emptyDiv  = document.getElementById('dbEmpty');

  if (idPanel)   idPanel.style.display   = isIdCard      ? 'block' : 'none';
  if (prPanel)   prPanel.style.display   = isPrintResult ? 'block' : 'none';
  if (tableWrap) tableWrap.style.display = isTable       ? 'block' : 'none';
  if (controls)  controls.style.display  = isTable       ? 'flex'  : 'none';
  if (emptyDiv)  emptyDiv.style.display  = 'none';
  if (isTable)   renderDB();

  // Copy logo from header into ID card
  var headerLogo = document.querySelector('.school-crest img');
  var dbNavLogo  = document.getElementById('dbNavLogo');
  if (headerLogo && dbNavLogo) dbNavLogo.src = headerLogo.src;
}


/* ══════════════════════════════════════════════
   FEE PAYMENT TRACKER
══════════════════════════════════════════════ */
var feeRecords = [];
var feeAuthenticated = false;

/* ══════════════════════════════════════════════
   FEE PAYMENT TRACKER — Single consistent implementation
══════════════════════════════════════════════ */

function feeBalance(r) { return (Number(r.totalFee) || 0) - (Number(r.paidAmt) || 0); }

function deriveFeeStatus(total, paid) {
  if (paid <= 0)     return 'unpaid';
  if (paid >= total) return 'paid';
  return 'partial';
}

function updateFeeStatus() {
  var total = parseFloat(document.getElementById('fee_amount').value) || 0;
  var paid  = parseFloat(document.getElementById('fee_paid').value)   || 0;
  var sel   = document.getElementById('fee_status');
  if (sel) sel.value = deriveFeeStatus(total, paid);
}

/* ── Public: student self-service fee check ── */
function checkFeeStatus() {
  var sid  = document.getElementById('feeStudentId').value.trim().toUpperCase();
  var term = document.getElementById('feeTermSelect').value;
  var year = document.getElementById('feeYearSelect').value;
  var box  = document.getElementById('feePublicResult');

  if (!sid)  { showToast('Please enter your Student ID \u26a0\ufe0f'); return; }
  if (!term) { showToast('Please select a Term \u26a0\ufe0f'); return; }
  if (!year) { showToast('Please select an Academic Year \u26a0\ufe0f'); return; }

  var r = feeRecords.find(function(f) {
    return f.studentId.toUpperCase() === sid && f.term === term && f.year === year;
  });

  box.style.display = 'block';
  if (!r) {
    box.innerHTML = '<p style="color:var(--gray);font-size:13px">\u274c No fee record found for <strong>' + sid + '</strong> in ' + term + ', ' + year + '. Please contact the school office.</p>';
    return;
  }

  var bal    = feeBalance(r);
  var labels = { paid:'\u2705 Fully Paid', partial:'\u26a0\ufe0f Partial Payment', unpaid:'\u274c Not Paid' };
  var colors = { paid:'#047857', partial:'#B45309', unpaid:'#B91C1C' };

  box.innerHTML =
    '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px">' +
      '<div><strong style="font-size:16px;color:var(--green-dark)">' + r.name + '</strong><br>' +
      '<span style="font-size:12px;color:var(--gray)">' + r.studentId + ' \u00b7 ' + (r.classPos||'') + ' \u00b7 ' + (r.campus||'') + '</span></div>' +
      '<span style="font-weight:700;color:' + colors[r.status] + '">' + labels[r.status] + '</span>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-top:1px solid var(--light-gray)"><span>Total Fee</span><strong>\u20a6' + Number(r.totalFee).toLocaleString() + '</strong></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-top:1px solid var(--light-gray)"><span>Amount Paid</span><strong style="color:#047857">\u20a6' + Number(r.paidAmt).toLocaleString() + '</strong></div>' +
    '<div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 0;border-top:2px solid var(--light-gray);font-weight:700"><span>Balance</span><span style="color:' + (bal>0?'#B91C1C':'#047857') + '">' + (bal>0?'\u20a6'+bal.toLocaleString():'Nil') + '</span></div>';
}

/* ── Admin: search-as-you-type student picker inside Add/Edit modal ── */
function feeSuggest() {
  var q   = (document.getElementById('fee_student').value || '').toLowerCase();
  var box = document.getElementById('feeSuggestBox');
  if (!q || q.length < 2) { box.style.display = 'none'; return; }
  var hits = dbRecords.filter(function(r) {
    return r.name.toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q);
  }).slice(0, 8);
  if (hits.length === 0) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = '';
  hits.forEach(function(r) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:9px 14px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-size:13px';
    div.innerHTML = '<strong>' + r.name + '</strong> <span style="color:#666;font-size:11px">\u00b7 ' + r.studentId + ' \u00b7 ' + (r.classPos||r.role) + '</span>';
    div.addEventListener('mouseover', function(){ this.style.background = '#f0f7f0'; });
    div.addEventListener('mouseout',  function(){ this.style.background = 'white'; });
    div.addEventListener('click', function() {
      document.getElementById('fee_student').value = r.name + ' \u2014 ' + r.studentId;
      document.getElementById('fee_student').dataset.studentId = r.studentId;
      document.getElementById('fee_student').dataset.studentName = r.name;
      document.getElementById('fee_campus').value = r.campus || 'Main Campus';
      box.style.display = 'none';
    });
    box.appendChild(div);
  });
}

function openFeeModal(editId) {
  document.getElementById('feeEditId').value = editId || '';
  document.getElementById('feeModalTitle').textContent = editId ? 'Edit Payment Record' : 'Add Payment Record';
  var studentField = document.getElementById('fee_student');
  studentField.removeAttribute('readonly');

  if (editId) {
    var r = feeRecords.find(function(x){ return x.id === editId; });
    if (!r) return;
    studentField.value = r.name + ' \u2014 ' + r.studentId;
    studentField.dataset.studentId   = r.studentId;
    studentField.dataset.studentName = r.name;
    document.getElementById('fee_term').value   = r.term || '';
    document.getElementById('fee_year').value   = r.year || '';
    document.getElementById('fee_amount').value = r.totalFee;
    document.getElementById('fee_paid').value   = r.paidAmt;
    document.getElementById('fee_status').value = r.status;
    document.getElementById('fee_campus').value = r.campus || 'Main Campus';
    document.getElementById('fee_notes').value  = r.notes || '';
  } else {
    studentField.value = '';
    studentField.removeAttribute('data-student-id');
    delete studentField.dataset.studentId;
    delete studentField.dataset.studentName;
    document.getElementById('fee_term').value   = '';
    document.getElementById('fee_amount').value = '';
    document.getElementById('fee_paid').value   = '';
    document.getElementById('fee_status').value = 'unpaid';
    document.getElementById('fee_notes').value  = '';
  }
  document.getElementById('feeModal').classList.add('open');
}

function closeFeeModal() {
  document.getElementById('feeModal').classList.remove('open');
  var box = document.getElementById('feeSuggestBox');
  if (box) box.style.display = 'none';
}

function saveFeeRecord() {
  var studentField = document.getElementById('fee_student');
  var studentId   = studentField.dataset.studentId;
  var studentName = studentField.dataset.studentName;
  var term   = document.getElementById('fee_term').value;
  var year   = document.getElementById('fee_year').value;
  var total  = parseFloat(document.getElementById('fee_amount').value);
  var paid   = parseFloat(document.getElementById('fee_paid').value);
  var status = document.getElementById('fee_status').value;
  var campus = document.getElementById('fee_campus').value;
  var notes  = document.getElementById('fee_notes').value.trim();
  var editId = document.getElementById('feeEditId').value;

  if (!studentId || !studentName) { showToast('Please pick a student from the search list \u26a0\ufe0f'); return; }
  if (!term)  { showToast('Please select a Term \u26a0\ufe0f'); return; }
  if (!year)  { showToast('Please select an Academic Year \u26a0\ufe0f'); return; }
  if (isNaN(total) || total <= 0) { showToast('Please enter a valid fee amount \u26a0\ufe0f'); return; }
  if (isNaN(paid)  || paid < 0)   { showToast('Please enter amount paid \u26a0\ufe0f'); return; }

  var personRecord = dbRecords.find(function(r){ return r.studentId.toUpperCase() === studentId.toUpperCase(); });

  var record = {
    id:        editId || ('fee_' + Date.now()),
    studentId: studentId,
    name:      studentName,
    classPos:  personRecord ? (personRecord.classPos || personRecord.role) : '',
    campus:    campus,
    totalFee:  total,
    paidAmt:   paid,
    status:    status,
    payDate:   new Date().toISOString().slice(0,10),
    notes:     notes,
    term:      term,
    year:      year
  };

  if (editId) {
    var idx = feeRecords.findIndex(function(r){ return r.id === editId; });
    if (idx > -1) feeRecords[idx] = record;
    saveFeeToSheets(record, true);
    showToast('Fee record updated \u2705');
  } else {
    feeRecords.push(record);
    saveFeeToSheets(record, false);
    showToast('Fee record added \u2705');
  }
  closeFeeModal();
  renderFeeTable();
  updateFeeStats();
}

function deleteFeeRecord(id) {
  if (!confirm('Delete this fee record? This cannot be undone.')) return;
  feeRecords = feeRecords.filter(function(r){ return r.id !== id; });
  renderFeeTable();
  updateFeeStats();
  showToast('Fee record deleted \ud83d\uddd1');
}

function updateFeeStats() {
  var total      = feeRecords.length;
  var paidCount  = feeRecords.filter(function(r){ return r.status === 'paid'; }).length;
  var unpaidCount= feeRecords.filter(function(r){ return r.status === 'unpaid'; }).length;
  var collected  = feeRecords.reduce(function(s,r){ return s + (Number(r.paidAmt)||0); }, 0);
  var outstanding= feeRecords.reduce(function(s,r){ return s + feeBalance(r); }, 0);

  var elTotal = document.getElementById('feeTotalCount');
  var elPaid  = document.getElementById('feePaidCount');
  var elUnpaid= document.getElementById('feeUnpaidCount');
  var elColl  = document.getElementById('feeTotalAmount');
  var elOut   = document.getElementById('feeOutstanding');

  if (elTotal) elTotal.textContent = total;
  if (elPaid)  elPaid.textContent  = paidCount;
  if (elUnpaid)elUnpaid.textContent= unpaidCount;
  if (elColl)  elColl.textContent  = '\u20a6' + collected.toLocaleString();
  if (elOut)   elOut.textContent   = '\u20a6' + outstanding.toLocaleString();
}

function renderFeeTable() {
  var body   = document.getElementById('feeTableBody');
  var empty  = document.getElementById('feeTableEmpty');
  if (!body) return;

  var search = (document.getElementById('feeAdminSearch')  || {}).value || '';
  var status = (document.getElementById('feeStatusFilter') || {}).value || '';
  var campus = (document.getElementById('feeCampusFilter') || {}).value || '';
  search = search.toLowerCase();

  var filtered = feeRecords.filter(function(r) {
    return (!search || r.name.toLowerCase().includes(search) || r.studentId.toLowerCase().includes(search)) &&
           (!status || r.status === status) &&
           (!campus || r.campus === campus);
  });

  if (filtered.length === 0) {
    body.innerHTML = '';
    if (empty) empty.style.display = 'block';
    updateFeeStats();
    return;
  }
  if (empty) empty.style.display = 'none';

  var statusLabels = { paid:'\u2705 Paid', partial:'\u26a0\ufe0f Partial', unpaid:'\u274c Unpaid' };
  var statusColors = { paid:'#047857', partial:'#B45309', unpaid:'#B91C1C' };

  body.innerHTML = filtered.map(function(r) {
    var bal = feeBalance(r);
    return '<tr style="border-bottom:1px solid var(--light-gray)">' +
      '<td style="padding:10px 14px"><strong>' + r.name + '</strong></td>' +
      '<td style="padding:10px 14px;font-family:monospace;font-size:12px;color:var(--gray)">' + r.studentId + '</td>' +
      '<td style="padding:10px 14px;font-size:12px">' + (r.campus||'\u2014') + '</td>' +
      '<td style="padding:10px 14px;font-size:12px">' + r.term + ' / ' + r.year + '</td>' +
      '<td style="padding:10px 14px;font-weight:600">\u20a6' + Number(r.totalFee).toLocaleString() + '</td>' +
      '<td style="padding:10px 14px;color:#047857;font-weight:600">\u20a6' + Number(r.paidAmt).toLocaleString() + '</td>' +
      '<td style="padding:10px 14px;font-weight:700;color:' + (bal>0?'#B91C1C':'#047857') + '">' + (bal>0?'\u20a6'+bal.toLocaleString():'Nil') + '</td>' +
      '<td style="padding:10px 14px"><span style="font-weight:700;font-size:12px;color:' + statusColors[r.status] + '">' + statusLabels[r.status] + '</span></td>' +
      '<td style="padding:10px 14px;white-space:nowrap">' +
        '<button onclick="openFeeModal(\'' + r.id + '\')" style="background:none;border:1px solid var(--green);color:var(--green);border-radius:3px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;margin-right:4px">\u270f Edit</button>' +
        '<button onclick="printReceipt(\'' + r.id + '\')" style="background:none;border:1px solid #2563EB;color:#2563EB;border-radius:3px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;margin-right:4px">\ud83e\uddfe Receipt</button>' +
        '<button onclick="deleteFeeRecord(\'' + r.id + '\')" style="background:none;border:1px solid #B91C1C;color:#B91C1C;border-radius:3px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer">\ud83d\uddd1</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  updateFeeStats();
}

function importFromDB() {
  if (dbRecords.length === 0) { showToast('No records in database yet. Add students first \u26a0\ufe0f'); return; }
  var term = document.getElementById('feeTermSelect').value || 'First Term';
  var year = document.getElementById('feeYearSelect').value || '2025/2026';
  var imported = 0;
  dbRecords.filter(function(r){ return r.role !== 'staff'; }).forEach(function(r, i) {
    var exists = feeRecords.find(function(f){
      return f.studentId.toUpperCase() === r.studentId.toUpperCase() && f.term === term && f.year === year;
    });
    if (!exists) {
      var rec = {
        id: 'fee_' + Date.now() + '_' + i,
        studentId: r.studentId, name: r.name, classPos: r.classPos || r.role,
        campus: r.campus, totalFee: 50000, paidAmt: 0,
        status: 'unpaid', payDate: '', notes: '', term: term, year: year
      };
      feeRecords.push(rec);
      saveFeeToSheets(rec, false);
      imported++;
    }
  });
  renderFeeTable();
  updateFeeStats();
  showToast(imported + ' students imported from database \u2705');
}

function printReceipt(id) {
  var r = feeRecords.find(function(x){ return x.id === id; });
  if (!r) return;
  var bal = feeBalance(r);
  var w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fee Receipt \u2014 ' + r.name + '</title>' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;max-width:500px;margin:0 auto}' +
    '.receipt{border:2px solid #006B35;border-radius:8px;overflow:hidden}' +
    '.r-head{background:#004D26;padding:18px 22px;text-align:center}' +
    '.r-head h1{color:white;font-size:16px;text-transform:uppercase;letter-spacing:.5px}' +
    '.r-head p{color:rgba(255,255,255,.7);font-size:11px;margin-top:4px}' +
    '.r-title{background:#C8981A;padding:7px;text-align:center;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#004D26}' +
    '.r-body{padding:20px 22px}' +
    '.r-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px}' +
    '.r-row:last-child{border:none}' +
    '.r-row span{color:#666;font-size:12px}.r-row strong{color:#222}' +
    '.r-total{background:#f5f5f5;padding:14px 22px;display:flex;justify-content:space-between;align-items:center}' +
    '.r-total span{font-size:13px;font-weight:700;color:#004D26}' +
    '.r-total strong{font-size:20px;font-weight:900;color:' + (bal>0?'#B71C1C':'#047857') + '}' +
    '.r-stamp{text-align:center;padding:14px;border-top:2px dashed #ccc}' +
    '.stamp{display:inline-block;border:2px solid #006B35;border-radius:4px;padding:6px 18px;color:#006B35;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px}' +
    '.btn{display:block;width:fit-content;margin:16px auto 0;background:#006B35;color:white;border:none;padding:10px 28px;border-radius:4px;font-size:13px;font-weight:700;cursor:pointer}' +
    '@media print{.btn{display:none}}</style></head><body>' +
    '<div class="receipt">' +
    '<div class="r-head"><h1>Christ the Foundation Model Academy</h1><p>cfmsanambra.org \u00b7 +234 806 268 6710 \u00b7 Okija, Anambra</p></div>' +
    '<div class="r-title">School Fee Receipt</div>' +
    '<div class="r-body">' +
    '<div class="r-row"><span>Receipt No.</span><strong>CFMS-' + r.id.slice(-6).toUpperCase() + '</strong></div>' +
    '<div class="r-row"><span>Student Name</span><strong>' + r.name + '</strong></div>' +
    '<div class="r-row"><span>Student ID</span><strong>' + r.studentId + '</strong></div>' +
    '<div class="r-row"><span>Class</span><strong>' + (r.classPos||'\u2014') + '</strong></div>' +
    '<div class="r-row"><span>Campus</span><strong>' + (r.campus||'\u2014') + '</strong></div>' +
    '<div class="r-row"><span>Term / Year</span><strong>' + r.term + ' \u2014 ' + r.year + '</strong></div>' +
    '<div class="r-row"><span>Total Fee</span><strong>\u20a6' + Number(r.totalFee).toLocaleString() + '</strong></div>' +
    '<div class="r-row"><span>Amount Paid</span><strong style="color:#047857">\u20a6' + Number(r.paidAmt).toLocaleString() + '</strong></div>' +
    '<div class="r-row"><span>Payment Date</span><strong>' + (r.payDate || 'N/A') + '</strong></div>' +
    (r.notes ? '<div class="r-row"><span>Notes</span><strong>' + r.notes + '</strong></div>' : '') +
    '</div>' +
    '<div class="r-total"><span>Outstanding Balance</span><strong>' + (bal>0?'\u20a6'+bal.toLocaleString():'FULLY PAID') + '</strong></div>' +
    '<div class="r-stamp"><div class="stamp">' + (r.status==='paid'?'\u2705 Payment Complete':r.status==='partial'?'\u26a0\ufe0f Partial Payment':'\u274c Payment Pending') + '</div></div>' +
    '</div>' +
    '<button class="btn" onclick="window.print()">\ud83d\uddb8 Print Receipt</button>' +
    '</body></html>');
  w.document.close();
}

function printFeeReport() {
  if (feeRecords.length === 0) { showToast('No fee records to print \u26a0\ufe0f'); return; }
  var rows = feeRecords.map(function(r) {
    var bal = feeBalance(r);
    return '<tr>' +
      '<td style="padding:7px 10px;border:1px solid #ddd">' + r.name + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #ddd;font-family:monospace;font-size:11px">' + r.studentId + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #ddd">' + (r.campus||'') + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #ddd">' + r.term + ' / ' + r.year + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #ddd;text-align:right">\u20a6' + Number(r.totalFee).toLocaleString() + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #ddd;text-align:right;color:#047857">\u20a6' + Number(r.paidAmt).toLocaleString() + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #ddd;text-align:right;color:' + (bal>0?'#B91C1C':'#047857') + '">' + (bal>0?'\u20a6'+bal.toLocaleString():'Nil') + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #ddd;text-transform:capitalize">' + r.status + '</td>' +
    '</tr>';
  }).join('');

  var w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CFMA Fee Report</title>' +
    '<style>body{font-family:Arial,sans-serif;padding:24px}h1{font-size:18px;color:#004D26}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}' +
    'th{background:#004D26;color:white;padding:8px 10px;text-align:left}' +
    '.btn{margin-top:18px;background:#006B35;color:white;border:none;padding:10px 24px;border-radius:4px;font-weight:700;cursor:pointer}' +
    '@media print{.btn{display:none}}</style></head><body>' +
    '<h1>Christ the Foundation Model Academy \u2014 Fee Payment Report</h1>' +
    '<p style="font-size:12px;color:#666">Generated: ' + new Date().toLocaleDateString('en-NG') + '</p>' +
    '<table><thead><tr><th>Name</th><th>ID</th><th>Campus</th><th>Term/Year</th><th>Fee</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>' +
    '<button class="btn" onclick="window.print()">\ud83d\uddb8 Print Report</button></body></html>');
  w.document.close();
}

function exportFeeCSV() {
  if (feeRecords.length === 0) { showToast('No fee records to export \u26a0\ufe0f'); return; }
  var rows = ['Name,Student ID,Class,Campus,Term,Year,Total Fee,Amount Paid,Balance,Status,Payment Date,Notes'];
  feeRecords.forEach(function(r) {
    rows.push([r.name, r.studentId, r.classPos, r.campus, r.term, r.year,
      r.totalFee, r.paidAmt, feeBalance(r), r.status, r.payDate||'', r.notes||'']
      .map(function(v){ return '"' + String(v||'').replace(/"/g,'""') + '"'; }).join(','));
  });
  var blob = new Blob([rows.join('\n')], { type:'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'CFMS_Fees_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  showToast('Fee records exported \u2705');
}

document.addEventListener('DOMContentLoaded', function() {
  var feeOverlay = document.getElementById('feeModal');
  if (feeOverlay) feeOverlay.addEventListener('click', function(e){ if(e.target===feeOverlay) closeFeeModal(); });
});

/* ══════════════════════════════════════════════
   APPLICATION FORM SUBMISSION
   WhatsApp (CallMeBot) + EmailJS + Google Sheets
══════════════════════════════════════════════ */

// ─── YOUR KEYS — FILL THESE IN ───────────────────────────────────────────────
const CONFIG = {
  // ── EMAILJS ──────────────────────────────────────────────────────────────
  // 1. Sign up free at emailjs.com
  // 2. Add Gmail service → copy Service ID
  // 3. Create template → copy Template ID
  // 4. Account → API Keys → copy Public Key
  emailjs_public_key:  'OUySpkbSEJeb0inns',
  emailjs_service_id:  'service_wa23gqq',
  emailjs_template_id: 'template_g48foml',

  // ── GOOGLE SHEETS ─────────────────────────────────────────────────────────
  // 1. Open Google Sheets → Extensions → Apps Script
  // 2. Paste the Apps Script code from the Setup Guide section
  // 3. Deploy as Web App → copy URL here
  sheets_url: 'https://script.google.com/macros/s/AKfycby6nrp-gm5h6UMjH3YjTzWKB4U8mDsSMMfBYit7Mc098Mx1ZZaiRHxofu6sBBwFCEtddQ/exec',  // ✅ Admissions, results & career form submissions
  db_url:     'https://script.google.com/macros/s/AKfycbz8KYQpTETd-TpKvXqJzKV2ouOPdlR_YIHfTtQOhZnwQm3Kic-9b7SmQde52iukpElc/exec',     // ✅ Student database (add/edit/delete/read)
};
// ─────────────────────────────────────────────────────────────────────────────

// Class options per division
/* ── MASTER CLASS LIST — single source of truth used everywhere ──────────── */
const CFMS_CLASS_LIST = {
  nursery: ['Pre-Nursery','Nursery 1','Nursery 2','Nursery 3'],
  primary: ['Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6'],
  secondary: ['JSS 1','JSS 2','JSS 3','SSS 1','SSS 2','SSS 3']
};
// Flat list of every class label, used for places that don't split by division
const CFMS_ALL_CLASSES = [].concat(CFMS_CLASS_LIST.nursery, CFMS_CLASS_LIST.primary, CFMS_CLASS_LIST.secondary);

// Populate any <select> element with classes for a given division ('' = all classes)
function populateClassDropdown(selectEl, division, placeholder) {
  if (!selectEl) return;
  var current = selectEl.value;
  selectEl.innerHTML = '<option value="">' + (placeholder || 'Select Class') + '</option>';
  var list = division ? (CFMS_CLASS_LIST[division] || []) : CFMS_ALL_CLASSES;
  list.forEach(function(c) {
    var o = document.createElement('option');
    o.value = c; o.textContent = c;
    selectEl.appendChild(o);
  });
  if (current && list.indexOf(current) > -1) selectEl.value = current;
}

// Backward-compatible alias kept so the admissions form's onchange="updateClassOptions()" keeps working
const classOptions = CFMS_CLASS_LIST;
function updateClassOptions() {
  var div = document.getElementById('f_division').value;
  populateClassDropdown(document.getElementById('f_class'), div, 'Select Class');
}

document.addEventListener('DOMContentLoaded', function() {
  populateClassDropdown(document.getElementById('tpl_class'), '', 'Select Class');
});

function getFormData() {
  return {
    surname:    document.getElementById('f_surname').value.trim(),
    firstname:  document.getElementById('f_firstname').value.trim(),
    dob:        document.getElementById('f_dob').value,
    gender:     document.getElementById('f_gender').value,
    division:   document.getElementById('f_division').value,
    studentClass: document.getElementById('f_class').value,
    campus:     document.getElementById('f_campus').value,
    parent:     document.getElementById('f_parent').value.trim(),
    phone:      document.getElementById('f_phone').value.trim(),
    email:      document.getElementById('f_email').value.trim(),
    prevschool: document.getElementById('f_prevschool').value.trim(),
    extra:      document.getElementById('f_extra').value.trim(),
    timestamp:  new Date().toLocaleString('en-NG', {timeZone:'Africa/Lagos'}),
    ref:        'CFMS-APP-' + Date.now().toString().slice(-6)
  };
}

function validateForm(d) {
  if (!d.surname)    { showToast('Please enter Surname \u26a0\ufe0f'); return false; }
  if (!d.firstname)  { showToast('Please enter First Name \u26a0\ufe0f'); return false; }
  if (!d.dob)        { showToast('Please enter Date of Birth \u26a0\ufe0f'); return false; }
  if (!d.gender)     { showToast('Please select Gender \u26a0\ufe0f'); return false; }
  if (!d.division)   { showToast('Please select Division \u26a0\ufe0f'); return false; }
  if (!d.studentClass) { showToast('Please select Class \u26a0\ufe0f'); return false; }
  if (!d.campus)     { showToast('Please select Campus \u26a0\ufe0f'); return false; }
  if (!d.parent)     { showToast('Please enter Parent/Guardian Name \u26a0\ufe0f'); return false; }
  if (!d.phone)      { showToast('Please enter Phone Number \u26a0\ufe0f'); return false; }
  return true;
}

function setDelivery(id, status) {
  var ic = document.getElementById('ds-' + id + '-ic');
  if (!ic) return;
  ic.textContent = status === 'ok' ? '\u2705' : status === 'fail' ? '\u274c' : '\u23f3';
}

async function submitApplication() {
  var d = getFormData();
  if (!validateForm(d)) return;

  var btn = document.getElementById('submitBtn');
  if (btn) { btn.disabled = true; btn.textContent = '\u23f3 Submitting...'; }

  var statusDiv = document.getElementById('submitStatus');
  var delivDiv  = document.getElementById('deliveryStatus');
  if (statusDiv) statusDiv.style.display = 'block';
  if (delivDiv)  delivDiv.style.display  = 'block';
  document.getElementById('statusMsg').textContent = 'Sending your application...';

  var emailOk = false, sheetsOk = false, waOk = false;

  // ── 2. EmailJS ────────────────────────────────────────────────────────────
  try {
    if (CONFIG.emailjs_public_key !== 'YOUR_EMAILJS_PUBLIC_KEY') {
      emailjs.init(CONFIG.emailjs_public_key);
      await emailjs.send(CONFIG.emailjs_service_id, CONFIG.emailjs_template_id, {
        to_email:    'cfmsanambra@gmail.com',
        ref:         d.ref,
        student_name: d.firstname + ' ' + d.surname,
        dob:         d.dob,
        gender:      d.gender,
        division:    d.division,
        student_class: d.studentClass,
        campus:      d.campus,
        parent_name: d.parent,
        phone:       d.phone,
        email:       d.email || 'Not provided',
        prev_school: d.prevschool || 'Not provided',
        extra:       d.extra || 'None',
        timestamp:   d.timestamp
      });
      emailOk = true;
    } else {
      emailOk = true;
    }
  } catch(e) { console.error('EmailJS error:', e); }
  setDelivery('email', emailOk ? 'ok' : 'fail');

  // ── 3. Google Sheets ──────────────────────────────────────────────────────
  try {
    if (CONFIG.sheets_url !== 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
      await fetch(CONFIG.sheets_url, {
        method: 'POST',
        mode:   'no-cors',
        headers:{ 'Content-Type': 'application/json' },
        body:   JSON.stringify(d)
      });
      sheetsOk = true;
    } else {
      sheetsOk = true;
    }
  } catch(e) { console.error('Sheets error:', e); }
  setDelivery('sheets', sheetsOk ? 'ok' : 'fail');

  // ── Done ──────────────────────────────────────────────────────────────────
  document.getElementById('statusIcon').textContent = '\u2705';
  document.getElementById('statusMsg').textContent  = 'Application submitted successfully!';

  setTimeout(function() {
    var appForm = document.getElementById('appForm');
    if (appForm) appForm.style.display = 'none';
    if (statusDiv) statusDiv.style.display = 'none';
    if (delivDiv)  delivDiv.style.display  = 'none';
    var successScreen = document.getElementById('successScreen');
    if (successScreen) {
      successScreen.style.display = 'block';
      document.getElementById('refNumber').innerHTML =
        '<strong>Reference Number:</strong> ' + d.ref + '<br>' +
        '<strong>Student Name:</strong> ' + d.firstname + ' ' + d.surname + '<br>' +
        '<strong>Class:</strong> ' + d.studentClass + ' \u2014 ' + d.campus + '<br>' +
        '<strong>Submitted:</strong> ' + d.timestamp;
    }
  }, 1500);
}

function resetForm() {
  ['f_surname','f_firstname','f_dob','f_parent','f_phone','f_email','f_prevschool','f_extra']
    .forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  ['f_gender','f_division','f_campus'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.selectedIndex=0;
  });
  var fc = document.getElementById('f_class');
  if (fc) fc.innerHTML = '<option value="">Select Division First</option>';
  var appForm = document.getElementById('appForm');
  var successScreen = document.getElementById('successScreen');
  var statusDiv = document.getElementById('submitStatus');
  var delivDiv  = document.getElementById('deliveryStatus');
  if (appForm)      appForm.style.display      = 'block';
  if (successScreen)successScreen.style.display= 'none';
  if (statusDiv)    statusDiv.style.display    = 'none';
  if (delivDiv)     delivDiv.style.display     = 'none';
  var btn = document.getElementById('submitBtn');
  if (btn) { btn.disabled=false; btn.textContent='\ud83d\udce8 Submit Application'; }
}


/* ══════════════════════════════════════════════
   CAREERS
══════════════════════════════════════════════ */
function selectJob(position, type, level) {
  var sel = document.getElementById('cr_position');
  if (sel) {
    // Try to match option
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === position) {
        sel.selectedIndex = i;
        break;
      }
    }
  }
  document.getElementById('careerFormSubtitle').textContent =
    'Applying for: ' + position + ' (' + type + ' \u2014 ' + level + ')';
  document.getElementById('careerFormWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Applying for ' + position + ' \u2705');
}

function getCareerData() {
  return {
    surname:       document.getElementById('cr_surname').value.trim(),
    firstname:     document.getElementById('cr_firstname').value.trim(),
    phone:         document.getElementById('cr_phone').value.trim(),
    email:         document.getElementById('cr_email').value.trim(),
    position:      document.getElementById('cr_position').value,
    campus:        document.getElementById('cr_campus').value,
    qualification: document.getElementById('cr_qualification').value,
    experience:    document.getElementById('cr_experience').value,
    trcn:          document.getElementById('cr_trcn').value,
    coverletter:   document.getElementById('cr_coverletter').value.trim(),
    subjects:      document.getElementById('cr_subjects').value.trim(),
    prevschool:    document.getElementById('cr_prevschool').value.trim(),
    timestamp:     new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
    ref:           'CFMS-JOB-' + Date.now().toString().slice(-6)
  };
}

function validateCareer(d) {
  if (!d.surname)      { showToast('Please enter Surname \u26a0\ufe0f'); return false; }
  if (!d.firstname)    { showToast('Please enter First Name \u26a0\ufe0f'); return false; }
  if (!d.phone)        { showToast('Please enter Phone Number \u26a0\ufe0f'); return false; }
  if (!d.email)        { showToast('Please enter Email Address \u26a0\ufe0f'); return false; }
  if (!d.position)     { showToast('Please select a Position \u26a0\ufe0f'); return false; }
  if (!d.campus)       { showToast('Please select a Campus \u26a0\ufe0f'); return false; }
  if (!d.qualification){ showToast('Please select your Qualification \u26a0\ufe0f'); return false; }
  if (!d.coverletter)  { showToast('Please write a short cover letter \u26a0\ufe0f'); return false; }
  return true;
}

function setCdStatus(id, status) {
  var el = document.getElementById('cd-' + id + '-ic');
  if (el) el.textContent = status === 'ok' ? '\u2705' : status === 'fail' ? '\u274c' : '\u23f3';
}

async function submitCareerApplication() {
  var d = getCareerData();
  if (!validateCareer(d)) return;

  var btn = document.getElementById('careerSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = '\u23f3 Submitting...'; }

  var statusDiv  = document.getElementById('careerSubmitStatus');
  var deliveryDiv = document.getElementById('careerDelivery');
  if (statusDiv)   statusDiv.style.display   = 'block';
  if (deliveryDiv) deliveryDiv.style.display = 'block';
  document.getElementById('careerStatusMsg').textContent = 'Sending your application...';

  var waOk = false, emailOk = false, sheetsOk = false;

  // ── 2. Email ──────────────────────────────────────────────────────────────
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG.emailjs_public_key !== 'YOUR_EMAILJS_PUBLIC_KEY') {
      emailjs.init(CONFIG.emailjs_public_key);
      await emailjs.send(CONFIG.emailjs_service_id, CONFIG.emailjs_template_id, {
        to_email:      'cfmsanambra@gmail.com',
        ref:           d.ref,
        student_name:  d.firstname + ' ' + d.surname,
        phone:         d.phone,
        email:         d.email,
        position:      d.position,
        campus:        d.campus,
        qualification: d.qualification,
        experience:    d.experience || 'Not specified',
        trcn:          d.trcn || 'Not specified',
        subjects:      d.subjects || 'N/A',
        prev_school:   d.prevschool || 'N/A',
        extra:         d.coverletter,
        timestamp:     d.timestamp
      });
      emailOk = true;
    } else {
      emailOk = true;
    }
  } catch(e) { console.error('Email error:', e); }
  setCdStatus('email', emailOk ? 'ok' : 'fail');

  // ── 3. Google Sheets ──────────────────────────────────────────────────────
  try {
    await saveCareerToSheets(d);
      sheetsOk = true;
  } catch(e) { console.error('Sheets error:', e); }
  setCdStatus('sheets', sheetsOk ? 'ok' : 'fail');

  // ── Done ──────────────────────────────────────────────────────────────────
  document.getElementById('careerStatusIcon').textContent = '\u2705';
  document.getElementById('careerStatusMsg').textContent  = 'Application sent successfully!';

  setTimeout(function() {
    document.getElementById('careerAppForm').style.display   = 'none';
    if (statusDiv)   statusDiv.style.display   = 'none';
    if (deliveryDiv) deliveryDiv.style.display = 'none';
    var success = document.getElementById('careerSuccess');
    success.style.display = 'block';
    document.getElementById('careerRef').innerHTML =
      '<strong>Reference No:</strong> ' + d.ref + '<br>' +
      '<strong>Applicant:</strong> ' + d.firstname + ' ' + d.surname + '<br>' +
      '<strong>Position:</strong> ' + d.position + '<br>' +
      '<strong>Campus:</strong> ' + d.campus + '<br>' +
      '<strong>Submitted:</strong> ' + d.timestamp;
  }, 1600);
}

function resetCareerForm() {
  ['cr_surname','cr_firstname','cr_phone','cr_email','cr_coverletter','cr_subjects','cr_prevschool']
    .forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  ['cr_position','cr_campus','cr_qualification','cr_experience','cr_trcn']
    .forEach(function(id){ var el=document.getElementById(id); if(el) el.selectedIndex=0; });
  document.getElementById('careerAppForm').style.display    = 'block';
  document.getElementById('careerSuccess').style.display    = 'none';
  document.getElementById('careerSubmitStatus').style.display = 'none';
  document.getElementById('careerDelivery').style.display   = 'none';
  document.getElementById('careerFormSubtitle').textContent = 'Click "Apply Now" on any position above, or fill in your preferred role below';
  var btn = document.getElementById('careerSubmitBtn');
  if (btn) { btn.disabled = false; btn.textContent = '\ud83d\udce8 Submit Application'; }
}


/* ══════════════════════════════════════════════
   STUDENT PORTAL
══════════════════════════════════════════════ */
var portalStudent = null;

function portalLogin() {
  var sid = (document.getElementById('portalStudentId').value || '').trim().toUpperCase();
  var dob = (document.getElementById('portalDOB').value || '').trim();
  var err = document.getElementById('portalLoginErr');
  err.style.display = 'none';

  if (!sid) { showToast('Please enter your Student ID \u26a0\ufe0f'); return; }
  if (!dob) { showToast('Please enter your Date of Birth \u26a0\ufe0f'); return; }

  function normalizeDob(val) {
    if (!val) return '';
    var s = String(val).trim();
    // Handle JavaScript Date toString format
    if (s.indexOf('GMT') > -1 || s.indexOf('UTC') > -1) {
      var d = new Date(s);
      if (!isNaN(d)) {
        return d.getFullYear() + '-' +
          String(d.getMonth()+1).padStart(2,'0') + '-' +
          String(d.getDate()).padStart(2,'0');
      }
    }
    // Return just the date part (strip any time component)
    return s.split('T')[0];
  }

  function attemptLogin(records) {
    var student = records.find(function(r) {
      return r.studentId && r.studentId.toUpperCase() === sid;
    });
    if (!student) { return null; }
    var storedDob = normalizeDob(student.dob);
    if (storedDob && storedDob !== dob) {
      err.textContent = '\u274c Date of Birth does not match. Please check and try again.';
      err.style.display = 'block';
      return false; // found but wrong DOB
    }
    // SUCCESS
    portalStudent = student;
    document.getElementById('portalLoginWrap').style.display  = 'none';
    document.getElementById('portalDashboard').style.display = 'block';
    populatePortal();
    var nameParts = student.name.trim().split(/\s+/);
    var firstName = nameParts.length > 1 ? nameParts[1] : nameParts[0];
    showToast('Welcome, ' + firstName + '! \ud83c\udf89');
    return true;
  }

  // 1. Try local cache first (instant)
  var localResult = attemptLogin(dbRecords);
  if (localResult === true) return;   // logged in
  if (localResult === false) return;  // wrong DOB — no point fetching

  // 2. Not found locally — fetch fresh from Sheets (handles stale or empty cache)
  err.textContent = '\ud83d\udd04 Checking records, please wait...';
  err.style.color  = 'var(--green-dark)';
  err.style.display = 'block';

  sheetsGet('get_students').then(function(data) {
    err.style.color = '';
    if (data && data.ok && data.students && data.students.length > 0) {
      dbRecords = data.students;
      var freshResult = attemptLogin(data.students);
      if (!freshResult) {
        err.textContent = '\u274c Student ID "' + sid + '" not found. Please contact the school office.';
        err.style.display = 'block';
      }
    } else {
      err.textContent = '\u274c Could not reach the school database. Check your internet and try again.';
      err.style.display = 'block';
    }
  }).catch(function() {
    err.style.color = '';
    err.textContent = '\u274c Connection error. Please check your internet and try again.';
    err.style.display = 'block';
  });
}

function portalLogout() {
  portalStudent = null;
  document.getElementById('portalLoginWrap').style.display  = 'block';
  document.getElementById('portalDashboard').style.display = 'none';
  document.getElementById('portalStudentId').value = '';
  document.getElementById('portalDOB').value = '';
  document.getElementById('portalLoginErr').style.display = 'none';
  // Reset tabs
  switchPortalTab('home', document.querySelector('.portal-nav-tab'));
  showToast('Logged out successfully');
}

function switchPortalTab(tab, btn) {
  document.querySelectorAll('.portal-nav-tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.portal-panel').forEach(function(p){ p.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var panel = document.getElementById('pp-' + tab);
  if (panel) panel.classList.add('active');
  if (tab === 'results') loadPortalResults();
  if (tab === 'fees')    loadPortalFees();
  if (tab === 'assignments') loadStudentAssignments();
}

function populatePortal() {
  var s = portalStudent;
  if (!s) return;

  var nameParts = s.name.split(' ');
  var firstName = nameParts.slice(1).join(' ') || nameParts[0];

  // Top bar
  document.getElementById('portalTopName').textContent = s.name;
  document.getElementById('portalTopMeta').textContent = (s.classPos||s.role||'Student') + ' \u00b7 ' + s.campus;
  var topAvatar = document.getElementById('portalTopAvatar');
  if (s.passport) {
    topAvatar.innerHTML = '<img src="'+s.passport+'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)">';
  } else {
    topAvatar.textContent = '\ud83d\udc64';
  }

  // Welcome
  document.getElementById('pwelcomeName').textContent = firstName;

  // Quick stats
  var myResults = resultsDB.filter(function(r){ return r.studentId.toUpperCase() === s.studentId.toUpperCase(); });
  var latestTerm = myResults.length > 0 ? myResults[myResults.length - 1] : null;
  var subjects = new Set(myResults.map(function(r){ return r.subject; }));
  document.getElementById('pqs-subjects').textContent = subjects.size || '—';

  var latestTermRows = myResults.filter(function(r){
    return latestTerm && r.term === latestTerm.term && r.year === latestTerm.year;
  });
  if (latestTermRows.length > 0) {
    var avg = Math.round(latestTermRows.reduce(function(a,r){ return a+r.total; },0) / latestTermRows.length);
    document.getElementById('pqs-avg').textContent = avg + '%';
  } else {
    document.getElementById('pqs-avg').textContent = '—';
  }

  // Fee status quick stat
  var myFees = feeRecords.filter(function(f){ return f.studentId.toUpperCase() === s.studentId.toUpperCase(); });
  if (myFees.length > 0) {
    var latestFee = myFees[myFees.length - 1];
    var feeEmoji = latestFee.status === 'paid' ? '\u2705' : latestFee.status === 'partial' ? '\u26a0\ufe0f' : '\u274c';
    document.getElementById('pqs-feestatus').textContent = feeEmoji;
  } else {
    document.getElementById('pqs-feestatus').textContent = '—';
  }

  // Profile
  document.getElementById('profileFullName').textContent = s.name;
  document.getElementById('profileIdBadge').textContent  = s.studentId;
  document.getElementById('profileClass').textContent    = s.classPos || '—';
  document.getElementById('profileCampus').textContent   = s.campus   || '—';
  document.getElementById('profileGender').textContent   = s.gender   || '—';
  document.getElementById('profileRole').textContent     = s.role     || '—';
  document.getElementById('profilePhone').textContent    = s.phone    || '—';

  var photoWrap = document.getElementById('profilePhotoWrap');
  if (s.passport) {
    photoWrap.innerHTML = '<img src="'+s.passport+'" class="profile-photo" alt="'+s.name+'">';
  } else {
    photoWrap.innerHTML = '<div class="profile-photo-empty">\ud83d\udc64</div>';
  }

  // Profile info grid
  document.getElementById('pi-name').textContent     = s.name;
  document.getElementById('pi-id').textContent       = s.studentId;
  document.getElementById('pi-class').textContent    = s.classPos || s.role || '—';
  document.getElementById('pi-gender').textContent   = s.gender   || '—';
  document.getElementById('pi-campus').textContent   = s.campus   || '—';
  document.getElementById('pi-role').textContent     = s.role     || '—';
  document.getElementById('pi-phone').textContent    = s.phone    || '—';
  document.getElementById('pi-subjects').textContent = s.subjects && s.subjects.length ? s.subjects.join(', ') : '—';

  // ID Card
  populatePortalIdCard();
}

function populatePortalIdCard() {
  var s = portalStudent;
  if (!s) return;

  document.getElementById('pidc_name').textContent   = s.name;
  document.getElementById('pidc_class').textContent  = s.classPos || s.role || '—';
  document.getElementById('pidc_campus').textContent = s.campus || '—';
  document.getElementById('pidc_idno').textContent   = s.studentId;
  document.getElementById('pidc_type').textContent   =
    s.role==='secondary' ? 'Secondary' : s.role==='primary' ? 'Primary' :
    s.role==='nursery'   ? 'Nursery'   : s.role==='staff'   ? 'Staff'   : 'Student';

  document.getElementById('pidc_b_idno').textContent   = s.studentId;
  document.getElementById('pidc_b_name').textContent   = s.name;
  document.getElementById('pidc_b_class').textContent  = s.classPos || s.role || '—';
  document.getElementById('pidc_b_gender').textContent = s.gender   || '—';
  document.getElementById('pidc_b_campus').textContent = s.campus   || '—';
  document.getElementById('pidc_b_phone').textContent  = s.phone    || '—';
  document.getElementById('pidc_barcode').textContent  = s.studentId;

  var passEl = document.getElementById('pidc_passport');
  if (s.passport) {
    passEl.outerHTML = '<img id="pidc_passport2" class="idc-passport" src="'+s.passport+'" alt="'+s.name+'">';
  }

  // Barcode lines
  var bc = document.getElementById('portalBarcodeLines');
  if (bc && bc.children.length === 0) {
    [2,1,3,1,2,1,1,3,2,1,2,3,1,2,1,3,2,1,1,2,3,1,2,1,2,1,3,2,1,2].forEach(function(w,i){
      var d = document.createElement('div');
      d.style.cssText = 'width:'+w+'px;height:'+(i%3===0?20:14)+'px;background:#222;border-radius:1px';
      bc.appendChild(d);
    });
  }
}

function portalPrintIdCard() {
  var front = document.getElementById('portalIdcFront');
  var back  = document.getElementById('portalIdcBack');
  if (!front || !back) return;
  var w = window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ID Card \u2014 '+(portalStudent?portalStudent.name:'')+'</title>'+
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{background:white;font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:center;padding:20px;gap:12px}'+
    '.id-card{width:85.6mm;min-height:54mm;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.2)}'+
    '.idc-front{background:linear-gradient(160deg,#004D26,#006B35,#008A44);padding:0 0 8px;position:relative}'+
    '.idc-front-header{background:rgba(0,0,0,.2);padding:5px 8px;display:flex;align-items:center;gap:6px;border-bottom:1.5px solid #C8981A}'+
    '.idc-school-name{color:white;font-size:5.5px;font-weight:700;text-transform:uppercase;letter-spacing:.2px;line-height:1.3}'+
    '.idc-school-motto{color:rgba(255,255,255,.55);font-size:4.5px;font-style:italic;margin-top:1px}'+
    '.idc-body{padding:7px 8px 0;display:flex;gap:7px;align-items:flex-start}'+
    '.idc-passport{width:38px;height:46px;border-radius:3px;object-fit:cover;border:1.5px solid #C8981A;flex-shrink:0}'+
    '.idc-info{flex:1}.idc-label{font-size:4.5px;color:#F5C842;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:1px;margin-top:4px}.idc-label:first-child{margin-top:0}'+
    '.idc-value{font-size:7px;color:white;font-weight:700;line-height:1.2}.idc-value.large{font-size:8px}'+
    '.idc-id-band{background:#C8981A;margin:6px 8px 0;border-radius:2px;padding:3px 6px;display:flex;justify-content:space-between;align-items:center}'+
    '.idc-id-band span{font-size:4.5px;color:#004D26;font-weight:700;text-transform:uppercase}.idc-id-band strong{font-size:7.5px;color:#004D26;font-weight:900;letter-spacing:.5px}'+
    '.idc-type-badge{position:absolute;top:6px;right:6px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:white;font-size:4.5px;font-weight:700;padding:2px 5px;border-radius:2px;text-transform:uppercase}'+
    '.idc-back{background:white;padding:0 0 8px}.idc-back-header{background:#004D26;padding:5px 8px;border-bottom:1.5px solid #C8981A}'+
    '.idc-back-header p{color:rgba(255,255,255,.7);font-size:5px;text-align:center;text-transform:uppercase;letter-spacing:.3px}'+
    '.idc-back-body{padding:5px 8px}.idc-back-row{display:flex;justify-content:space-between;padding:2.5px 0;border-bottom:1px solid #f0f0f0;font-size:6px}'+
    '.idc-back-row span{color:#888;font-size:5px;font-weight:600;text-transform:uppercase}.idc-back-row strong{color:#222;font-weight:700}'+
    '.idc-barcode{margin:5px 8px 0;background:#f5f5f5;border-radius:2px;padding:4px;text-align:center}'+
    '.idc-barcode-lines{display:flex;gap:1px;justify-content:center;margin-bottom:2px;height:12px;align-items:flex-end}.idc-barcode-lines div{background:#222;border-radius:1px}'+
    '.idc-barcode p{font-size:5px;color:#888;letter-spacing:1.5px;font-family:monospace}'+
    '.idc-back-footer{margin:5px 8px 0;background:#f9f9f9;border:1px solid #eee;border-radius:2px;padding:4px 6px;font-size:5px;color:#888;line-height:1.5;text-align:center}'+
    '.btn{margin-top:14px;background:#006B35;color:white;border:none;padding:10px 28px;border-radius:4px;font-size:13px;font-weight:700;cursor:pointer}'+
    '@page{size:85.6mm 54mm;margin:0}@media print{.btn{display:none}body{padding:0;gap:0;display:block}.id-card{box-shadow:none;page-break-after:always;width:85.6mm;min-height:54mm}}'+
    '</style></head><body>'+
    '<div class="id-card">'+front.innerHTML+'</div>'+
    '<div class="id-card">'+back.innerHTML+'</div>'+
    '<button class="btn" onclick="window.print()">\ud83d\uddb8 Print / Save PDF</button>'+
    '</body></html>');
  w.document.close();
}

function portalSaveIdPDF() {
  portalPrintIdCard();
  setTimeout(function(){ showToast('In print dialog \u2192 choose "Save as PDF" \ud83d\udcbe'); }, 800);
}

function loadPortalFees() {
  var s = portalStudent;
  if (!s) return;
  var myFees = feeRecords.filter(function(f){ return f.studentId.toUpperCase() === s.studentId.toUpperCase(); });
  var empty  = document.getElementById('portalFeeEmpty');
  var body   = document.getElementById('portalFeeBody');

  if (myFees.length === 0) {
    body.innerHTML = '';
    empty.style.display = 'block';
    document.getElementById('pfee_total').textContent   = '\u20a60';
    document.getElementById('pfee_paid').textContent    = '\u20a60';
    document.getElementById('pfee_balance').textContent = '\u20a60';
    return;
  }
  empty.style.display = 'none';

  var totalFee  = myFees.reduce(function(a,f){ return a+f.totalFee; }, 0);
  var totalPaid = myFees.reduce(function(a,f){ return a+f.paidAmt; }, 0);
  var balance   = totalFee - totalPaid;

  document.getElementById('pfee_total').textContent   = '\u20a6' + totalFee.toLocaleString();
  document.getElementById('pfee_paid').textContent    = '\u20a6' + totalPaid.toLocaleString();
  document.getElementById('pfee_balance').textContent = '\u20a6' + balance.toLocaleString();

  var balCard = document.getElementById('pfee_balance_card');
  balCard.className = 'portal-fee-card ' + (balance > 0 ? 'owing' : '');
  var paidCard = document.getElementById('pfee_paid_card');
  paidCard.className = 'portal-fee-card ' + (totalPaid >= totalFee ? '' : 'partial');

  body.innerHTML = myFees.map(function(f) {
    var bal   = f.totalFee - f.paidAmt;
    var stCls = f.status==='paid'?'fee-paid':f.status==='partial'?'fee-partial':'fee-owing';
    var stLbl = f.status==='paid'?'Fully Paid':f.status==='partial'?'Partial':'Owing';
    return '<tr>'+
      '<td>'+f.term+'</td>'+
      '<td>'+f.year+'</td>'+
      '<td style="font-weight:600">\u20a6'+f.totalFee.toLocaleString()+'</td>'+
      '<td style="color:#047857;font-weight:600">\u20a6'+f.paidAmt.toLocaleString()+'</td>'+
      '<td style="color:'+(bal>0?'#B91C1C':'#047857')+';font-weight:700">'+(bal>0?'\u20a6'+bal.toLocaleString():'Nil')+'</td>'+
      '<td><span class="fee-status '+stCls+'">'+stLbl+'</span></td>'+
      '<td><button onclick="printReceipt(\''+f.id+'\')" style="background:none;border:1px solid #2563EB;color:#2563EB;border-radius:3px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer">🧾 Receipt</button></td>'+
    '</tr>';
  }).join('');
}

function loadPortalResults() {
  var s = portalStudent;
  if (!s) return;
  var term = document.getElementById('portalResTerm').value;
  var year = document.getElementById('portalResYear').value;

  var myResults = resultsDB.filter(function(r) {
    return r.studentId.toUpperCase() === s.studentId.toUpperCase() &&
      (!term || r.term === term) &&
      (!year || r.year === year);
  });

  var content_el = document.getElementById('portalResContent');
  var empty      = document.getElementById('portalResEmpty');

  if (myResults.length === 0) {
    content_el.innerHTML = '';
    empty.style.display  = 'block';
    return;
  }
  empty.style.display = 'none';

  // Group by term + year
  var groups = {};
  myResults.forEach(function(r) {
    var key = r.term + ' \u2014 ' + r.year;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  content_el.innerHTML = Object.keys(groups).map(function(key) {
    var rows = groups[key];
    var cls  = rows[0].studentClass || s.classPos || '';
    var classStats = computeClassAverageAndPosition(s.studentId, cls, rows[0].term, rows[0].year);
    var avg  = classStats.average || Math.round(rows.reduce(function(a,r){ return a+r.total; },0)/rows.length);
    var gi   = calcGrade(avg);
    var posText = classStats.position
      ? classStats.position + (classStats.totalInClass ? ' of ' + classStats.totalInClass : '')
      : '—';
    return '<div style="background:white;border-radius:8px;overflow:hidden;border:1px solid var(--light-gray);margin-bottom:20px">'+
      '<div style="background:var(--green-dark);padding:14px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">'+
        '<div><div style="color:var(--gold-light);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Term / Year</div>'+
        '<div style="color:white;font-size:16px;font-weight:700;margin-top:2px">'+key+'</div></div>'+
        '<div style="text-align:right"><div style="color:rgba(255,255,255,.6);font-size:11px">Average</div>'+
        '<div style="color:var(--gold);font-size:26px;font-weight:900;font-family:\'Merriweather\',serif">'+avg+'%</div>'+
        '<div style="color:white;font-size:11px;font-weight:600;margin-top:2px">Position: '+posText+'</div></div>'+
      '</div>'+
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:400px">'+
        '<thead><tr style="background:rgba(0,107,53,.08)">'+
          '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green-dark)">#</th>'+
          '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green-dark)">Subject</th>'+
          '<th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green-dark)">CA (40)</th>'+
          '<th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green-dark)">Exam (60)</th>'+
          '<th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green-dark)">Total</th>'+
          '<th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green-dark)">Position</th>'+
          '<th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green-dark)">Grade</th>'+
          '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green-dark)">Remarks</th>'+
        '</tr></thead>'+
        '<tbody>'+rows.map(function(r,i){
          return '<tr style="border-bottom:1px solid var(--light-gray)">'+
            '<td style="padding:10px 14px;color:var(--gray)">'+(i+1)+'</td>'+
            '<td style="padding:10px 14px;font-weight:600">'+r.subject+'</td>'+
            '<td style="padding:10px 14px;text-align:center">'+r.ca+'</td>'+
            '<td style="padding:10px 14px;text-align:center">'+r.exam+'</td>'+
            '<td style="padding:10px 14px;text-align:center;font-weight:700;font-size:15px">'+r.total+'</td>'+
            '<td style="padding:10px 14px;text-align:center;font-weight:600;color:#555">'+(r.subjectPosition||'—')+'</td>'+
            '<td style="padding:10px 14px;text-align:center"><span class="grade-badge '+getGradeClass(r.grade)+'">'+r.grade+'</span></td>'+
            '<td style="padding:10px 14px;color:var(--gray)">'+r.remarks+'</td>'+
          '</tr>';
        }).join('')+
        '</tbody>'+
        '<tfoot><tr style="background:var(--off-white);font-weight:700">'+
          '<td colspan="4" style="padding:10px 14px;color:var(--green-dark)">Overall Average</td>'+
          '<td style="padding:10px 14px;text-align:center;font-size:15px;color:var(--green-dark)">'+avg+'/100</td>'+
          '<td style="padding:10px 14px;text-align:center;font-size:13px;color:var(--green-dark)">'+posText+'</td>'+
          '<td style="padding:10px 14px;text-align:center"><span class="grade-badge '+getGradeClass(gi.grade)+'">'+gi.grade+'</span></td>'+
          '<td style="padding:10px 14px;color:var(--gray)">'+gi.remarks+'</td>'+
        '</tr></tfoot>'+
      '</table></div>'+
    '</div>';
  }).join('');
}

function printPortalResult() {
  var s = portalStudent;
  if (!s) return;
  var term = document.getElementById('portalResTerm').value;
  var year = document.getElementById('portalResYear').value;
  var rows = resultsDB.filter(function(r){
    return r.studentId.toUpperCase()===s.studentId.toUpperCase()&&
      (!term||r.term===term)&&(!year||r.year===year);
  });
  if (rows.length === 0) { showToast('No results to print \u26a0\ufe0f'); return; }
  var avg = Math.round(rows.reduce(function(a,r){return a+r.total;},0)/rows.length);
  var gi  = calcGrade(avg);
  var student = { name:s.name, id:s.studentId, cls:rows[0].studentClass||s.classPos||s.role||'—', term:term||'All Terms', year:year||'All Years', avg:avg, grade:gi.grade };
  var html = buildResultSlipHTML(rows, student, false);
  var w = window.open('','_blank');
  w.document.write(html);
  w.document.close();
}


/* ══════════════════════════════════════════════
   GOOGLE SHEETS PERMANENT DATABASE
   All data saved to / loaded from Google Sheets
══════════════════════════════════════════════ */

var SHEETS_LOADING = false;

// ── Utility: call the Apps Script ────────────────────────────────────────────
async function sheetsRequest(action, data) {
  // DB actions use db_url, form submissions use sheets_url
  var dbActions = ['save_student','update_student','delete_student',
                   'save_fee','update_fee','save_results',
                   'clear_students','clear_results','clear_fees',
                   'save_assignment','update_assignment','delete_assignment',
                   'submit_assignment','grade_submission',
                   'verify_login','create_staff','change_password','deactivate_staff'];
  var url = dbActions.indexOf(action) > -1
    ? (CONFIG.db_url || CONFIG.sheets_url)
    : CONFIG.sheets_url;
  if (!url || url === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
    console.warn('Sheets URL not configured');
    return { ok: false, error: 'Not configured' };
  }
  try {
    var payload = Object.assign({ action: action }, data || {});
    var resp = await fetch(url, {
      method: 'POST',
      mode:   'no-cors',
      headers:{ 'Content-Type': 'application/json' },
      body:   JSON.stringify(payload)
    });
    // no-cors means we can't read response — assume ok
    return { ok: true };
  } catch(e) {
    console.error('Sheets request error:', e);
    return { ok: false, error: e.message };
  }
}

// GET request (readable)
async function sheetsGet(action, params) {
  // Always use db_url for reading student/fee/results data
  var url = CONFIG.db_url || CONFIG.sheets_url;
  if (!url || url === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return { ok: false, students:[], results:[], fees:[] };
  try {
    var qs = '?action=' + action;
    if (params) {
      Object.keys(params).forEach(function(k){ qs += '&'+k+'='+encodeURIComponent(params[k]); });
    }
    var resp = await fetch(url + qs);
    var json = await resp.json();
    return json;
  } catch(e) {
    console.error('Sheets GET error:', e);
    return { ok: false, students:[], results:[], fees:[] };
  }
}

// ── Readable POST — for actions where we MUST see the real response          ──
// (e.g. login verification). Unlike sheetsRequest (no-cors, fire-and-forget),
// this waits for and parses the actual JSON reply from Apps Script.
async function sheetsPostReadable(action, data) {
  var url = CONFIG.db_url || CONFIG.sheets_url;
  if (!url || url === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return { ok: false, error: 'Not configured', networkError: true };
  try {
    var payload = Object.assign({ action: action }, data || {});
    var resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight
      body: JSON.stringify(payload)
    });
    var json = await resp.json();
    return json; // server-side ok:false here means a REAL auth failure, not a network issue
  } catch(e) {
    console.error('Sheets POST (readable) error:', e);
    return { ok: false, error: 'Could not reach the server. Check your internet connection.', networkError: true };
  }
}

function verifyLoginReadable(username, password) {
  return sheetsPostReadable('verify_login', { username: username, password: password });
}

var currentStaffAccount = null;

// ── Load ALL data on admin login ──────────────────────────────────────────────
async function loadAllFromSheets() {
  if (SHEETS_LOADING) return;
  SHEETS_LOADING = true;
  showToast('Loading data\u2026 \u23f3');
  try {
    var data = await sheetsGet('get_all');
    if (data.ok) {
      if (data.students && data.students.length > 0) {
        dbRecords = data.students;
      }
      if (data.results && data.results.length > 0) {
        resultsDB = data.results;
      }
      if (data.fees && data.fees.length > 0) {
        feeRecords = data.fees;
      }
      renderDB();
      updateDbStats();
      renderFeeTable && renderFeeTable();
      showToast('\u2705 ' + dbRecords.length + ' students, ' + resultsDB.length + ' results, ' + feeRecords.length + ' fee records loaded');
    } else {
      showToast('\u26a0\ufe0f Could not load from Sheets. Working offline.');
    }
  } catch(e) {
    showToast('\u26a0\ufe0f Sheets connection failed. Working offline.');
    console.error(e);
  }
  SHEETS_LOADING = false;
}

// ── Clear entire database ─────────────────────────────────────────────────────
async function clearAllDatabaseRecords() {
  // Triple confirmation to prevent accidents
  if (!confirm('⚠️ WARNING: This will permanently delete ALL student records from the database.\n\nThis CANNOT be undone.\n\nAre you absolutely sure?')) return;
  if (!confirm('Second confirmation: All ' + dbRecords.length + ' student records will be erased.\n\nClick OK only if you are 100% sure.')) return;
  var typed = prompt('Type "CLEAR" in capitals to confirm deletion:');
  if (typed !== 'CLEAR') { showToast('Cancelled — database NOT cleared'); return; }

  showToast('Clearing database\u2026 \u23f3');
  try {
    await sheetsRequest('clear_students', {});
    dbRecords = [];
    renderDB();
    updateDbStats();
    showToast('\u2705 All student records cleared successfully');
  } catch(e) {
    showToast('\u274c Failed to clear. Try again.');
    console.error(e);
  }
}

// ── Fetch full passport for a student only when needed (printing) ─────────────
async function fetchStudentPhoto(studentId) {
  // If already has a real base64 photo in local cache, use it
  var local = dbRecords.find(function(r){ return r.studentId.toUpperCase() === studentId.toUpperCase(); });
  if (local && local.passport && local.passport !== 'HAS_PHOTO') return local.passport;
  if (local && local.passport === 'HAS_PHOTO') {
    // Fetch from Sheets on demand
    try {
      var data = await sheetsGet('get_student_photo', { studentId: studentId });
      if (data.ok && data.student && data.student.passport) {
        // Cache it locally so subsequent prints don't need to fetch again
        if (local) local.passport = data.student.passport;
        return data.student.passport;
      }
    } catch(e) { /* Return empty if fetch fails */ }
  }
  return '';
}

// ── Save student to Sheets ────────────────────────────────────────────────────
async function saveStudentToSheets(record, isUpdate) {
  var action = isUpdate ? 'update_student' : 'save_student';
  var result = await sheetsRequest(action, record);
  if (!result.ok) {
    console.warn('Could not save to Sheets — saved locally only');
  }
  return result;
}

// ── Delete student from Sheets ────────────────────────────────────────────────
async function deleteStudentFromSheets(id) {
  await sheetsRequest('delete_student', { id: id });
}

// ── Save fee to Sheets ────────────────────────────────────────────────────────
async function saveFeeToSheets(record, isUpdate) {
  var action = isUpdate ? 'update_fee' : 'save_fee';
  await sheetsRequest(action, record);
}

// ── Save results to Sheets ────────────────────────────────────────────────────
async function saveResultsToSheets(rows) {
  await sheetsRequest('save_results', { rows: rows });
}

// ── Save career application to Sheets ────────────────────────────────────────
async function saveCareerToSheets(data) {
  await sheetsRequest('save_career', data);
}

// ── Silent background load on page open ──────────────────────────────────────
// Ensures students/parents using public features (Check Results, Student Portal,
// Fee Status) see real data immediately, without needing an admin to log in first
document.addEventListener('DOMContentLoaded', function() {
  sheetsGet('get_all').then(function(data) {
    if (data && data.ok) {
      if (data.students && data.students.length > 0) dbRecords   = data.students;
      if (data.results  && data.results.length  > 0) resultsDB   = data.results;
      if (data.fees     && data.fees.length     > 0) feeRecords  = data.fees;
    }
  }).catch(function(){ /* offline — public features will show "not found" until reload */ });
});

var isTeacherLoggedIn = false;

function teacherLogin() {
  var u = document.getElementById('tUsername').value.trim();
  var p = document.getElementById('tPassword').value;
  if (!u || !p) { showToast('Please enter username and password \u26a0\ufe0f'); return; }

  showToast('Verifying\u2026 \u23f3');
  verifyLoginReadable(u, p).then(function(result) {
    if (result && result.ok && (result.account.role === 'teacher' || result.account.role === 'admin')) {
      isTeacherLoggedIn = true;
      currentStaffAccount = result.account;
      document.getElementById('teacherLogin').style.display  = 'none';
      document.getElementById('uploadPortal').style.display  = 'block';
      showToast('Welcome, ' + result.account.fullName + '! Loading student list\u2026 \u23f3');

      // Load students from Sheets so template generates with real names
      sheetsGet('get_students').then(function(data) {
        if (data && data.ok && data.students && data.students.length > 0) {
          dbRecords = data.students;
          showToast('\u2705 Portal ready! ' + dbRecords.length + ' students loaded.');
        } else {
          showToast('\u2705 Upload portal is ready \ud83c\udf89');
        }
      }).catch(function() {
        showToast('\u2705 Upload portal is ready \ud83c\udf89');
      });
    } else {
      showToast('\u274c ' + (result && result.error ? result.error : 'Incorrect username or password'));
    }
  });
}

function teacherRefreshStudents() {
  showToast('Refreshing student list\u2026 \u23f3');
  sheetsGet('get_students').then(function(data) {
    if (data && data.ok && data.students && data.students.length > 0) {
      dbRecords = data.students;
      updateTemplatePreview(); // refresh the preview table
      showToast('\u2705 ' + dbRecords.length + ' students loaded. Now select your class.');
    } else {
      showToast('\u26a0\ufe0f Could not load students. Check internet connection.');
    }
  }).catch(function() {
    showToast('\u26a0\ufe0f Connection error. Please try again.');
  });
}

function logoutTeacher() {
  isTeacherLoggedIn = false;
  document.getElementById('uploadPortal').style.display = 'none';
  showToast('Logged out successfully.');
}

function toggleTeacherLogin() {
  var login  = document.getElementById('teacherLogin');
  var portal = document.getElementById('uploadPortal');
  if (!login || !portal) return;
  if (isTeacherLoggedIn) {
    portal.style.display = portal.style.display === 'none' ? 'block' : 'none';
  } else {
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
    if (login.style.display === 'block') {
      var u = document.getElementById('tUsername');
      if (u) setTimeout(function(){ u.focus(); }, 100);
    }
  }
}


function printResults() {
  var sid   = document.getElementById('studentId').value.trim().toUpperCase();
  var term  = document.getElementById('termSelect').value;
  var year  = document.getElementById('yearSelect').value;
  var rows  = resultsDB.filter(function(r) {
    return r.studentId.toUpperCase() === sid &&
      (!term || r.term === term) &&
      (!year || r.year === year);
  });
  if (rows.length === 0) { showToast('No results to print ⚠️'); return; }
  var avg  = Math.round(rows.reduce(function(a,r){ return a+r.total; },0)/rows.length);
  var gi   = calcGrade(avg);
  var name = rows[0].studentName;
  var cls  = rows[0].studentClass || '—';
  var student = { name:name, id:sid, cls:cls, term:term||'All Terms', year:year||'All Years', avg:avg, grade:gi.grade };
  var html = buildResultSlipHTML(rows, student, false);
  var w = window.open('','_blank');
  w.document.write(html);
  w.document.close();
}

/* ── ADMIN SECRET ACCESS ── */
// Method 1: Press Ctrl + Shift + A
// Method 2: Click the footer school crest 5 times fast
let adminClickCount = 0;
let adminClickTimer = null;

function adminCrestClick() {
  adminClickCount++;
  clearTimeout(adminClickTimer);
  adminClickTimer = setTimeout(() => { adminClickCount = 0; }, 2000);
  if (adminClickCount >= 5) {
    adminClickCount = 0;
    openAdminLogin();
  }
}

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    openAdminLogin();
  }
});

let adminAuthenticated = false;

function openAdminLogin() {
  if (adminAuthenticated) {
    revealAdminPanelsIfAuthenticated();
    goTo('setupguide');
    return;
  }
  var overlay = document.getElementById('adminOverlay');
  overlay.style.display = 'flex';
  setTimeout(function(){ overlay.style.opacity = '1'; }, 10);
  document.getElementById('adminPwd').value = '';
  document.getElementById('adminPwdError').style.display = 'none';
  setTimeout(function(){ document.getElementById('adminPwd').focus(); }, 100);
}

function closeAdminOverlay() {
  var overlay = document.getElementById('adminOverlay');
  overlay.style.opacity = '0';
  setTimeout(function(){ overlay.style.display = 'none'; }, 300);
}

function revealAdminPanelsIfAuthenticated() {
  if (!adminAuthenticated) return;
  var setup = document.getElementById('setupguide');
  if (setup) setup.style.display = 'block';
  var feePanel  = document.getElementById('feeAdminPanel');
  var feePrompt = document.getElementById('feeLoginPrompt');
  if (feePanel)  feePanel.style.display  = 'block';
  if (feePrompt) feePrompt.style.display = 'none';
  if (feePanel) { renderFeeTable(); updateFeeStats(); }
}

function adminLogoutGlobal() {
  adminAuthenticated = false;
  var setup = document.getElementById('setupguide');
  if (setup) setup.style.display = 'none';
  var feePanel  = document.getElementById('feeAdminPanel');
  var feePrompt = document.getElementById('feeLoginPrompt');
  if (feePanel)  feePanel.style.display  = 'none';
  if (feePrompt) feePrompt.style.display = 'block';
  showToast('Logged out of admin panel');
}

function submitAdminLogin() {
  var pwd = document.getElementById('adminPwd').value;
  if (!pwd) { showToast('Please enter your password \u26a0\ufe0f'); return; }

  showToast('Verifying\u2026 \u23f3');
  verifyLoginReadable('admin', pwd).then(function(result) {
    if (result && result.ok) {
      adminAuthenticated = true;
      currentStaffAccount = result.account;
      closeAdminOverlay();
      revealAdminPanelsIfAuthenticated();
      setTimeout(function(){ goTo('setupguide'); }, 350);
      showToast('Admin access granted \u2705 Welcome, ' + (result.account.fullName || 'Admin'));
    } else {
      var msg = (result && result.error) ? result.error : 'Incorrect password';
      if (result && result.networkError) {
        msg = '\u26a0\ufe0f ' + msg + ' If this keeps happening, check with your developer \u2014 the Apps Script may need redeploying.';
      } else {
        msg = '\u274c ' + msg;
      }
      document.getElementById('adminPwdError').textContent = msg;
      document.getElementById('adminPwdError').style.display = 'block';
      document.getElementById('adminPwd').value = '';
      document.getElementById('adminPwd').focus();
      setTimeout(function(){ document.getElementById('adminPwdError').style.display = 'none'; }, 6000);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var ap = document.getElementById('adminPwd');
  if (ap) ap.addEventListener('keypress', function(e){ if(e.key==='Enter') submitAdminLogin(); });
});

/* HERO SLIDESHOW */
let currentSlide = 0;
const totalSlides = 3;
let slideTimer = null;

function goSlide(n) {
  document.querySelectorAll('.hero-slide').forEach((s,i) => s.classList.toggle('active', i===n));
  document.querySelectorAll('.hero-dot').forEach((d,i) => d.classList.toggle('active', i===n));
  currentSlide = n;
}

function nextSlide() {
  goSlide((currentSlide + 1) % totalSlides);
}

slideTimer = setInterval(nextSlide, 5000);

// Pause on hover
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('home');
  if (hero) {
    hero.addEventListener('mouseenter', () => clearInterval(slideTimer));
    hero.addEventListener('mouseleave', () => { slideTimer = setInterval(nextSlide, 5000); });
  }
});

/* ── CURRICULUM TAB SWITCHER (index page) ─────────────────────────────────── */
function showCurTab(btn, id) {
  // Hide all panels
  document.querySelectorAll('.cur-panel').forEach(function(p){ p.style.display = 'none'; });
  // Remove active from all tabs
  document.querySelectorAll('.cur-tab').forEach(function(b){ b.classList.remove('cur-active'); });
  // Show selected
  var panel = document.getElementById('cur-' + id);
  if (panel) panel.style.display = 'block';
  btn.classList.add('cur-active');
}

/* ══════════════════════════════════════════════
   STUDENT CLASS UPGRADE SYSTEM
══════════════════════════════════════════════ */

// Class progression map — every class and where it leads
var CLASS_UPGRADE_MAP = {
  // Nursery
  'Pre-Nursery': 'Nursery 1',
  'Nursery 1':   'Nursery 2',
  'Nursery 2':   'Nursery 3',
  'Nursery 3':   'Primary 1',
  // Primary
  'Primary 1':   'Primary 2',
  'Primary 2':   'Primary 3',
  'Primary 3':   'Primary 4',
  'Primary 4':   'Primary 5',
  'Primary 5':   'Primary 6',
  'Primary 6':   'JSS 1',
  // JSS
  'JSS 1':       'JSS 2',
  'JSS 2':       'JSS 3',
  'JSS 3':       'SSS 1',
  // SSS
  'SSS 1':       'SSS 2',
  'SSS 2':       'SSS 3',
  'SSS 3':       'GRADUATED',
};

// Subjects auto-assigned per new class after upgrade
function getSubjectsForClass(cls) {
  var jss = ['Mathematics','English Language','Igbo Language','Livestock Farming',
    'Social and Citizenship Education','Home Economics','Business Studies',
    'Cultural and Creative Art','Physical and Health Education','Intermediate Science',
    'Christian Religious Studies','Digital Technologies','Nigerian History','Craft'];
  var pri = ['English','Mathematics','Igbo','Basic Science','Basic Technology',
    'Home Economics','Social Studies','Civic Education','Security Education',
    'C.R.S','C.C.A','Agricultural Science','P.H.E','Computer Studies',
    'Verbal Reasoning','Quantitative Reasoning','Drawing','Writing','French','Craft','Vocational Studies'];
  var nur = ['English Studies','Mathematics','Asụsụ Igbo','Food and Nutrition',
    'Health Habit','Social Habit','General Science','Computer Studies',
    'Christian Religious Studies','Writing','Poems','Colouring','Verbal Reasoning',
    'Quantitative','Summative Test'];
  if (cls && cls.indexOf('JSS') === 0) return jss;
  if (cls && cls.indexOf('Primary') === 0) return pri;
  if (cls && (cls.indexOf('Nursery') === 0 || cls === 'Pre-Nursery')) return nur;
  return []; // SSS — manual
}

function toggleUpgradePanel() {
  var panel = document.getElementById('upgradePanel');
  var btn   = document.getElementById('upgradePanelBtn');
  var open  = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  btn.style.background = open ? '#7C3AED' : '#5B21B6';
  if (!open) {
    document.getElementById('upgradePreview').textContent =
      'Click "Preview Upgrade" to see how many students will be affected.';
    document.getElementById('upgradePreview').style.background = '#f5f3ff';
    document.getElementById('upgradePreview').style.color = '#7C3AED';
    document.getElementById('executeUpgradeBtn').style.display = 'none';
  }
}

var _upgradeData = []; // holds preview result before executing

function previewUpgrade() {
  var doNursery   = document.getElementById('upg_nursery').checked;
  var doPrimary   = document.getElementById('upg_primary').checked;
  var doSecondary = document.getElementById('upg_secondary').checked;

  _upgradeData = [];
  var graduated = 0, unchanged = 0;

  dbRecords.forEach(function(r) {
    var role = r.role || '';
    if (role === 'staff') return;
    if (role === 'nursery'   && !doNursery)   return;
    if (role === 'primary'   && !doPrimary)   return;
    if (role === 'secondary' && !doSecondary) return;

    var currentClass = r.classPos || '';
    var nextClass    = CLASS_UPGRADE_MAP[currentClass];

    if (!nextClass) { unchanged++; return; } // unknown class — skip

    _upgradeData.push({
      record:    r,
      fromClass: currentClass,
      toClass:   nextClass,
    });
    if (nextClass === 'GRADUATED') graduated++;
  });

  var preview = document.getElementById('upgradePreview');
  var execBtn = document.getElementById('executeUpgradeBtn');

  if (_upgradeData.length === 0) {
    preview.innerHTML = '⚠️ No students match the selected options, or all students are already at their final class.';
    preview.style.background = '#FEF3C7';
    preview.style.color = '#92400E';
    execBtn.style.display = 'none';
    return;
  }

  // Build summary by class
  var fromCount = {};
  _upgradeData.forEach(function(d) {
    fromCount[d.fromClass] = (fromCount[d.fromClass] || 0) + 1;
  });

  var rows = Object.keys(fromCount).sort().map(function(cls) {
    var next = CLASS_UPGRADE_MAP[cls];
    return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #DDD6FE;font-size:13px">'
      + '<span>' + cls + ' (' + fromCount[cls] + ' students)</span>'
      + '<span style="color:' + (next==='GRADUATED'?'#B91C1C':'#15803D') + ';font-weight:700">→ ' + next + '</span>'
      + '</div>';
  }).join('');

  preview.innerHTML = '<strong style="color:#7C3AED">' + _upgradeData.length + ' students</strong> will be upgraded'
    + (graduated ? ' · <strong style="color:#B91C1C">' + graduated + ' graduating (SSS 3)</strong>' : '')
    + '<div style="margin-top:10px">' + rows + '</div>';
  preview.style.background = '#f5f3ff';
  preview.style.color = '#374151';
  execBtn.style.display = 'inline-block';
}

function executeUpgrade() {
  if (_upgradeData.length === 0) {
    showToast('Please click "Preview Upgrade" first ⚠️');
    return;
  }

  var doSubjects = document.getElementById('upg_update_subjects').checked;

  if (!confirm('Apply upgrade for ' + _upgradeData.length + ' students?\n\nThis will update their class in Google Sheets and cannot be undone.\n\nMake sure you exported a CSV backup first!')) return;

  var done = 0, errors = 0;
  var total = _upgradeData.length;

  showToast('Upgrading ' + total + ' students… ⏳');

  // Process in batches to avoid overwhelming the API
  var queue = _upgradeData.slice();

  function processNext() {
    if (queue.length === 0) {
      renderDB();
      updateDbStats();
      showToast('✅ ' + done + ' students upgraded!' + (errors ? ' (' + errors + ' errors)' : ''));
      document.getElementById('executeUpgradeBtn').style.display = 'none';
      document.getElementById('upgradePreview').innerHTML =
        '✅ Upgrade complete! <strong>' + done + '</strong> students promoted.'
        + (errors ? ' <span style="color:#B91C1C">' + errors + ' errors.</span>' : '');
      _upgradeData = [];
      return;
    }

    var item = queue.shift();
    var r    = item.record;

    // Update local record
    var newClass    = item.toClass;
    var isGraduated = newClass === 'GRADUATED';

    r.classPos = isGraduated ? 'Graduated' : newClass;
    if (isGraduated) {
      r.role = 'graduated';
    } else if (doSubjects) {
      var newSubjects = getSubjectsForClass(newClass);
      if (newSubjects.length > 0) r.subjects = newSubjects;
    }

    // Save to Sheets
    saveStudentToSheets(r, true).then(function() {
      done++;
    }).catch(function() {
      errors++;
    }).finally(function() {
      // Small delay to avoid rate limiting
      setTimeout(processNext, 150);
    });
  }

  processNext();
}

/* ══════════════════════════════════════════════
   ASSIGNMENTS / TESTS / EXAMS SYSTEM
══════════════════════════════════════════════ */

var isAssignTeacherLoggedIn = false;
var assignmentsDB = [];
var submissionsDB = [];
var _questionsBeingBuilt = [];
var _currentTakingAssignment = null;
var _takeTimerInterval = null;
var _takeTimeRemaining = 0;

/* ── TEACHER SIDE ─────────────────────────────────────────────────────────── */

function toggleAssignTeacherLogin() {
  var login = document.getElementById('assignTeacherLogin');
  var portal = document.getElementById('assignPortal');
  if (isAssignTeacherLoggedIn) {
    portal.style.display = portal.style.display === 'none' ? 'block' : 'none';
  } else {
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
  }
}

function assignTeacherLogin() {
  var u = document.getElementById('atUsername').value.trim();
  var p = document.getElementById('atPassword').value;
  if (!u || !p) { showToast('Please enter username and password \u26a0\ufe0f'); return; }

  showToast('Verifying\u2026 \u23f3');
  verifyLoginReadable(u, p).then(function(result) {
    if (result && result.ok && (result.account.role === 'teacher' || result.account.role === 'admin')) {
      isAssignTeacherLoggedIn = true;
      currentStaffAccount = result.account;
      document.getElementById('assignTeacherLogin').style.display = 'none';
      document.getElementById('assignPortal').style.display = 'block';
      populateClassDropdown(document.getElementById('asg_class'), '', 'Select Class');
      showToast('Welcome, ' + result.account.fullName + '! Loading assignments\u2026 \u23f3');
      loadTeacherAssignments();
    } else {
      showToast('\u274c ' + (result && result.error ? result.error : 'Incorrect username or password'));
    }
  });
}

function logoutAssignTeacher() {
  isAssignTeacherLoggedIn = false;
  document.getElementById('assignPortal').style.display = 'none';
  showToast('Logged out successfully.');
}

function addQuestion(type) {
  var q = {
    id: 'q_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    type: type,               // 'mcq' or 'text'
    question: '',
    options: type === 'mcq' ? ['', '', '', ''] : [],
    correctIndex: 0,
    marks: 1
  };
  _questionsBeingBuilt.push(q);
  renderQuestionsBuilder();
}

function removeQuestion(id) {
  _questionsBeingBuilt = _questionsBeingBuilt.filter(function(q){ return q.id !== id; });
  renderQuestionsBuilder();
}

function updateQuestionField(id, field, value, optIndex) {
  var q = _questionsBeingBuilt.find(function(q){ return q.id === id; });
  if (!q) return;
  if (field === 'option' && optIndex !== undefined) {
    q.options[optIndex] = value;
  } else {
    q[field] = value;
  }
  updateTotalMarksPreview();
}

function updateTotalMarksPreview() {
  var total = _questionsBeingBuilt.reduce(function(sum, q){ return sum + (parseInt(q.marks) || 0); }, 0);
  var el = document.getElementById('totalMarksPreview');
  if (el) el.textContent = 'Total marks: ' + total;
}

function renderQuestionsBuilder() {
  var container = document.getElementById('questionsBuilder');
  var noQ = document.getElementById('noQuestions');
  if (_questionsBeingBuilt.length === 0) {
    container.innerHTML = '';
    noQ.style.display = 'block';
    updateTotalMarksPreview();
    return;
  }
  noQ.style.display = 'none';

  container.innerHTML = _questionsBeingBuilt.map(function(q, idx) {
    var html = '<div style="background:white;border:1px solid var(--light-gray);border-radius:6px;padding:14px;margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
        '<span style="font-size:12px;font-weight:700;color:var(--green-dark)">Question ' + (idx+1) + ' \u2014 ' + (q.type === 'mcq' ? 'Multiple Choice' : 'Text Answer') + '</span>' +
        '<button onclick="removeQuestion(\'' + q.id + '\')" style="background:none;border:none;color:#B91C1C;cursor:pointer;font-size:16px">\u2715</button>' +
      '</div>' +
      '<textarea placeholder="Enter question text..." oninput="updateQuestionField(\'' + q.id + '\',\'question\',this.value)" style="width:100%;padding:8px 10px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;margin-bottom:10px;resize:vertical" rows="2">' + (q.question||'') + '</textarea>';

    if (q.type === 'mcq') {
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">';
      for (var i = 0; i < 4; i++) {
        html += '<div style="display:flex;align-items:center;gap:6px">' +
          '<input type="radio" name="correct_' + q.id + '" ' + (q.correctIndex === i ? 'checked' : '') + ' onchange="updateQuestionField(\'' + q.id + '\',\'correctIndex\',' + i + ')">' +
          '<input type="text" placeholder="Option ' + (i+1) + '" value="' + (q.options[i]||'').replace(/"/g,'&quot;') + '" oninput="updateQuestionField(\'' + q.id + '\',\'option\',this.value,' + i + ')" style="flex:1;padding:6px 8px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px">' +
        '</div>';
      }
      html += '</div><p style="font-size:11px;color:var(--gray);margin-bottom:8px">Select the radio button next to the correct answer</p>';
    }

    html += '<div style="display:flex;align-items:center;gap:8px">' +
      '<label style="font-size:12px;color:var(--gray)">Marks:</label>' +
      '<input type="number" value="' + q.marks + '" min="1" oninput="updateQuestionField(\'' + q.id + '\',\'marks\',this.value)" style="width:60px;padding:6px 8px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px">' +
    '</div>' +
    '</div>';
    return html;
  }).join('');

  updateTotalMarksPreview();
}

function createAssignment() {
  var title    = document.getElementById('asg_title').value.trim();
  var type     = document.getElementById('asg_type').value;
  var classPos = document.getElementById('asg_class').value;
  var subject  = document.getElementById('asg_subject').value.trim();
  var term     = document.getElementById('asg_term').value;
  var year     = document.getElementById('asg_year').value;
  var duration = parseInt(document.getElementById('asg_duration').value) || 0;
  var dueDate  = document.getElementById('asg_duedate').value;
  var instructions = document.getElementById('asg_instructions').value.trim();

  if (!title)    { showToast('Please enter a title \u26a0\ufe0f'); return; }
  if (!classPos) { showToast('Please select a Class \u26a0\ufe0f'); return; }
  if (!subject)  { showToast('Please enter a Subject \u26a0\ufe0f'); return; }
  if (_questionsBeingBuilt.length === 0) { showToast('Please add at least one question \u26a0\ufe0f'); return; }

  // Validate questions
  for (var i = 0; i < _questionsBeingBuilt.length; i++) {
    var q = _questionsBeingBuilt[i];
    if (!q.question.trim()) { showToast('Question ' + (i+1) + ' text is empty \u26a0\ufe0f'); return; }
    if (q.type === 'mcq' && q.options.some(function(o){ return !o.trim(); })) {
      showToast('Question ' + (i+1) + ' has an empty option \u26a0\ufe0f'); return;
    }
  }

  var totalMarks = _questionsBeingBuilt.reduce(function(s,q){ return s + (parseInt(q.marks)||0); }, 0);

  var payload = {
    title: title,
    type: type,
    classPos: classPos,
    subject: subject,
    term: term,
    year: year,
    instructions: instructions,
    questionsJSON: JSON.stringify(_questionsBeingBuilt),
    durationMinutes: duration,
    totalMarks: totalMarks,
    dueDate: dueDate,
    teacherName: 'Teacher'
  };

  showToast('Publishing\u2026 \u23f3');
  sheetsRequest('save_assignment', payload).then(function() {
    showToast('\u2705 ' + type + ' published to ' + classPos + '!');
    // Reset form
    document.getElementById('asg_title').value = '';
    document.getElementById('asg_subject').value = '';
    document.getElementById('asg_instructions').value = '';
    document.getElementById('asg_duration').value = '0';
    document.getElementById('asg_duedate').value = '';
    _questionsBeingBuilt = [];
    renderQuestionsBuilder();
    loadTeacherAssignments();
  }).catch(function() {
    showToast('\u26a0\ufe0f Could not publish. Check connection and try again.');
  });
}

function loadTeacherAssignments() {
  sheetsGet('get_assignments', {}).then(function(data) {
    if (data && data.ok) {
      assignmentsDB = data.assignments || [];
      renderTeacherAssignmentsList();
    }
  }).catch(function() {
    showToast('\u26a0\ufe0f Could not load assignments');
  });
}

function renderTeacherAssignmentsList() {
  var container = document.getElementById('teacherAssignmentsList');
  if (!container) return;
  if (assignmentsDB.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--gray);font-size:13px">No assignments published yet.</p>';
    return;
  }
  container.innerHTML = assignmentsDB.map(function(a) {
    var typeColor = a.type === 'Exam' ? '#B91C1C' : a.type === 'Test' ? '#B45309' : '#047857';
    return '<div style="background:white;border:1px solid var(--light-gray);border-radius:6px;padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
      '<div>' +
        '<span style="background:' + typeColor + ';color:white;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;margin-right:8px">' + a.type + '</span>' +
        '<strong style="font-size:14px">' + a.title + '</strong>' +
        '<div style="font-size:12px;color:var(--gray);margin-top:4px">' + a.classPos + ' \u00b7 ' + a.subject + ' \u00b7 ' + a.totalMarks + ' marks' + (a.durationMinutes > 0 ? ' \u00b7 ' + a.durationMinutes + ' min' : '') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button onclick="viewSubmissions(\'' + a.id + '\',\'' + a.title.replace(/'/g,"\'") + '\')" style="background:rgba(29,78,216,.1);color:#1D4ED8;border:1px solid rgba(29,78,216,.2);padding:6px 14px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">\ud83d\udc41 Submissions</button>' +
        '<button onclick="deleteTeacherAssignment(\'' + a.id + '\')" style="background:rgba(183,28,28,.1);color:#B91C1C;border:1px solid rgba(183,28,28,.2);padding:6px 14px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">\ud83d\uddd1</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function deleteTeacherAssignment(id) {
  if (!confirm('Delete this assignment? Student submissions will remain but the assignment will no longer be visible.')) return;
  sheetsRequest('delete_assignment', { id: id }).then(function() {
    showToast('\u2705 Assignment deleted');
    loadTeacherAssignments();
  });
}

function viewSubmissions(assignmentId, title) {
  document.getElementById('gradingPanel').style.display = 'block';
  document.getElementById('gradingAssignmentTitle').textContent = title;
  document.getElementById('submissionsList').innerHTML = '<p style="text-align:center;padding:20px;color:var(--gray)">Loading\u2026</p>';
  document.getElementById('gradingPanel').scrollIntoView({behavior:'smooth'});

  sheetsGet('get_submissions', { assignmentId: assignmentId }).then(function(data) {
    var subs = (data && data.ok) ? data.submissions : [];
    var container = document.getElementById('submissionsList');
    if (subs.length === 0) {
      container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--gray);font-size:13px">No submissions yet.</p>';
      return;
    }
    container.innerHTML = subs.map(function(s) {
      var graded = s.score !== '' && s.score !== null && s.score !== undefined;
      return '<div style="background:white;border:1px solid var(--light-gray);border-radius:6px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
        '<div><strong style="font-size:13px">' + s.studentName + '</strong> <span style="color:var(--gray);font-size:11px">(' + s.studentId + ')</span>' +
        '<div style="font-size:11px;color:var(--gray);margin-top:2px">Submitted: ' + s.submittedAt + '</div></div>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          (s.autoGraded === 'yes'
            ? '<span style="font-weight:700;color:var(--green-dark)">' + s.score + '/' + s.maxScore + ' (auto-graded)</span>'
            : '<input type="number" id="score_' + s.id + '" placeholder="Score" value="' + (graded?s.score:'') + '" style="width:70px;padding:6px 8px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px">' +
              '<button onclick="saveGrade(\'' + s.id + '\')" style="background:var(--green-dark);color:white;border:none;padding:6px 14px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">Save</button>'
          ) +
        '</div>' +
      '</div>';
    }).join('');
  });
}

function saveGrade(submissionId) {
  var score = document.getElementById('score_' + submissionId).value;
  if (score === '') { showToast('Please enter a score \u26a0\ufe0f'); return; }
  sheetsRequest('grade_submission', { id: submissionId, score: parseFloat(score) }).then(function() {
    showToast('\u2705 Grade saved');
  });
}

/* ── STUDENT SIDE ──────────────────────────────────────────────────────────── */

function loadStudentAssignments() {
  var s = portalStudent;
  if (!s) return;
  var container = document.getElementById('assignmentsList');
  var noAsg = document.getElementById('noAssignments');
  container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--gray)">Loading\u2026</p>';

  Promise.all([
    sheetsGet('get_assignments', { classPos: s.classPos, status: 'active' }),
    sheetsGet('get_submissions', { studentId: s.studentId })
  ]).then(function(results) {
    var asgData = results[0];
    var subData = results[1];
    assignmentsDB = (asgData && asgData.ok) ? asgData.assignments : [];
    submissionsDB = (subData && subData.ok) ? subData.submissions : [];

    if (assignmentsDB.length === 0) {
      container.innerHTML = '';
      noAsg.style.display = 'block';
      return;
    }
    noAsg.style.display = 'none';

    var mySubmittedIds = submissionsDB.map(function(sub){ return sub.assignmentId; });

    container.innerHTML = assignmentsDB.map(function(a) {
      var submitted = mySubmittedIds.indexOf(a.id) > -1;
      var mySub = submissionsDB.find(function(sub){ return sub.assignmentId === a.id; });
      var typeColor = a.type === 'Exam' ? '#B91C1C' : a.type === 'Test' ? '#B45309' : '#047857';
      var isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && !submitted;

      return '<div style="background:white;border:1px solid var(--light-gray);border-radius:8px;padding:16px;margin-bottom:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">' +
          '<div>' +
            '<span style="background:' + typeColor + ';color:white;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;margin-right:8px">' + a.type + '</span>' +
            (submitted ? '<span style="background:rgba(4,120,87,.1);color:#047857;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700">\u2713 SUBMITTED</span>' : (isOverdue ? '<span style="background:rgba(183,28,28,.1);color:#B91C1C;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700">OVERDUE</span>' : '')) +
            '<h4 style="font-size:15px;margin-top:8px;color:var(--green-dark)">' + a.title + '</h4>' +
            '<p style="font-size:12px;color:var(--gray);margin-top:3px">' + a.subject + ' \u00b7 ' + a.totalMarks + ' marks' + (a.durationMinutes > 0 ? ' \u00b7 \u23f1 ' + a.durationMinutes + ' min' : '') + (a.dueDate ? ' \u00b7 Due: ' + a.dueDate : '') + '</p>' +
          '</div>' +
          (submitted
            ? (mySub && mySub.autoGraded === 'yes'
                ? '<div style="text-align:center"><div style="font-size:20px;font-weight:900;color:var(--green-dark)">' + mySub.score + '/' + mySub.maxScore + '</div><div style="font-size:10px;color:var(--gray)">Score</div></div>'
                : '<span style="font-size:12px;color:var(--gray)">Awaiting grading</span>')
            : '<button onclick="startAssignment(\'' + a.id + '\')" style="background:var(--green-dark);color:white;border:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:700;cursor:pointer;font-family:\'Open Sans\',sans-serif">Start \u2192</button>'
          ) +
        '</div>' +
      '</div>';
    }).join('');
  }).catch(function() {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--gray)">Could not load assignments. Check your connection.</p>';
  });
}

function startAssignment(id) {
  var a = assignmentsDB.find(function(x){ return x.id === id; });
  if (!a) return;
  _currentTakingAssignment = a;

  document.getElementById('assignmentsListView').style.display = 'none';
  document.getElementById('assignmentTakeView').style.display = 'block';
  document.getElementById('assignmentResultView').style.display = 'none';

  document.getElementById('takeAsgTitle').textContent = a.title;
  document.getElementById('takeAsgMeta').textContent = a.subject + ' \u00b7 ' + a.totalMarks + ' marks \u00b7 ' + a.classPos;
  document.getElementById('takeAsgInstructions').textContent = a.instructions || 'Answer all questions to the best of your ability.';

  var questions = JSON.parse(a.questionsJSON || '[]');
  var qContainer = document.getElementById('takeAsgQuestions');
  qContainer.innerHTML = questions.map(function(q, idx) {
    var html = '<div style="background:var(--off-white);border-radius:8px;padding:16px;margin-bottom:14px">' +
      '<p style="font-weight:700;font-size:14px;margin-bottom:12px">' + (idx+1) + '. ' + q.question + ' <span style="font-weight:400;color:var(--gray);font-size:12px">(' + q.marks + ' mark' + (q.marks>1?'s':'') + ')</span></p>';
    if (q.type === 'mcq') {
      html += '<div style="display:flex;flex-direction:column;gap:8px">';
      q.options.forEach(function(opt, i) {
        html += '<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:white;border:1px solid var(--light-gray);border-radius:6px;cursor:pointer">' +
          '<input type="radio" name="ans_' + q.id + '" value="' + i + '">' +
          '<span style="font-size:13px">' + opt + '</span>' +
        '</label>';
      });
      html += '</div>';
    } else {
      html += '<textarea id="ans_' + q.id + '" rows="3" placeholder="Type your answer here..." style="width:100%;padding:10px 12px;border:1px solid var(--light-gray);border-radius:6px;font-size:13px;resize:vertical"></textarea>';
    }
    html += '</div>';
    return html;
  }).join('');

  // Timer
  var timerEl = document.getElementById('takeAsgTimer');
  if (a.durationMinutes && a.durationMinutes > 0) {
    _takeTimeRemaining = a.durationMinutes * 60;
    timerEl.style.display = 'block';
    updateTimerDisplay();
    _takeTimerInterval = setInterval(function() {
      _takeTimeRemaining--;
      updateTimerDisplay();
      if (_takeTimeRemaining <= 0) {
        clearInterval(_takeTimerInterval);
        showToast('\u23f0 Time is up! Submitting automatically\u2026');
        submitStudentAssignment();
      }
    }, 1000);
  } else {
    timerEl.style.display = 'none';
  }
}

function updateTimerDisplay() {
  var m = Math.floor(_takeTimeRemaining / 60);
  var s = _takeTimeRemaining % 60;
  var el = document.getElementById('takeAsgTimer');
  el.textContent = '\u23f1 ' + m + ':' + String(s).padStart(2,'0');
  if (_takeTimeRemaining <= 60) el.style.background = '#B91C1C';
}

function cancelTakingAssignment() {
  if (_takeTimerInterval) clearInterval(_takeTimerInterval);
  document.getElementById('assignmentTakeView').style.display = 'none';
  document.getElementById('assignmentsListView').style.display = 'block';
  _currentTakingAssignment = null;
}

function submitStudentAssignment() {
  if (_takeTimerInterval) clearInterval(_takeTimerInterval);
  var a = _currentTakingAssignment;
  if (!a) return;
  var s = portalStudent;

  var questions = JSON.parse(a.questionsJSON || '[]');
  var answers = [];
  var autoScore = 0;
  var maxScore = a.totalMarks;
  var allAutoGradeable = true;

  questions.forEach(function(q) {
    if (q.type === 'mcq') {
      var selected = document.querySelector('input[name="ans_' + q.id + '"]:checked');
      var selIdx = selected ? parseInt(selected.value) : -1;
      answers.push({ questionId: q.id, answer: selIdx });
      if (selIdx === q.correctIndex) autoScore += parseInt(q.marks);
    } else {
      var txt = document.getElementById('ans_' + q.id).value.trim();
      answers.push({ questionId: q.id, answer: txt });
      allAutoGradeable = false;
    }
  });

  var payload = {
    assignmentId: a.id,
    studentId: s.studentId,
    studentName: s.name,
    answersJSON: JSON.stringify(answers),
    score: allAutoGradeable ? autoScore : undefined,
    maxScore: maxScore,
    autoGraded: allAutoGradeable
  };

  showToast('Submitting\u2026 \u23f3');
  sheetsRequest('submit_assignment', payload).then(function() {
    document.getElementById('assignmentTakeView').style.display = 'none';
    document.getElementById('assignmentResultView').style.display = 'block';
    document.getElementById('asgResultTitle').textContent = 'Submitted Successfully!';
    document.getElementById('asgResultMsg').textContent = allAutoGradeable
      ? 'Your ' + a.type.toLowerCase() + ' has been auto-graded.'
      : 'Your teacher will review and grade your answers soon.';
    if (allAutoGradeable) {
      document.getElementById('asgResultScore').style.display = 'block';
      document.getElementById('asgScoreValue').textContent = autoScore + ' / ' + maxScore;
    } else {
      document.getElementById('asgResultScore').style.display = 'none';
    }
  }).catch(function() {
    showToast('\u26a0\ufe0f Could not submit. Check your connection and try again.');
  });
}

function backToAssignmentsList() {
  document.getElementById('assignmentResultView').style.display = 'none';
  document.getElementById('assignmentsListView').style.display = 'block';
  loadStudentAssignments();
}

/* ══════════════════════════════════════════════
   STAFF ACCOUNT MANAGEMENT
══════════════════════════════════════════════ */

function toggleStaffPanel() {
  var panel = document.getElementById('staffPanel');
  var btn = document.getElementById('staffPanelBtn');
  var open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  btn.style.background = open ? '#0891B2' : '#0E7490';
  if (!open) {
    if (currentStaffAccount) {
      document.getElementById('myUsername').value = currentStaffAccount.username;
    }
    loadStaffList();
  }
}

function changeMyPassword() {
  var username = document.getElementById('myUsername').value.trim();
  var newPassword = document.getElementById('myNewPassword').value;

  if (!username) { showToast('Please enter your username \u26a0\ufe0f'); return; }
  if (!newPassword || newPassword.length < 6) { showToast('Password must be at least 6 characters \u26a0\ufe0f'); return; }

  if (!confirm('Change password for "' + username + '"? You will need to use the new password next time you log in.')) return;

  showToast('Updating password\u2026 \u23f3');
  sheetsPostReadable('change_password', { username: username, newPassword: newPassword }).then(function(result) {
    if (result && result.ok) {
      showToast('\u2705 Password updated successfully');
      document.getElementById('myNewPassword').value = '';
    } else {
      showToast('\u274c ' + (result && result.error ? result.error : 'Could not update password'));
    }
  });
}

function createNewStaff() {
  var username = document.getElementById('newStaffUsername').value.trim();
  var password = document.getElementById('newStaffPassword').value;
  var fullName = document.getElementById('newStaffFullName').value.trim();
  var role = document.getElementById('newStaffRole').value;

  if (!username)   { showToast('Please enter a username \u26a0\ufe0f'); return; }
  if (!password || password.length < 6) { showToast('Password must be at least 6 characters \u26a0\ufe0f'); return; }
  if (!fullName)   { showToast('Please enter full name \u26a0\ufe0f'); return; }

  showToast('Creating account\u2026 \u23f3');
  sheetsPostReadable('create_staff', {
    username: username, password: password, fullName: fullName, role: role
  }).then(function(result) {
    if (result && result.ok) {
      showToast('\u2705 Staff account created for ' + fullName);
      document.getElementById('newStaffUsername').value = '';
      document.getElementById('newStaffPassword').value = '';
      document.getElementById('newStaffFullName').value = '';
      loadStaffList();
    } else {
      showToast('\u274c ' + (result && result.error ? result.error : 'Could not create account'));
    }
  });
}

function loadStaffList() {
  var container = document.getElementById('staffListContainer');
  container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--gray);font-size:13px">Loading\u2026</p>';

  sheetsGet('get_staff_list', {}).then(function(data) {
    var staff = (data && data.ok) ? data.staff : [];
    if (staff.length === 0) {
      container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--gray);font-size:13px">No staff accounts found. Run the setup function in Apps Script first, or create one above.</p>';
      return;
    }
    container.innerHTML = staff.map(function(s) {
      var roleColor = s.role === 'admin' ? '#B91C1C' : '#047857';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid var(--light-gray);border-radius:6px;margin-bottom:8px;' + (s.active ? '' : 'opacity:.5') + '">' +
        '<div><strong style="font-size:13px">' + s.fullName + '</strong> <span style="color:var(--gray);font-size:12px">(@' + s.username + ')</span>' +
        '<span style="background:' + roleColor + ';color:white;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;margin-left:8px">' + s.role.toUpperCase() + '</span>' +
        (!s.active ? '<span style="color:#B91C1C;font-size:11px;margin-left:8px">(Deactivated)</span>' : '') +
        '</div>' +
        (s.active ? '<button onclick="deactivateStaffAccount(\'' + s.id + '\',\'' + s.fullName.replace(/'/g,"\'") + '\')" style="background:rgba(183,28,28,.1);color:#B91C1C;border:1px solid rgba(183,28,28,.2);padding:5px 12px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer">Deactivate</button>' : '') +
      '</div>';
    }).join('');
  });
}

function deactivateStaffAccount(id, name) {
  if (!confirm('Deactivate "' + name + '"? They will no longer be able to log in.')) return;
  sheetsRequest('deactivate_staff', { id: id });
  showToast('\u2705 ' + name + ' deactivated');
  setTimeout(loadStaffList, 500);
}
