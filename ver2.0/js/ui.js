/* ============================================================
   AVANGUARD 2.0 — UI CORE + VISTA SCHEDA + SHEET
   ============================================================ */

'use strict';

// ---------- Utility UI ----------
let toastTimer = null;
function toast(html) {
  const t = document.getElementById('toast');
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function buzz(ms) { if (S.settings.haptics && navigator.vibrate) navigator.vibrate(ms); }

function openSheet(id) {
  document.getElementById(id).classList.add('open');
  document.getElementById(id + '-backdrop').classList.add('open');
}
function closeSheet(id) {
  document.getElementById(id).classList.remove('open');
  document.getElementById(id + '-backdrop').classList.remove('open');
}
function openModal(html) {
  const root = document.getElementById('modal-root');
  document.getElementById('modal-card').innerHTML = html;
  root.classList.add('open');
}
function closeModal() { document.getElementById('modal-root').classList.remove('open'); }

// icone SVG riusabili
const ICO = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13c0 .8.9 1.3 1.6.9l10-6.5c.6-.4.6-1.4 0-1.8l-10-6.5C8.9 4.2 8 4.7 8 5.5z"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17l-1 3z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7"/><path d="M10 11v6M14 11v6"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s1 2.5-1 5c-1.5 2-3 3-3 6a4 4 0 0 0 8 0c0-1.5-.8-2.6-1.5-3.5-.4 1-1 1.5-1.8 1.7.5-2.8-.7-6.5-3.7-6.5 2 0 3.5-1.3 3-2.7z" fill="currentColor" stroke="none"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 3 8-9"/><path d="M15 5h6v6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9m0 0l-4 4m4-4l4 4"/><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4 4 0 0 1-.7-7.9A5.5 5.5 0 0 1 17 8.3 4.2 4.2 0 0 1 17 18H7z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 17H2L12 3z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  barbell: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="10" width="2.2" height="4" rx="1"/><rect x="5" y="8.5" width="2.6" height="7" rx="1"/><rect x="8.5" y="5" width="3.6" height="14" rx="1.6"/><rect x="13" y="8.5" width="2.6" height="7" rx="1"/><rect x="17" y="5" width="3.6" height="14" rx="1.6"/><rect x="21.5" y="10" width="2.2" height="4" rx="1" transform="translate(-1.5 0)"/></svg>',
};

// ---------- Init ----------
function initApp() {
  load();
  renderTopbar();
  if (!S.users.length || !me()) {
    renderOnboarding();
  } else {
    renderScheda();
  }
  // ripristina tab
  if (S.ui.tab && S.ui.tab !== 'scheda' && me()) switchTab(S.ui.tab, true);
  // net dot
  const updateNet = () => {
    const dot = document.getElementById('net-dot');
    dot.classList.toggle('on', navigator.onLine);
    dot.classList.toggle('off', !navigator.onLine);
    dot.title = navigator.onLine ? 'Online' : 'Offline (l\'app funziona uguale)';
  };
  updateNet();
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);
}

function renderTopbar() {
  const u = me();
  document.getElementById('profile-avatar').textContent = u ? u.name.trim().charAt(0).toUpperCase() : '?';
  document.getElementById('profile-name').textContent = u ? u.name : 'Profilo';
}

// ---------- Tabs ----------
function switchTab(tab, silent) {
  if (!me() && tab !== 'scheda') { toast('Crea prima un profilo'); return; }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + tab).classList.add('active');
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === tab));
  S.ui.tab = tab;
  save();
  if (silent !== true) window.scrollTo({ top: 0 });
  if (tab === 'scheda') renderScheda();
  if (tab === 'storico') renderStorico();
  if (tab === 'peso') renderPeso();
  if (tab === 'altro') renderAltro();
}

// ---------- Settimana ----------
function changeWeek(delta) {
  const nw = S.week + delta;
  if (nw < 1 || nw > 6) { buzz(5); return; }
  S.week = nw;
  save();
  renderScheda();
}

// ---------- SCHEDA ----------
function activeDayId() {
  const u = me();
  if (!u || !u.days.length) return null;
  const open = u.days.find(d => d.id === S.ui.openDay);
  return open ? open.id : u.days[0].id;
}

function renderScheda() {
  const u = me();
  if (!u) { renderOnboarding(); return; }
  renderTopbar();

  // week row
  document.getElementById('week-num').textContent = S.week;
  const track = document.getElementById('week-track');
  track.innerHTML = Array.from({ length: 6 }, (_, i) =>
    `<span class="seg ${i + 1 < S.week ? 'past' : ''} ${i + 1 === S.week ? 'now' : ''}"></span>`).join('');

  // day chips
  const chips = document.getElementById('day-chips');
  const ady = activeDayId();
  chips.innerHTML = u.days.map(d =>
    `<button class="day-chip ${d.id === ady ? 'active' : ''}" onclick="selectDay('${d.id}')">
      <span>${esc(d.name)}</span><span class="cnt">${d.exercises.length}</span>
    </button>`).join('') +
    `<button class="day-chip add" onclick="openAddDay()">${ICO.plus} Giorno</button>`;

  // day content
  const container = document.getElementById('day-content');
  const day = u.days.find(d => d.id === ady);
  if (!day) {
    container.innerHTML = `<div class="onboarding" style="padding-top:24px">
      <h1 style="font-size:22px">Nessun giorno</h1>
      <p>Aggiungi il primo giorno della tua scheda.</p>
      <div class="ob-actions"><button class="btn btn-primary" onclick="openAddDay()">Aggiungi giorno</button></div>
    </div>`;
    return;
  }

  const doneCount = day.exercises.filter(ex => myLog(day.id, ex.id).done).length;
  const totalVol = day.exercises.reduce((a, ex) => {
    const blocks = parseTargetBlocks(ex.progression[S.week - 1] || '3x10');
    const w = firstWeight(day.id, ex.id, S.week);
    if (w == null) return a;
    let vol = 0;
    blocks.forEach(b => { const nx = parseNxR(b); if (nx) vol += nx.sets * nx.reps * w; });
    return a + vol;
  }, 0);

  let html = `
    <div class="day-card">
      <div class="day-head">
        <div style="flex:1;min-width:0">
          <h2>${esc(day.name)}</h2>
          <div class="day-meta num">${doneCount}/${day.exercises.length} completati${totalVol > 0 ? ' · ' + fmtVol(totalVol) + ' di volume' : ''}</div>
        </div>
        <button class="day-menubtn" onclick="openDayMenu('${day.id}')" aria-label="Menu giorno">${ICO.dots}</button>
      </div>
      <button class="start-cta" onclick="startSession('${day.id}')">
        <span class="cta-main">${ICO.play} Inizia allenamento</span>
        <span class="cta-sub num">${day.exercises.length} esercizi</span>
      </button>
      ${day.exercises.map((ex, i) => exerciseRow(day, ex, i)).join('')}
      <div class="day-actions">
        <button onclick="openAddExercise('${day.id}')">${ICO.plus} Esercizio</button>
        <button onclick="openBulkAdd('${day.id}')">${ICO.copy} Incolla lista</button>
      </div>
    </div>`;
  container.innerHTML = html;
}

function fmtVol(v) {
  if (v >= 1000) return (v / 1000).toFixed(1).replace('.0', '') + ' t';
  return Math.round(v) + ' kg';
}

function exerciseRow(day, ex, i) {
  const log = myLog(day.id, ex.id);
  const blocks = parseTargetBlocks(ex.progression[S.week - 1] || '3x10');
  const wts = exWeights(day.id, ex.id, S.week);
  const target = blocks.join(' + ');
  const delta = weekDelta(day.id, ex.id);
  const curMax = wts.filter(v => v != null).length ? Math.max(...wts.filter(v => v != null)) : null;

  // record PRIMORDIALE: massimo nelle settimane precedenti alla corrente
  let prevRec = null;
  for (let w = 1; w < S.week; w++) {
    exWeights(day.id, ex.id, w).forEach(v => { if (v != null && (prevRec == null || v > prevRec)) prevRec = v; });
  }
  const isPR = curMax != null && prevRec != null && curMax > prevRec;

  const deltaHtml = delta === null || delta === 'new'
    ? (wts.some(v => v != null) ? `<span class="delta new">nuovo</span>` : '')
    : (delta === 0 ? '' : `<span class="delta ${delta > 0 ? 'up' : 'down'} num">${delta > 0 ? '+' : ''}${delta} kg</span>`);

  const loads = wts.filter(v => v != null);
  let loadHtml;
  if (loads.length === 0) loadHtml = `<div class="load empty num">—</div>`;
  else if (loads.length === 1) loadHtml = `<div class="load num">${fmtKg(loads[0])}<span class="u">kg</span></div>`;
  else loadHtml = `<div class="load multi num">${loads.map(fmtKg).join('<span class="u">/</span>')}</div>`;

  return `
    <div class="ex-row ${log.done ? 'done' : ''} ${isPR ? 'pr-flash' : ''}" style="animation-delay:${Math.min(i * 40, 320)}ms" onclick="openExerciseSheet('${day.id}','${ex.id}')">
      <button class="ex-check ${log.done ? 'on' : ''}" onclick="event.stopPropagation();toggleDone('${day.id}','${ex.id}')" aria-label="Completato">${ICO.check}</button>
      <div class="ex-main">
        <div class="ex-name">${esc(ex.name)} ${isPR ? '<span class="pr-chip">PR</span>' : ''}</div>
        <div class="ex-sub">
          <span class="ex-target num">${esc(target)}</span>
          ${deltaHtml}
          ${log.up ? `<span style="color:var(--plate25);font-size:11.5px;font-weight:700">▲ aumenta</span>` : ''}
        </div>
        ${platesMini(loads.length ? Math.max(...loads) : null)}
      </div>
      <div class="ex-load">${loadHtml}</div>
    </div>`;
}

function fmtKg(v) { return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace('.', ',')); }

function toggleDone(dayId, exId) {
  const log = myLog(dayId, exId);
  setMyLog(dayId, exId, S.week, { done: !log.done });
  save();
  buzz(15);
  renderScheda();
}

function selectDay(dayId) { S.ui.openDay = dayId; save(); renderScheda(); }

// ---------- Menu giorno ----------
function openDayMenu(dayId) {
  const day = me().days.find(d => d.id === dayId);
  openModal(`
    <h3>${esc(day.name)}</h3>
    <button class="menu-item" onclick="closeModal();openAddExercise('${dayId}')">
      <span class="mi-ic">${ICO.plus}</span><span class="mi-tx"><span class="mi-t">Aggiungi esercizio</span><span class="mi-s">Uno alla volta</span></span>
    </button>
    <button class="menu-item" onclick="closeModal();openBulkAdd('${dayId}')">
      <span class="mi-ic">${ICO.copy}</span><span class="mi-tx"><span class="mi-t">Incolla lista</span><span class="mi-s">Più esercizi in un colpo</span></span>
    </button>
    <button class="menu-item" onclick="closeModal();openRenameDay('${dayId}')">
      <span class="mi-ic">${ICO.pencil}</span><span class="mi-tx"><span class="mi-t">Rinomina giorno</span></span>
    </button>
    <button class="menu-item danger" onclick="closeModal();deleteDay('${dayId}')">
      <span class="mi-ic">${ICO.trash}</span><span class="mi-tx"><span class="mi-t" style="color:var(--plate25)">Elimina giorno</span><span class="mi-s">Con tutti gli esercizi</span></span>
    </button>
  `);
}

function openAddDay() {
  openModal(`
    <h3>Nuovo giorno</h3>
    <label class="field-label">Nome</label>
    <input class="field" id="new-day-name" placeholder="es. Petto e tricipiti" onkeydown="if(event.key==='Enter')saveDay()">
    <button class="btn btn-primary" onclick="saveDay()">Aggiungi</button>
  `);
  setTimeout(() => document.getElementById('new-day-name').focus(), 60);
}
function saveDay() {
  const name = document.getElementById('new-day-name').value.trim();
  if (!name) return;
  let u = me();
  if (!u) { const id = uid('u'); S.users.push({ id, name: 'Io', days: [] }); S.currentUserId = id; u = me(); }
  u.days.push({ id: uid('d'), name, exercises: [] });
  S.ui.openDay = u.days[u.days.length - 1].id;
  save(); closeModal(); renderScheda();
}
function openRenameDay(dayId) {
  const day = me().days.find(d => d.id === dayId);
  openModal(`
    <h3>Rinomina giorno</h3>
    <input class="field" id="rename-day-name" value="${esc(day.name)}" onkeydown="if(event.key==='Enter')renameDay('${dayId}')">
    <button class="btn btn-primary" onclick="renameDay('${dayId}')">Salva</button>
  `);
  setTimeout(() => { const i = document.getElementById('rename-day-name'); i.focus(); i.select(); }, 60);
}
function renameDay(dayId) {
  const name = document.getElementById('rename-day-name').value.trim();
  if (!name) return;
  me().days.find(d => d.id === dayId).name = name;
  save(); closeModal(); renderScheda();
}
function deleteDay(dayId) {
  const u = me();
  const day = u.days.find(d => d.id === dayId);
  if (!confirm(`Eliminare "${day.name}" e tutti i suoi esercizi?`)) return;
  u.days = u.days.filter(d => d.id !== dayId);
  if (S.ui.openDay === dayId) S.ui.openDay = u.days[0]?.id || null;
  save(); renderScheda();
  toast('Giorno eliminato');
}

// ---------- Esercizi: add / bulk / delete ----------
let _targetDayId = null;
function openAddExercise(dayId) {
  _targetDayId = dayId;
  openModal(`
    <h3>Nuovo esercizio</h3>
    <label class="field-label">Nome</label>
    <input class="field" id="new-ex-name" placeholder="es. Panca piana">
    <label class="field-label">Target</label>
    <input class="field" id="new-ex-target" placeholder="es. 4x8  oppure  3x10 + 1x15" onkeydown="if(event.key==='Enter')saveNewExercise()">
    <button class="btn btn-primary" onclick="saveNewExercise()">Aggiungi</button>
  `);
  setTimeout(() => document.getElementById('new-ex-name').focus(), 60);
}
function saveNewExercise() {
  const name = document.getElementById('new-ex-name').value.trim();
  if (!name) return;
  const target = document.getElementById('new-ex-target').value.trim() || '3x10';
  me().days.find(d => d.id === _targetDayId).exercises.push({
    id: uid('e'), name, progression: Array(6).fill(target)
  });
  save(); closeModal(); renderScheda();
}
function openBulkAdd(dayId) {
  _targetDayId = dayId;
  openModal(`
    <h3>Incolla lista</h3>
    <p style="color:var(--dim);font-size:12.5px;margin-bottom:4px">Una riga per esercizio, il trattino separa nome e target. Il + separa serie: <b>3x10 + 3x15</b> sono due blocchi, <b>3x10+10</b> reps alternate.</p>
    <textarea class="field" id="bulk-text" rows="8" placeholder="Panca piana - 4x8&#10;Croci ai cavi - 3x12&#10;Curl alternato - 3x10+10"></textarea>
    <button class="btn btn-primary" onclick="saveBulk()">Carica lista</button>
  `);
  setTimeout(() => document.getElementById('bulk-text').focus(), 60);
}
function saveBulk() {
  const lines = document.getElementById('bulk-text').value.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return;
  const day = me().days.find(d => d.id === _targetDayId);
  lines.forEach((line, idx) => {
    let name = line, target = '3x10';
    const dashIdx = line.indexOf('-');
    if (dashIdx > 0) {
      name = line.slice(0, dashIdx).trim();
      target = line.slice(dashIdx + 1).trim() || '3x10';
    }
    day.exercises.push({ id: uid('e') + '_' + idx, name, progression: Array(6).fill(target) });
  });
  save(); closeModal(); renderScheda();
  toast(`${lines.length} esercizi aggiunti`);
}
function deleteExercise(dayId, exId) {
  const day = me().days.find(d => d.id === dayId);
  if (!confirm(`Togliere "${day.exercises.find(e => e.id === exId)?.name}"?`)) return;
  day.exercises = day.exercises.filter(e => e.id !== exId);
  save(); closeSheet('sheet-ex'); renderScheda();
}

// ---------- Sheet esercizio ----------
let _sheetEx = null; // {dayId, exId}
function openExerciseSheet(dayId, exId) {
  _sheetEx = { dayId, exId };
  renderExerciseSheet();
  openSheet('sheet-ex');
}

function renderExerciseSheet() {
  const { dayId, exId } = _sheetEx;
  const u = me();
  const day = u.days.find(d => d.id === dayId);
  const ex = day.exercises.find(e => e.id === exId);
  const blocks = parseTargetBlocks(ex.progression[S.week - 1] || '3x10');
  const wts = exWeights(dayId, exId, S.week);
  const rec = recordFor(dayId, exId);

  // storia S1..S6
  const hist = Array.from({ length: 6 }, (_, i) => firstWeight(dayId, exId, i + 1));
  const bestWeek = hist.indexOf(Math.max(...hist.filter(h => h != null)) ?? null) + 1;

  const blocksHtml = blocks.map((b, i) => {
    const w = wts[i] ?? null;
    const nx = parseNxR(b);
    const histNote = S.week > 1 && firstWeight(dayId, exId, S.week - 1) != null
      ? `S${S.week - 1}: ${fmtKg(firstWeight(dayId, exId, S.week - 1))} kg` : '';
    return `
    <div class="block-row">
      <div class="bhead">
        <span class="btarget num">${esc(b)}</span>
        <span class="bhist num">${histNote}</span>
      </div>
      <div class="block-stepper">
        <button onclick="stepWeight(${i},-2.5)" aria-label="Meno 2,5 kg">−2,5</button>
        <div class="bval num">${w != null ? fmtKg(w) : '—'}<small> kg</small></div>
        <button onclick="stepWeight(${i},2.5)" aria-label="Più 2,5 kg">+2,5</button>
        <button onclick="stepWeight(${i},-0.5)" style="width:36px;font-size:13px" aria-label="Meno 0,5">−<i style="font-style:normal;font-size:10px">.5</i></button>
        <button onclick="stepWeight(${i},0.5)" style="width:36px;font-size:13px" aria-label="Più 0,5">+<i style="font-style:normal;font-size:10px">.5</i></button>
      </div>
    </div>`;
  }).join('');

  // 1RM dal primo blocco
  const nx = parseNxR(blocks[0]);
  const onerm = (wts[0] != null && nx) ? epley1RM(wts[0], nx.reps) : null;

  const log = myLog(dayId, exId);
  document.getElementById('sheet-ex').innerHTML = `
    <div class="sheet-grab"></div>
    <div class="exsheet-head">
      <div class="tit">
        <h3>${esc(ex.name)}</h3>
        <span class="tg num">${blocks.join(' + ')} · ${day.name}</span>
      </div>
      <button class="iconbtn" onclick="editExercise()" aria-label="Modifica">${ICO.pencil}</button>
      <button class="iconbtn" onclick="deleteExercise('${dayId}','${exId}')" aria-label="Elimina" style="color:var(--plate25)">${ICO.trash}</button>
    </div>

    <div class="blocks">${blocksHtml}</div>

    ${wts[0] != null ? `<div class="barbell-viz">${barbellSVG(wts[0])}</div>` : ''}

    ${onerm ? `<div class="onerm"><span class="k">1RM stimato (Epley)</span><span class="v num">${fmtKg(onerm)} kg</span></div>` : ''}

    <button class="upflag ${log.up ? 'on' : ''}" onclick="toggleUpFlag()">
      ${ICO.fire} Segna: aumenta il carico la prossima settimana
    </button>

    <div class="exsheet-hist">
      <div class="h2">Storia carichi</div>
      <div class="ex-prog-item">
        <div class="weekline" style="display:flex;gap:4px">
          ${hist.map((h, i) => `
            <div class="wv ex-prog-item ${h != null && i + 1 === bestWeek ? 'best' : ''}" style="flex:1;text-align:center;background:var(--bg0);border-radius:6px;padding:5px 2px 3px;color:${h != null ? 'var(--ink)' : 'var(--faint)'};font-size:11.5px;font-weight:600">
              <span style="display:block;color:var(--faint);font-size:9px;font-weight:700">S${i + 1}</span>${h != null ? fmtKg(h) : '—'}
            </div>`).join('')}
        </div>
        ${rec != null ? `<div style="margin-top:9px;font-size:12px;color:var(--dim)">Record: <b class="num" style="color:var(--ink)">${fmtKg(rec)} kg</b></div>` : ''}
      </div>
    </div>
  `;
}

function stepWeight(blockIdx, delta) {
  const { dayId, exId } = _sheetEx;
  const wts = exWeights(dayId, exId, S.week);
  const cur = wts[blockIdx] ?? 0;
  let nw = Math.max(0, +(cur + delta).toFixed(2));
  if (nw === 0) nw = 0;
  const all = [...wts];
  all[blockIdx] = nw || null;
  setMyLog(dayId, exId, S.week, { weights: all.map(v => v == null ? '' : v) });
  save(); buzz(8);
  renderExerciseSheet();
  renderScheda();
}

function toggleUpFlag() {
  const { dayId, exId } = _sheetEx;
  const log = myLog(dayId, exId);
  setMyLog(dayId, exId, S.week, { up: !log.up });
  save(); buzz(12);
  renderExerciseSheet();
  renderScheda();
}

function editExercise() {
  const { dayId, exId } = _sheetEx;
  const ex = me().days.find(d => d.id === dayId).exercises.find(e => e.id === exId);
  const target = ex.progression[S.week - 1] || ex.progression[0] || '3x10';
  openModal(`
    <h3>Modifica esercizio</h3>
    <label class="field-label">Nome</label>
    <input class="field" id="edit-ex-name" value="${esc(ex.name)}">
    <label class="field-label">Target (settimana ${S.week})</label>
    <input class="field" id="edit-ex-target" value="${esc(target)}">
    <label style="display:flex;gap:9px;align-items:center;margin-top:14px;font-size:13px;color:var(--dim);cursor:pointer">
      <input type="checkbox" id="edit-ex-all" style="width:17px;height:17px;accent-color:var(--plate25)">
      Applica a tutte le 6 settimane
    </label>
    <button class="btn btn-primary" onclick="saveEditExercise()">Salva</button>
  `);
}
function saveEditExercise() {
  const { dayId, exId } = _sheetEx;
  const ex = me().days.find(d => d.id === dayId).exercises.find(e => e.id === exId);
  const name = document.getElementById('edit-ex-name').value.trim();
  const target = document.getElementById('edit-ex-target').value.trim() || '3x10';
  const all = document.getElementById('edit-ex-all').checked;
  if (!name) return;
  ex.name = name;
  while (ex.progression.length < 6) ex.progression.push(ex.progression[ex.progression.length - 1] || '3x10');
  if (all) ex.progression = Array(6).fill(target);
  else ex.progression[S.week - 1] = target;
  save(); closeModal(); renderExerciseSheet(); renderScheda();
}

// ---------- Sheet profili ----------
function openProfileSheet() {
  renderProfileSheet();
  openSheet('sheet-profile');
}
function renderProfileSheet() {
  const u = me();
  document.getElementById('sheet-profile').innerHTML = `
    <div class="sheet-grab"></div>
    <h3>Profili</h3>
    <div style="margin-top:6px">
      ${S.users.map(p => `
        <button class="profile-list-item" onclick="switchProfile('${p.id}')">
          <span class="profile-avatar" style="background:${p.id === S.currentUserId ? 'var(--plate25)' : 'var(--bg3)'}">${esc(p.name.trim().charAt(0).toUpperCase())}</span>
          <span class="pn">${esc(p.name)}</span>
          ${p.id === S.currentUserId ? '<span class="cur-tag">attivo</span>' : ''}
        </button>`).join('')}
      ${u ? `
      <button class="profile-list-item" onclick="renameProfile()">
        <span class="profile-avatar" style="background:var(--bg3)">${ICO.pencil}</span>
        <span class="pn" style="color:var(--dim)">Rinomina «${esc(u.name)}»</span>
      </button>
      ${S.users.length > 1 ? `
      <button class="profile-list-item" onclick="deleteProfile()">
        <span class="profile-avatar" style="background:var(--bg3);color:var(--plate25)">${ICO.trash}</span>
        <span class="pn" style="color:var(--plate25)">Elimina «${esc(u.name)}»</span>
      </button>` : ''}` : ''}
    </div>
    <button class="btn btn-ghost" onclick="addProfile()">${ICO.plus} Nuovo profilo</button>
  `;
}
function switchProfile(id) {
  S.currentUserId = id;
  S.ui.openDay = null;
  save(); closeSheet('sheet-profile');
  renderTopbar(); switchTab(S.ui.tab || 'scheda', true);
  toast(`Profilo <b>${esc(me().name)}</b>`);
}
function addProfile() {
  openModal(`
    <h3>Nuovo profilo</h3>
    <input class="field" id="new-profile-name" placeholder="Nome" onkeydown="if(event.key==='Enter')saveProfile()">
    <button class="btn btn-primary" onclick="saveProfile()">Crea</button>
  `);
  setTimeout(() => document.getElementById('new-profile-name').focus(), 60);
}
function saveProfile() {
  const name = document.getElementById('new-profile-name').value.trim();
  if (!name) return;
  const id = uid('u');
  S.users.push({ id, name, days: [] });
  S.currentUserId = id;
  save(); closeModal(); closeSheet('sheet-profile');
  renderTopbar(); renderScheda();
}
function renameProfile() {
  const u = me();
  openModal(`
    <h3>Rinomina profilo</h3>
    <input class="field" id="rename-profile-name" value="${esc(u.name)}" onkeydown="if(event.key==='Enter')doRenameProfile()">
    <button class="btn btn-primary" onclick="doRenameProfile()">Salva</button>
  `);
  setTimeout(() => { const i = document.getElementById('rename-profile-name'); i.focus(); i.select(); }, 60);
}
function doRenameProfile() {
  const name = document.getElementById('rename-profile-name').value.trim();
  if (!name) return;
  me().name = name;
  save(); closeModal(); closeSheet('sheet-profile');
  renderTopbar(); renderScheda();
}
function deleteProfile() {
  const u = me();
  if (!confirm(`Eliminare il profilo "${u.name}" e tutti i suoi dati?`)) return;
  S.users = S.users.filter(p => p.id !== u.id);
  S.currentUserId = S.users[0]?.id || null;
  save(); closeSheet('sheet-profile');
  renderTopbar();
  if (!me()) renderOnboarding(); else switchTab('scheda', true);
}

// ---------- Onboarding ----------
function renderOnboarding() {
  document.getElementById('profile-avatar').textContent = '?';
  document.getElementById('profile-name').textContent = 'Profilo';
  document.getElementById('week-num').textContent = '1';
  document.getElementById('week-track').innerHTML = Array.from({ length: 6 }, (_, i) => `<span class="seg ${i === 0 ? 'now' : ''}"></span>`).join('');
  document.getElementById('day-chips').innerHTML = '';
  document.getElementById('day-content').innerHTML = `
    <div class="onboarding">
      <svg class="ob-mark" viewBox="0 0 64 64">
        <rect x="6" y="29" width="52" height="6" rx="3" fill="#EDEEE8"/>
        <rect x="47" y="25" width="3" height="14" rx="1" fill="#EDEEE8"/>
        <rect x="14" y="25" width="3" height="14" rx="1" fill="#EDEEE8"/>
        <rect x="40" y="12" width="7" height="40" rx="2.5" fill="#3D7BD9"/>
        <rect x="50" y="6" width="8" height="52" rx="2.5" fill="#E63B2E"/>
        <rect x="17" y="12" width="7" height="40" rx="2.5" fill="#3D7BD9"/>
        <rect x="6" y="6" width="8" height="52" rx="2.5" fill="#E63B2E"/>
      </svg>
      <h1>La palestra<br>è <em>offline</em> adesso.</h1>
      <p>Crea il tuo profilo e incolla la tua scheda: funziona senza rete, i dati restano sul tuo telefono.</p>
      <div class="ob-actions">
        <button class="btn btn-primary" onclick="addProfile()">Crea il tuo profilo</button>
        <button class="btn btn-ghost" onclick="importBackup()">${ICO.upload} Ho un backup da importare</button>
      </div>
    </div>
  `;
}

// avvio
document.addEventListener('DOMContentLoaded', initApp);
