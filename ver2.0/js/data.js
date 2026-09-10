/* ============================================================
   AVANGUARD 2.0 — DATA LAYER
   Stato, persistenza localStorage, migrazione v1,
   matematica piastre IWF, parser target, sync cloud opzionale.
   ============================================================ */

'use strict';

// ---- Costanti ----
const STORE_KEY = 'avanguard_v2';
const V1_KEY = 'gym_tracker_pro_v6';
const SUPABASE_URL = 'https://rvodpmmzwvvdcvsiqxhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b2RwbW16d3Z2ZGN2c2lxeGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjA2NTksImV4cCI6MjA5OTU5NjY1OX0.hcQaVKdaKPfLsTaH896t1NjE3aXfdkxOBezoqWZ5iWA';

// Piastre olimpioniche (codice colori IWF) — per lato
const PLATES = [
  { kg: 25,   cls: 'plate25', w: 1.0 },
  { kg: 20,   cls: 'plate20', w: 0.86 },
  { kg: 15,   cls: 'plate15', w: 0.74 },
  { kg: 10,   cls: 'plate10', w: 0.62 },
  { kg: 5,    cls: 'plate5',  w: 0.5 },
  { kg: 2.5,  cls: 'pl-dark', w: 0.42 },
  { kg: 1.25, cls: 'pl-dark', w: 0.34 },
];
const PLATE_COLORS = { plate25: '#E63B2E', plate20: '#3D7BD9', plate15: '#E8A812', plate10: '#2FA657', plate5: '#D8D9D3', 'pl-dark': '#3A3E46' };

// ---- Stato ----
let S = null; // stato applicativo

function defaultState() {
  return {
    v: 2,
    users: [],
    currentUserId: null,
    week: 1,
    logs: {},            // { logKey: {done, weights[], up, carried} } — compatibile v1
    weights: {},         // { userId: [{d:'YYYY-MM-DD', kg: 74.5}] } — pesi datati
    sessions: {},        // { userId: [{id, dayId, dayName, date, dur, sets:[{ex,name,w,reps}], prs:[{name,w}]}] }
    settings: { bar: 20, rest: 90, sound: true, haptics: true, plates: true },
    syncKey: '',
    carried: {},
    ui: { tab: 'scheda', openDay: null },
  };
}

// ---- Persistenza ----
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(S));
}

function load() {
  S = defaultState();
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      S = { ...S, ...parsed, settings: { ...S.settings, ...(parsed.settings || {}) }, ui: { ...S.ui, ...(parsed.ui || {}) } };
    } catch (e) { console.warn('Stato corrotto, reset', e); }
  } else {
    // Prima apertura di v2: prova migrazione automatica dalla v1 (stesso dominio GitHub Pages)
    const v1raw = localStorage.getItem(V1_KEY);
    if (v1raw && migrateV1(v1raw)) {
      save();
      setTimeout(() => toast('Dati della <b class="t-green">v1</b> importati automaticamente'), 600);
    }
  }
}

// ---- Migrazione dalla v1 ----
function migrateV1(raw) {
  try {
    const v1 = JSON.parse(raw);
    if (!v1 || !Array.isArray(v1.users) || v1.users.length === 0) return false;

    S.users = v1.users.map(u => ({
      id: u.id,
      name: u.name,
      days: (u.days || []).map(d => ({
        id: d.id,
        name: d.name,
        exercises: (d.exercises || []).map(e => ({
          id: e.id,
          name: e.name,
          progression: e.progression && e.progression.length ? e.progression : ['3x10'],
        })),
      })),
    }));
    S.currentUserId = v1.currentUserId || S.users[0].id;
    S.week = v1.week || 1;
    S.logs = v1.logs || {};
    S.carried = v1.carried || {};
    S.syncKey = v1.syncKey || '';

    // Pesi corporei: v1 li salvava per settimana (w1..w6) del ciclo corrente.
    // Li convertiamo in entry datate: w6 = oggi, a ritroso di 7 giorni.
    const today = new Date();
    (S.users).forEach(u => {
      const bw = (v1.bodyWeight || {})[u.id];
      if (bw) {
        const entries = [];
        for (let w = 1; w <= 6; w++) {
          const val = bw['w' + w];
          if (val != null && !isNaN(parseFloat(val))) {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - w) * 7);
            entries.push({ d: d.toISOString().slice(0, 10), kg: parseFloat(val) });
          }
        }
        if (entries.length) S.weights[u.id] = entries;
      }
    });
    return true;
  } catch (e) {
    console.warn('Migrazione v1 fallita', e);
    return false;
  }
}

// ---- Utility utenti/giorni/esercizi ----
function me() { return S.users.find(u => u.id === S.currentUserId) || null; }

function uid(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function logKey(week, userId, dayId, exId) { return `w${week}_${userId}_${dayId}_${exId}`; }
function myLog(dayId, exId, week) { return S.logs[logKey(week ?? S.week, S.currentUserId, dayId, exId)] || { done: false, weights: [], up: false }; }

function setMyLog(dayId, exId, week, patch) {
  const k = logKey(week ?? S.week, S.currentUserId, dayId, exId);
  S.logs[k] = { done: false, weights: [], up: false, ...(S.logs[k] || {}), ...patch };
}

/** Carichi (per blocco) di un esercizio in una settimana. Ritorna array numeri/null. */
function exWeights(dayId, exId, week) {
  const l = S.logs[logKey(week, S.currentUserId, dayId, exId)];
  if (!l) return [];
  let arr = l.weights || [];
  if (l.weight != null && arr.length === 0) arr = [l.weight]; // compat v1
  return arr.map(v => (v === '' || v == null || isNaN(parseFloat(v))) ? null : parseFloat(v));
}

/** Primo carico valido di un esercizio nella settimana. */
function firstWeight(dayId, exId, week) {
  const w = exWeights(dayId, exId, week);
  for (const v of w) if (v != null) return v;
  return null;
}

/** Massimo storico (record) per esercizio: cercato in tutte le settimane. */
function recordFor(dayId, exId) {
  let rec = null;
  for (let w = 1; w <= 6; w++) {
    exWeights(dayId, exId, w).forEach(v => { if (v != null && (rec == null || v > rec)) rec = v; });
  }
  return rec;
}

/** Delta primo-carico settimana corrente vs precedente. */
function weekDelta(dayId, exId) {
  const cur = firstWeight(dayId, exId, S.week);
  if (cur == null) return null;
  if (S.week <= 1) return 'new';
  const prev = firstWeight(dayId, exId, S.week - 1);
  if (prev == null) return 'new';
  const d = +(cur - prev).toFixed(2);
  if (Math.abs(d) < 0.001) return 0;
  return d;
}

// ---- Parser target (identico alla v1, per compatibilità) ----
// "3x10 + 3x15" → due blocchi; "3x10+10" → un blocco (reps alternate)
function parseTargetBlocks(targetText) {
  if (!targetText) return ['3x10'];
  const rawParts = targetText.split('+').map(p => p.trim()).filter(p => p !== '');
  if (rawParts.length === 0) return [targetText];
  const hasNxR = (s) => /\d\s*x\s*\d/i.test(s);
  const blocks = [];
  let current = '';
  for (const part of rawParts) {
    if (current === '') current = part;
    else if (hasNxR(current) && hasNxR(part)) { blocks.push(current); current = part; }
    else current = current + ' + ' + part;
  }
  if (current !== '') blocks.push(current);
  return blocks.length > 0 ? blocks : [targetText];
}

/** Serie totali e reps del primo blocco ("4x8" → {sets:4, reps:8}). */
function parseNxR(block) {
  const m = String(block).match(/(\d+)\s*x\s*(\d+)/i);
  if (!m) return null;
  return { sets: parseInt(m[1], 10), reps: parseInt(m[2], 10) };
}

// ---- Matematica piastre ----
/**
 * Scomposizione greedy del carico in piastre per lato.
 * Ritorna null se il carico non è componibile esattamente.
 */
function plateBreakdown(load) {
  const bar = S.settings.bar;
  if (bar <= 0) return null;
  if (load == null || isNaN(load) || load < bar) return null;
  let side = +((load - bar) / 2).toFixed(3);
  if (side <= 0) return { plates: [], total: 0 };
  const out = [];
  for (const p of PLATES) {
    while (side >= p.kg - 0.001) {
      out.push(p);
      side = +(side - p.kg).toFixed(3);
    }
  }
  if (side > 0.001) return null; // non componibile (es. macchine)
  return { plates: out, perSide: (load - bar) / 2 };
}

// ---- Epley 1RM ----
function epley1RM(load, reps) {
  if (!load || !reps) return null;
  return Math.round(load * (1 + reps / 30) * 10) / 10;
}

// ---- Peso corporeo ----
function myWeights() { return (S.weights[S.currentUserId] || []).slice().sort((a, b) => a.d.localeCompare(b.d)); }
function setMyWeight(dateStr, kg) {
  if (!S.weights[S.currentUserId]) S.weights[S.currentUserId] = [];
  const list = S.weights[S.currentUserId];
  const i = list.findIndex(e => e.d === dateStr);
  if (kg == null || isNaN(kg)) { if (i >= 0) list.splice(i, 1); }
  else if (i >= 0) list[i].kg = kg;
  else list.push({ d: dateStr, kg });
  save();
}

// ---- Sessioni ----
function mySessions() { return (S.sessions[S.currentUserId] || []).slice().sort((a, b) => b.date.localeCompare(a.date)); }
function addSession(sess) {
  if (!S.sessions[S.currentUserId]) S.sessions[S.currentUserId] = [];
  S.sessions[S.currentUserId].push(sess);
  save();
}

// ---- Sync cloud (opzionale, lazy: carica supabase solo se online) ----
let _sb = null;
async function getSupabase() {
  if (_sb) return _sb;
  if (!navigator.onLine) throw new Error('Offline');
  await loadScript('https://unpkg.com/@supabase/supabase-js@2');
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return _sb;
}
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
async function cloudPush() {
  const sb = await getSupabase();
  const { error } = await sb.from('gym_sync').upsert({ id: S.syncKey, state: S });
  if (error) throw error;
}
async function cloudPull() {
  const sb = await getSupabase();
  const { data, error } = await sb.from('gym_sync').select('state').eq('id', S.syncKey).single();
  if (error) throw error;
  if (data && data.state) {
    if (data.state.v === 2) {
      S = { ...defaultState(), ...data.state };
    } else {
      const bak = localStorage.getItem(STORE_KEY);
      localStorage.setItem(STORE_KEY, JSON.stringify(data.state)); // non usato, solo per coerenza
      localStorage.removeItem(STORE_KEY);
      if (!migrateV1(JSON.stringify(data.state))) {
        if (bak) localStorage.setItem(STORE_KEY, bak);
      }
    }
    save();
  }
}

// ---- Backup export/import ----
function exportJSON() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `avanguard-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function importJSON(text) {
  const data = JSON.parse(text);
  if (data && (data.v === 2 || Array.isArray(data.users))) {
    localStorage.setItem(STORE_KEY, text);
    S = { ...defaultState() };
    load();
    return true;
  }
  return false;
}

// ---- Date in italiano ----
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
function fmtDate(dStr) {
  const d = new Date(dStr + 'T12:00:00');
  return { day: d.getDate(), m: MESI[d.getMonth()], full: `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}` };
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---- Escape HTML ----
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
