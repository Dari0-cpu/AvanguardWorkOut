/* ====================================================================
   AVANGUARD WORKOUT - APP LOGIC v4.2 (Offline-Safe Sync + Week 0)
   100% retrocompatibile con gym_tracker_pro_v6 e Supabase gym_sync
   ==================================================================== */

const CLOUD_ENABLED = true;
const STORAGE_KEY = 'gym_tracker_pro_v6';
const DIRTY_KEY = 'avanguard_dirty';
const CLOUD_DEBOUNCE_MS = 1200;
const WEIGHT_INPUT_DEBOUNCE_MS = 500;

// ============================================================
//  TEMI (tutti i vecchi ID mantenuti + nuovi)
// ============================================================
const THEMES = {
    red:    { label: 'Crimson',     400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', rgb: '244, 63, 94',  contrast: '#ffffff' },
    ruby:   { label: 'Scarlet',     400: '#f87171', 500: '#dc2626', 600: '#b91c1c', 700: '#991b1b', rgb: '220, 38, 38',  contrast: '#ffffff' },
    orange: { label: 'Volcanic',    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', rgb: '249, 115, 22', contrast: '#ffffff' },
    copper: { label: 'Copper',      400: '#e09866', 500: '#c6733b', 600: '#a85b28', 700: '#87451b', rgb: '198, 115, 59', contrast: '#ffffff' },
    yellow: { label: 'Solar Gold',  400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', rgb: '245, 158, 11', contrast: '#111318' },
    lime:   { label: 'Volt',        400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f', rgb: '132, 204, 22', contrast: '#0b1604' },
    green:  { label: 'Emerald',     400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', rgb: '16, 185, 129', contrast: '#06281e' },
    teal:   { label: 'Abyss',       400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', rgb: '20, 184, 166', contrast: '#042625' },
    cyan:   { label: 'Glacier',     400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', rgb: '6, 182, 212',  contrast: '#06242b' },
    blue:   { label: 'Cobalt',      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', rgb: '59, 130, 246', contrast: '#ffffff' },
    indigo: { label: 'Midnight',    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', rgb: '99, 102, 241', contrast: '#ffffff' },
    purple: { label: 'Ultraviolet', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', rgb: '168, 85, 247', contrast: '#ffffff' },
    pink:   { label: 'Plasma',      400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', rgb: '236, 72, 153', contrast: '#ffffff' },
    zinc:   { label: 'Titanium',    adaptive: true },
    cyber:     { label: 'Cyber',     400: '#fde047', 500: '#facc15', 600: '#eab308', 700: '#ca8a04', rgb: '250, 204, 21',  contrast: '#111318' },
    champagne: { label: 'Champagne', 400: '#e6cfa8', 500: '#d4b483', 600: '#b8945e', 700: '#967442', rgb: '212, 180, 131', contrast: '#111318' },
    mint:   { label: 'Hyper Mint',  400: '#5eead4', 500: '#00f5a0', 600: '#00d98b', 700: '#0284c7', rgb: '0, 245, 160',   contrast: '#032016', dot: 'linear-gradient(135deg, #00f5a0 0%, #0284c7 100%)' },
    holo:   { label: 'Holo Prism',  400: '#38bdf8', 500: '#a78bfa', 600: '#8b5cf6', 700: '#f43f5e', rgb: '167, 139, 250', contrast: '#0f0a1e', dot: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 50%, #f43f5e 100%)' },
};

const BACKGROUNDS = [
    { id: 1,  name: 'Sfondo 1',  desc: 'Luci soffuse' },
    { id: 2,  name: 'Sfondo 2',  desc: 'Grigi & Nero' },
    { id: 3,  name: 'Sfondo 3',  desc: 'Fascio obliquo' },
    { id: 4,  name: 'Sfondo 4',  desc: 'Aurora mesh' },
    { id: 5,  name: 'Sfondo 5',  desc: 'Ossidiana grid' },
    { id: 6,  name: 'Sfondo 6',  desc: 'Carbonio / Kevlar' },
    { id: 7,  name: 'Sfondo 7',  desc: 'Radar concentrico' },
    { id: 8,  name: 'Sfondo 8',  desc: 'Topografia' },
    { id: 9,  name: 'Sfondo 9',  desc: 'Ghisa spazzolata' },
    { id: 10, name: 'Sfondo 10', desc: 'Onda sismica' },
    { id: 11, name: 'Sfondo 11', desc: 'AMOLED Pure Black' },
    { id: 11, name: 'Sfondo 11', desc: 'AMOLED Pure Black' },
    { id: 12, name: 'Sfondo 12', desc: 'Strawhat' },
    { id: 12, name: 'Sfondo 12', desc: 'Strawhat' },
    { id: 13, name: 'Sfondo 13', desc: 'Astrolabio' },
    { id: 14, name: 'Sfondo 14', desc: 'Fiore della Vita' },
    { id: 15, name: 'Sfondo 15', desc: 'Mappa Stellare' },
    { id: 16, name: 'Sfondo 16', desc: 'Velo Astrale' },
    { id: 17, name: 'Sfondo 17', desc: 'Apple Silk' },
    { id: 18, name: 'Sfondo 18', desc: 'Eclissi di Sangue' },
];


// ============================================================
//  ICONE SVG INLINE (100% offline)
// ============================================================
const UI_SVG = {
    check:   `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    trendUp: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    dots:    `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>`,
    edit:    `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
    trash:   `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    plus:    `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    bolt:    `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    flame:   `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.6 3.2-1.8 5.2-1.8 7.5 0 1.4 1.1 2.5 2.5 2.5 1.7 0 2.8-1.5 2.8-3.3 0-.8-.2-1.6-.6-2.3 2.5 1.6 4.1 4.4 4.1 7.4A7 7 0 0 1 5 13.8C5 9.2 8.2 5.3 12 2z"/></svg>`,
    clock:   `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`,
    play:    `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
    pause:   `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    arrowUp: `<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/></svg>`,
    cloud:   `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    cloudUp: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>`,
    cloudOff:`<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M5.78 5.78A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.31-.19"/><path d="M21.16 15.5A4.5 4.5 0 0 0 17.5 10h-1.79A7 7 0 0 0 9.4 5.14"/></svg>`,
    compass: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    note:    `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>`,
    noteSm:  `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>`,
};

// ============================================================
//  ICONE GRUPPI MUSCOLARI PER I GIORNI
// ============================================================
const DAY_ICONS = {
    chest:     { label: 'Petto',     svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8c0-2 2-3 4-3h8c2 0 4 1 4 3v3c0 3-2.5 5-5 5h-1.5a1.5 1.5 0 0 1-1.5-1.5V9"/><path d="M12 9v5.5A1.5 1.5 0 0 1 10.5 16H9c-2.5 0-5-2-5-5V8"/><path d="M7 19h10"/></svg>` },
    legs:      { label: 'Gambe',     svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12"/><path d="M8 4v6l-1.5 5.5L8 20h2.5l.5-5 1-5 1 5 .5 5H16l1.5-4.5L16 10V4"/></svg>` },
    back:      { label: 'Dorso',     svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4-2 4 2 4-2 4 2-2.5 8-3.5 6h-4l-3.5-6L4 6z"/><line x1="12" y1="6" x2="12" y2="20"/><path d="M8.5 10.5 12 12l3.5-1.5"/></svg>` },
    shoulders: { label: 'Spalle',    svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5.5" r="2.2"/><path d="M4 12a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2.5a2 2 0 0 1-2 2h-1V19H7v-2.5H6a2 2 0 0 1-2-2V12z"/><path d="M8 11v4"/><path d="M16 11v4"/></svg>` },
    arms:      { label: 'Braccia',   svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15c0-4 2-7 5-8l2 2-2 2.5c2-.5 4.5.5 5.5 2.5.8 1.6.2 4-2 4.8-2.2.8-6.5.5-8.5-1.3V15z"/><path d="M11 7l1.5-2.5 2.5 1"/></svg>` },
    push:      { label: 'Push',      svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="19" x2="20" y2="19"/><path d="M12 15V5"/><polyline points="7 10 12 5 17 10"/></svg>` },
    pull:      { label: 'Pull',      svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="5" x2="20" y2="5"/><path d="M12 9v10"/><polyline points="7 14 12 19 17 14"/></svg>` },
    core:      { label: 'Core',      svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="16" rx="4"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="6" y1="9.5" x2="18" y2="9.5"/><line x1="6" y1="14.5" x2="18" y2="14.5"/></svg>` },
    fullbody:  { label: 'Full Body', svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M5 9l7 1.5L19 9"/><path d="M12 10.5V15"/><path d="M9 21l3-6 3 6"/></svg>` },
    cardio:    { label: 'Cardio',    svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` },
    dumbbell:  { label: 'Generico',  svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4"/><path d="M21 10v4"/><rect x="5" y="7" width="3" height="10" rx="1"/><rect x="16" y="7" width="3" height="10" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/></svg>` }
};

function detectDayIcon(name) {
    const s = String(name || '').toLowerCase();
    if (/petto|chest|panca/.test(s)) return 'chest';
    if (/gamb|leg|squat|glute|lower/.test(s)) return 'legs';
    if (/dors|schien|back|trazion/.test(s)) return 'back';
    if (/spall|deltoid|shoulder/.test(s)) return 'shoulders';
    if (/bracc|bicip|tricip|arm/.test(s)) return 'arms';
    if (/push|spint/.test(s)) return 'push';
    if (/pull|tirat/.test(s)) return 'pull';
    if (/addom|core|abs/.test(s)) return 'core';
    if (/cardio|corsa|hiit/.test(s)) return 'cardio';
    if (/full|total|upper/.test(s)) return 'fullbody';
    return 'dumbbell';
}

function getDayIconSvg(day) {
    const key = (day && day.icon && DAY_ICONS[day.icon]) ? day.icon : detectDayIcon(day?.name);
    return DAY_ICONS[key].svg;
}

// ============================================================
//  STATO APPLICATIVO (100% retrocompatibile + updatedAt opzionale)
// ============================================================
const DEFAULT_PROGRAM_WEEKS = 6;
const MAX_PROGRAM_WEEKS = 9;

let appState = {
    users: [],
    currentUserId: null,
    week: 1,
    totalWeeks: DEFAULT_PROGRAM_WEEKS,
    logs: {},
    bodyWeight: {},
    bodyWeightGoal: {},
    theme: 'red',
    mode: 'dark',
    bgStyle: 1,
    syncKey: '',
    carried: {},
    updatedAt: 0,
};

// Numero di settimane del ciclo: preferenza opzionale retrocompatibile.
// I vecchi backup/cloud state senza totalWeeks restano automaticamente a 6.
function getProgramWeekCount() {
    const value = Number(appState.totalWeeks);
    if (!Number.isInteger(value)) return DEFAULT_PROGRAM_WEEKS;
    return Math.max(DEFAULT_PROGRAM_WEEKS, Math.min(MAX_PROGRAM_WEEKS, value));
}

function renderProgramWeeksSetting() {
    const count = getProgramWeekCount();
    const countEl = document.getElementById('program-weeks-count');
    const addBtn = document.getElementById('add-program-week-btn');
    const removeBtn = document.getElementById('remove-program-week-btn');
    const noteEl = document.getElementById('program-weeks-note');

    if (countEl) countEl.textContent = `${count} / ${MAX_PROGRAM_WEEKS}`;
    if (addBtn) {
        const atLimit = count >= MAX_PROGRAM_WEEKS;
        addBtn.disabled = atLimit;
        addBtn.textContent = atLimit ? 'Massimo raggiunto' : 'Aggiungi 1 settimana';
        addBtn.setAttribute('aria-label', atLimit ? 'Hai già raggiunto 9 settimane' : `Estendi il ciclo a ${count + 1} settimane`);
    }
    if (removeBtn) {
        const atMinimum = count <= DEFAULT_PROGRAM_WEEKS;
        removeBtn.disabled = atMinimum;
        removeBtn.textContent = atMinimum ? 'Minimo raggiunto' : 'Rimuovi 1 settimana';
        removeBtn.setAttribute('aria-label', atMinimum ? 'Il ciclo non può scendere sotto 6 settimane' : `Riduci il ciclo a ${count - 1} settimane`);
    }
    if (noteEl) {
        const limitMessage = count >= MAX_PROGRAM_WEEKS
            ? ' Hai raggiunto il limite massimo di 9 settimane.'
            : ` Il ciclo attuale è di ${count} settimane.`;
        noteEl.textContent = `Le settimane aggiunte riprendono inizialmente target e recuperi dell’ultima settimana; puoi personalizzarli nella progressione dell’esercizio.${limitMessage} Riducendo il ciclo, le settimane oltre il limite vengono solo nascoste: progressioni, carichi e pesi restano salvati e ricompaiono se estendi di nuovo il ciclo.`;
    }

    const rangeLabel = `S1–S${count}`;
    ['single-prog-title', 'edit-prog-title'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = `Progressione per settimana (${rangeLabel})`;
    });
    const allLabel = document.getElementById('edit-scope-all-label');
    if (allLabel) allLabel.textContent = `Tutte (${rangeLabel})`;
    const editHelp = document.getElementById('edit-prog-help');
    if (editHelp) editHelp.textContent = `Modifica ogni settimana singolarmente (target e recuperi per blocco). Con questa sezione aperta vengono salvati direttamente i valori ${rangeLabel} qui sotto.`;
    const week0FromLabel = document.getElementById('edit-scope-from-label');
    if (week0FromLabel && appState.week === 0) week0FromLabel.textContent = `S0 + ${rangeLabel}`;
    const weightTrendLabel = document.getElementById('weight-trend-week-count');
    if (weightTrendLabel) weightTrendLabel.textContent = String(count);
}

function addProgramWeek() {
    const current = getProgramWeekCount();
    if (current >= MAX_PROGRAM_WEEKS) return;

    appState.totalWeeks = current + 1;
    // Non tocchiamo logs, pesi o progressioni esistenti: la nuova settimana
    // eredita i valori finali finché non viene personalizzata.
    saveData();
    renderApp();
}

function removeProgramWeek() {
    const current = getProgramWeekCount();
    if (current <= DEFAULT_PROGRAM_WEEKS) return;

    const nextCount = current - 1;
    appState.totalWeeks = nextCount;

    // Riduciamo solo la durata visibile del ciclo: non cancelliamo log,
    // peso corporeo, progressioni o recuperi delle settimane nascoste.
    // Se l'utente stava visualizzando una settimana rimossa, lo riportiamo
    // all'ultima settimana ancora attiva senza alterare il suo storico.
    if (appState.week > nextCount) appState.week = nextCount;

    saveData();
    renderApp();
}

// Stato UI solo in memoria
const NAV_TABS_ORDER = ['workout', 'weight', 'report', 'settings'];
let activeTab = 'workout';
let activeDayId = null;
let openPopoverId = null;
let _symbioteMorphTimer = null;
let _justCompletedLogKey = null;
let _justCompletedClearTimer = null;

let tempTargetDayId = null;
let tempEditDayId = null;
let tempEditExId = null;
let tempEditScope = 'only'; // 'only' | 'from' | 'all'
let _modalProgDraft = { single: null, edit: null };
let tempSelectedNewDayIcon = 'dumbbell';
let tempSelectedEditDayIcon = 'dumbbell';
let currentExportText = '';
let _parsedImportDays = [];
let _importPlanTab = 'text'; // 'text' | 'pdf'
let _aiSelectedFiles = []; // [{ kind: 'pdf' | 'image', file?, name, mimeType, base64?, byteLength, previewUrl? }]
let _pdfParsedDays = [];
let _pdfParsingInFlight = false;
let _pdfParseReqId = 0;
let _pdfDropzoneBound = false;
const MAX_PDF_IMPORT_BYTES = 3 * 1024 * 1024; // 3 MB totali
const MAX_AI_IMAGES = 5;

// Stato Note inline (solo in memoria)
const _openNoteKeys = new Set();
let _noteInputDebounceTimer = null;
let _hasPendingNoteInput = false;

// Stato Sync (debounce + coda serializzata)
let _cloudDebounceTimer = null;
let _cloudSyncInFlight = false;
let _cloudSyncQueued = false;
let _weightInputDebounceTimer = null;
let _hasPendingWeightInput = false;

// Timer recupero (wall-clock timestamps, a prova di standby)
let _restTimerInterval = null;
let _restTimerTotalMs = 0;
let _restTimerRemainingMs = 0;
let _restTimerEndAt = null;
let _restTimerPaused = false;
let _restTimerActive = false;


function initSplashScreen() {
    const splash = document.getElementById('avanguard-splash');
    if (!splash) return;

    let dismissed = false;
    const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        splash.classList.add('is-leaving');
        setTimeout(() => splash.remove(), 380);
    };

    // Tap/click ovunque per saltare subito se hai fretta in palestra
    splash.addEventListener('click', dismiss, { once: true });

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    setTimeout(dismiss, reducedMotion ? 600 : 1850);
}

// ============================================================
//  INIT
// ============================================================
async function init() {
    initSplashScreen();
    const warningEl = document.getElementById('cloud-warning');
    if (warningEl && CLOUD_ENABLED) warningEl.classList.add('hidden');

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            mergeStateSafely(JSON.parse(savedData));
        } catch (e) {
            console.error('Errore lettura localStorage:', e);
        }
    }

    document.getElementById('cloud-sync-key').value = appState.syncKey || '';
    renderThemeSwatches();
    applyMode();
    applyTheme();
    applyBackground();
    setupDelegatedEvents();
    renderApp();

    if (CLOUD_ENABLED && appState.syncKey) {
        if (navigator.onLine) {
            const syncRes = await syncWithCloud();
            if (syncRes.action === 'pulled') {
                renderApp();
            }
        } else {
            updateCloudStatusUi('offline');
        }
    } else {
        updateCloudStatusUi('ok');
    }
}

function mergeStateSafely(incoming) {
    if (!incoming || typeof incoming !== 'object') return;
    const incomingTs = (typeof incoming.updatedAt === 'number' && Number.isFinite(incoming.updatedAt) && incoming.updatedAt >= 0)
        ? incoming.updatedAt
        : (typeof appState.updatedAt === 'number' ? appState.updatedAt : 0);

    const rawWeeks = incoming.totalWeeks;
    const incomingTotalWeeks = (typeof rawWeeks === 'number' && Number.isInteger(rawWeeks) && rawWeeks >= DEFAULT_PROGRAM_WEEKS && rawWeeks <= MAX_PROGRAM_WEEKS)
        ? rawWeeks
        : getProgramWeekCount();
    const currentWeek = (typeof incoming.week === 'number' && Number.isFinite(incoming.week) && incoming.week >= 0 && incoming.week <= incomingTotalWeeks)
        ? incoming.week
        : Math.min(appState.week, incomingTotalWeeks);


    const rawBg = Number(incoming.bgStyle);
    const incomingBgStyle = (Number.isInteger(rawBg) && rawBg >= 1 && rawBg <= BACKGROUNDS.length)
        ? rawBg
        : (Number.isInteger(appState.bgStyle) ? appState.bgStyle : 1);

    appState = {
        ...appState,
        ...incoming,
        week: currentWeek,
        totalWeeks: incomingTotalWeeks,
        users: Array.isArray(incoming.users) ? incoming.users : (appState.users || []),
        logs: (incoming.logs && typeof incoming.logs === 'object' && !Array.isArray(incoming.logs)) ? incoming.logs : (appState.logs || {}),
        bodyWeight: (incoming.bodyWeight && typeof incoming.bodyWeight === 'object' && !Array.isArray(incoming.bodyWeight)) ? incoming.bodyWeight : (appState.bodyWeight || {}),
        bodyWeightGoal: (incoming.bodyWeightGoal && typeof incoming.bodyWeightGoal === 'object' && !Array.isArray(incoming.bodyWeightGoal)) ? incoming.bodyWeightGoal : (appState.bodyWeightGoal || {}),
        carried: (incoming.carried && typeof incoming.carried === 'object' && !Array.isArray(incoming.carried)) ? incoming.carried : (appState.carried || {}),
        updatedAt: incomingTs,
        bgStyle: incomingBgStyle,
    };

    
}

// ============================================================
//  PERSISTENZA OFFLINE-SAFE + CLOUD (/api/sync) + BACKUP JSON
// ============================================================
function isLocalDirty() {
    try {
        return localStorage.getItem(DIRTY_KEY) === '1';
    } catch (_) {
        return false;
    }
}

function setLocalDirty(dirty) {
    try {
        if (dirty) localStorage.setItem(DIRTY_KEY, '1');
        else localStorage.removeItem(DIRTY_KEY);
    } catch (_) {}
}

function hasMeaningfulLocalData(state) {
    if (!state || typeof state !== 'object') return false;
    if (Array.isArray(state.users) && state.users.length > 0) return true;
    if (state.logs && Object.keys(state.logs).length > 0) return true;
    if (state.bodyWeight && Object.keys(state.bodyWeight).length > 0) return true;
    return false;
}

function persistLocalOnly() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
        console.error('Errore salvataggio localStorage:', e);
    }
}

function saveData({ immediate = false, touch = true } = {}) {
    if (touch) {
        appState.updatedAt = Date.now();
        setLocalDirty(true);
    }
    persistLocalOnly();

    if (!CLOUD_ENABLED || !appState.syncKey) {
        updateCloudStatusUi('ok');
        return Promise.resolve({ ok: true, localOnly: true });
    }

    if (!navigator.onLine) {
        updateCloudStatusUi('offline');
        return Promise.resolve({ ok: false, offline: true });
    }

    if (_cloudDebounceTimer) {
        clearTimeout(_cloudDebounceTimer);
        _cloudDebounceTimer = null;
    }

    if (immediate) {
        return flushCloudSync();
    }

    updateCloudStatusUi('pending');
    _cloudDebounceTimer = setTimeout(() => {
        _cloudDebounceTimer = null;
        flushCloudSync();
    }, CLOUD_DEBOUNCE_MS);

    return Promise.resolve({ ok: true, scheduled: true });
}

async function flushCloudSync({ keepalive = false } = {}) {
    if (!CLOUD_ENABLED || !appState.syncKey) return { ok: true, skipped: true };
    if (!navigator.onLine) {
        updateCloudStatusUi('offline');
        return { ok: false, offline: true };
    }

    if (_cloudSyncInFlight) {
        _cloudSyncQueued = true;
        return { ok: true, queued: true };
    }

    _cloudSyncInFlight = true;
    let lastOk = true;

    try {
        do {
            _cloudSyncQueued = false;
            updateCloudStatusUi('syncing');

            const sentUpdatedAt = Number(appState.updatedAt) || 0;
            const payloadStr = JSON.stringify({ state: appState });
            const fetchOpts = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-sync-key': appState.syncKey,
                },
                body: payloadStr,
            };
            if (keepalive && payloadStr.length < 60000) {
                fetchOpts.keepalive = true;
            }

            const res = await fetch('/api/sync', fetchOpts);
            if (!res.ok) {
                console.error('Errore salvataggio cloud:', res.status, await res.text().catch(() => ''));
                lastOk = false;
                updateCloudStatusUi('error');
                break;
            }

            if ((Number(appState.updatedAt) || 0) <= sentUpdatedAt && !_cloudSyncQueued) {
                setLocalDirty(false);
            }
        } while (_cloudSyncQueued && navigator.onLine);

        if (lastOk) {
            if (!navigator.onLine) updateCloudStatusUi('offline');
            else updateCloudStatusUi(isLocalDirty() ? 'pending' : 'ok');
        }
        return { ok: lastOk };
    } catch (e) {
        console.error('Errore salvataggio cloud:', e);
        updateCloudStatusUi(navigator.onLine ? 'error' : 'offline');
        return { ok: false };
    } finally {
        _cloudSyncInFlight = false;
    }
}

async function fetchCloudState() {
    if (!CLOUD_ENABLED || !appState.syncKey) return { ok: false, state: null };
    if (!navigator.onLine) {
        updateCloudStatusUi('offline');
        return { ok: false, offline: true, state: null };
    }
    updateCloudStatusUi('syncing');
    try {
        const res = await fetch('/api/sync', {
            method: 'GET',
            headers: { 'x-sync-key': appState.syncKey },
        });
        if (!res.ok) {
            console.error('Errore scaricamento cloud:', res.status, await res.text().catch(() => ''));
            updateCloudStatusUi('error');
            return { ok: false, state: null };
        }
        const data = await res.json();
        return { ok: true, state: (data && data.state) ? data.state : null };
    } catch (e) {
        console.error('Errore scaricamento cloud:', e);
        updateCloudStatusUi(navigator.onLine ? 'error' : 'offline');
        return { ok: false, state: null };
    }
}

async function syncWithCloud({ isManualConnect = false } = {}) {
    if (!CLOUD_ENABLED || !appState.syncKey) return { ok: false, action: 'none' };

    const activeSyncKey = appState.syncKey;
    const fetched = await fetchCloudState();
    if (!fetched.ok) return { ok: false, action: 'error' };

    const cloudState = fetched.state;
    const dirty = isLocalDirty();
    const localEmpty = !hasMeaningfulLocalData(appState);
    const localTs = Number(appState.updatedAt) || 0;

    if (!cloudState) {
        if (!localEmpty || dirty) {
            if (!appState.updatedAt) appState.updatedAt = Date.now();
            setLocalDirty(true);
            persistLocalOnly();
            const pushRes = await flushCloudSync();
            return { ok: pushRes.ok, action: 'pushed' };
        }
        updateCloudStatusUi('ok');
        return { ok: true, action: 'noop' };
    }

    const cloudTs = Number(cloudState.updatedAt) || 0;

    if (dirty && localTs > cloudTs && !(isManualConnect && localEmpty)) {
        const pushRes = await flushCloudSync();
        return { ok: pushRes.ok, action: 'pushed' };
    }

    if (cloudTs > localTs || localEmpty || !dirty) {
        mergeStateSafely(cloudState);
        if (!appState.syncKey && activeSyncKey) appState.syncKey = activeSyncKey;
        persistLocalOnly();
        setLocalDirty(false);
        applyMode();
        applyTheme();
        applyBackground(); // <-- aggiungi questa riga
        updateCloudStatusUi('ok');
        return { ok: true, action: 'pulled' };
    }

    updateCloudStatusUi('ok');
    return { ok: true, action: 'noop' };
}

async function saveCloudKey() {
    const key = document.getElementById('cloud-sync-key').value.trim();
    if (key.length < 4) { alert("Inserisci una chiave di almeno 4 caratteri!"); return; }
    appState.syncKey = key;
    persistLocalOnly();

    if (CLOUD_ENABLED) {
        const res = await syncWithCloud({ isManualConnect: true });
        if (!res.ok) {
            alert("Connessione a /api/sync non riuscita. I dati locali restano al sicuro.");
        }
    } else {
        updateCloudStatusUi('ok');
    }
    renderApp();
}

function updateCloudStatusUi(status = 'ok') {
    const dot = document.getElementById('cloud-status-dot');
    const icon = document.getElementById('cloud-icon');
    const badge = document.getElementById('cloud-status-badge');
    if (!dot || !icon) return;

    if (!CLOUD_ENABLED) {
        dot.className = "absolute top-1.5 right-1.5 w-2 h-2 bg-neutral-500 rounded-full";
        icon.innerHTML = UI_SVG.cloudOff;
        icon.style.color = 'var(--text-dim)';
        if (badge) { badge.textContent = 'Solo locale'; badge.style.color = 'var(--text-dim)'; }
    } else if (!appState.syncKey) {
        dot.className = "absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full";
        icon.innerHTML = UI_SVG.cloud;
        icon.style.color = '#f59e0b';
        if (badge) { badge.textContent = 'Non connesso'; badge.style.color = '#f59e0b'; }
    } else if (status === 'offline') {
        dot.className = "absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full";
        icon.innerHTML = UI_SVG.cloudOff;
        icon.style.color = '#f59e0b';
        if (badge) {
            badge.textContent = isLocalDirty() ? 'Offline (da inviare)' : 'Offline';
            badge.style.color = '#f59e0b';
        }
    } else if (status === 'pending') {
        dot.className = "absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full sync-pulse";
        icon.innerHTML = UI_SVG.cloudUp;
        icon.style.color = '#60a5fa';
        if (badge) { badge.textContent = 'In coda...'; badge.style.color = '#60a5fa'; }
    } else if (status === 'syncing') {
        dot.className = "absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full sync-pulse";
        icon.innerHTML = UI_SVG.cloudUp;
        icon.style.color = '#60a5fa';
        if (badge) { badge.textContent = 'Sincronizzo...'; badge.style.color = '#60a5fa'; }
    } else if (status === 'error') {
        dot.className = "absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full";
        icon.innerHTML = UI_SVG.cloudOff;
        icon.style.color = '#ef4444';
        if (badge) { badge.textContent = 'Errore sync'; badge.style.color = '#ef4444'; }
    } else {
        dot.className = "absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full";
        icon.innerHTML = UI_SVG.cloud;
        icon.style.color = '#10b981';
        if (badge) { badge.textContent = 'Connesso'; badge.style.color = '#10b981'; }
    }
}

function downloadJsonBackup() {
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avanguard_backup_${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importJsonBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed || !Array.isArray(parsed.users)) { alert("File JSON non valido."); return; }
            if (!confirm("Ripristinare i dati da questo backup? I dati correnti verranno sostituiti.")) return;
            const currentKey = appState.syncKey;
            mergeStateSafely(parsed);
            if (!appState.syncKey && currentKey) appState.syncKey = currentKey;
            applyMode();
            applyTheme();
            applyBackground();
            await saveData({ immediate: true });
            renderApp();
            alert("Backup ripristinato correttamente!");
        } catch (_) {
            alert("Impossibile leggere il file JSON.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ============================================================
//  NAVIGAZIONE BOTTOM BAR (VENOM / SYMBIOTE LIQUID DOCK)
// ============================================================
function updateSymbioteNav(tab, animate = true) {
    const navInner = document.getElementById('bottom-nav-inner');
    if (!navInner) return;

    const idx = NAV_TABS_ORDER.indexOf(tab);
    const safeIdx = idx >= 0 ? idx : 0;

    if (animate) {
        if (_symbioteMorphTimer) clearTimeout(_symbioteMorphTimer);
        navInner.classList.add('is-morphing');
        navInner.style.setProperty('--nav-idx', String(safeIdx));
        _symbioteMorphTimer = setTimeout(() => {
            navInner.classList.remove('is-morphing');
            _symbioteMorphTimer = null;
        }, 240);
    } else {
        navInner.classList.remove('is-morphing');
        navInner.style.setProperty('--nav-idx', String(safeIdx));
    }
}

function switchTab(tab, scrollToId = null) {
    const prevTab = activeTab;
    activeTab = tab;
    closeAllPopovers();

    document.querySelectorAll('.app-view').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(`view-${tab}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('[data-nav-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.navTab === tab);
    });

    updateSymbioteNav(tab, prevTab !== tab);

    if (tab === 'weight') {
        renderWeightView();
    } else if (tab === 'report') {
        renderReportView();
    }

    if (scrollToId) {
        setTimeout(() => {
            document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 60);
    } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
}

// ============================================================
//  TEMA E MODE
// ============================================================
function getResolvedTheme(themeKey, mode) {
    const t = THEMES[themeKey] || THEMES.red;
    if (t.adaptive) {
        return mode === 'light'
            ? { 400: '#3f3f46', 500: '#18181b', 600: '#09090b', 700: '#000000', rgb: '24, 24, 27', contrast: '#ffffff' }
            : { 400: '#e4e4e7', 500: '#f4f4f5', 600: '#d4d4d8', 700: '#a1a1aa', rgb: '244, 244, 245', contrast: '#09090b' };
    }
    return t;
}

function renderThemeSwatches() {
    const grid = document.getElementById('theme-swatches-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(THEMES).map(([key, t]) => {
        const dotColor = t.dot || (t.adaptive ? 'linear-gradient(135deg, #f4f4f5 50%, #18181b 50%)' : t[500]);
        return `
            <button type="button" data-color-swatch="${escapeHtml(key)}" data-action="set-theme" data-theme-key="${escapeHtml(key)}" class="theme-card-btn">
                <span class="theme-dot" style="background: ${dotColor};"></span>
                <span>${escapeHtml(t.label)}</span>
            </button>
        `;
    }).join('');
}

function applyTheme() {
    const t = getResolvedTheme(appState.theme, appState.mode);
    const root = document.documentElement;
    root.style.setProperty('--brand-400', t[400]);
    root.style.setProperty('--brand-500', t[500]);
    root.style.setProperty('--brand-600', t[600]);
    root.style.setProperty('--brand-700', t[700]);
    root.style.setProperty('--brand-rgb', t.rgb);
    root.style.setProperty('--brand-contrast', t.contrast || '#ffffff');
    root.style.setProperty('--brand-50',  `rgba(${t.rgb}, .09)`);
    root.style.setProperty('--brand-100', `rgba(${t.rgb}, .16)`);
    root.style.setProperty('--brand-200', `rgba(${t.rgb}, .30)`);

    document.querySelectorAll('[data-color-swatch]').forEach(el => {
        el.classList.toggle('active', el.dataset.colorSwatch === appState.theme);
    });
    if (activeTab === 'weight') setTimeout(renderWeightChart, 20);
}

function applyMode() {
    document.documentElement.setAttribute('data-theme', appState.mode || 'dark');
    document.querySelectorAll('[data-mode-btn]').forEach(el => {
        el.classList.toggle('active', el.dataset.modeBtn === appState.mode);
    });
}

function setTheme(colorKey) {
    appState.theme = colorKey;
    applyTheme();
    saveData();
}

function setMode(mode) {
    appState.mode = mode;
    applyMode();
    applyTheme();
    saveData();
}

function applyBackground() {
    const raw = Number(appState.bgStyle);
    const bgId = (Number.isInteger(raw) && raw >= 1 && raw <= BACKGROUNDS.length) ? raw : 1;
    appState.bgStyle = bgId;

    document.documentElement.setAttribute('data-bg', String(bgId));

    const current = BACKGROUNDS.find(b => b.id === bgId) || BACKGROUNDS[0];
    const nameEl = document.getElementById('bg-selector-name');
    const subEl = document.getElementById('bg-selector-sub');
    const dotsEl = document.getElementById('bg-selector-dots');

    if (nameEl) nameEl.textContent = current.name;
    if (subEl) subEl.textContent = current.desc;
    if (dotsEl) {
        dotsEl.innerHTML = BACKGROUNDS.map(b =>
            `<span class="bg-dot ${b.id === bgId ? 'active' : ''}"></span>`
        ).join('');
    }
}

function cycleBackground(delta) {
    const total = BACKGROUNDS.length;
    const current = Number.isInteger(appState.bgStyle) ? appState.bgStyle : 1;
    const next = ((current - 1 + delta + total) % total) + 1;
    appState.bgStyle = next;
    applyBackground();
    saveData();
}

// ============================================================
//  PARSING TARGET E RECUPERI
// ============================================================
function parseTargetBlocks(targetText) {
    if (!targetText) return ['3x10'];
    const rawParts = targetText.split('+').map(p => p.trim()).filter(p => p !== '');
    if (rawParts.length === 0) return [targetText];

    const hasNxR = (s) => /\d\s*[x×]\s*\d/i.test(s);
    const blocks = [];
    let current = '';
    for (const part of rawParts) {
        if (current === '') {
            current = part;
        } else if (hasNxR(current) && hasNxR(part)) {
            blocks.push(current);
            current = part;
        } else {
            current = current + ' + ' + part;
        }
    }
    if (current !== '') blocks.push(current);
    return blocks.length > 0 ? blocks : [targetText];
}

function parseTargetAndRests(rawTarget) {
    const rawBlocks = parseTargetBlocks(rawTarget || '3x10');
    const cleanBlocks = [];
    const rests = [];

    const parenRegex = /[\(\[]\s*(?:rec\.?\s*|recupero\s*|r\s*)?(\d+(?:[\.,]\d+)?\s*(?:'|’|m(?:in)?|s(?:ec)?|")(?:\s*\d+\s*(?:"|s(?:ec)?)?|\d{2})?|\d+:\d{2})\s*[\)\]]/i;
    const inlineRegex = /\b(?:rec\.?|recupero|rest)\s*:?\s*(\d+(?:[\.,]\d+)?\s*(?:'|’|m(?:in)?|s(?:ec)?|")(?:\s*\d+\s*(?:"|s(?:ec)?)?|\d{2})?|\d+:\d{2})/i;

    rawBlocks.forEach(block => {
        let b = block.trim();
        let rest = '';
        const mParen = b.match(parenRegex);
        if (mParen) {
            rest = normalizeRestLabel(mParen[1]);
            b = b.replace(mParen[0], '').trim();
        } else {
            const mInline = b.match(inlineRegex);
            if (mInline) {
                rest = normalizeRestLabel(mInline[1]);
                b = b.replace(mInline[0], '').trim();
            }
        }
        cleanBlocks.push(b || block.trim());
        rests.push(rest);
    });

    return {
        cleanTarget: cleanBlocks.join(' + '),
        rests: rests.some(r => r !== '') ? rests : []
    };
}

function normalizeRestLabel(str) {
    return String(str || '').trim().replace(/’/g, "'").replace(/\s+/g, '');
}

function parseRestToSeconds(restStr) {
    const s = String(restStr || '').trim().toLowerCase().replace(/’/g, "'").replace(',', '.');
    if (!s) return 0;
    const colon = s.match(/^(\d+)\s*:\s*(\d{1,2})$/);
    if (colon) return parseInt(colon[1], 10) * 60 + parseInt(colon[2], 10);
    const minSec = s.match(/^(\d+)\s*(?:'|m|min)\s*(\d{1,2})\s*(?:"|s|sec)?$/);
    if (minSec) return parseInt(minSec[1], 10) * 60 + parseInt(minSec[2], 10);
    const minOnly = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|m|min)$/);
    if (minOnly) return Math.round(parseFloat(minOnly[1]) * 60);
    const secOnly = s.match(/^(\d+)\s*(?:"|s|sec)$/);
    if (secOnly) return parseInt(secOnly[1], 10);
    const num = parseFloat(s);
    if (!isNaN(num) && num > 0) return num <= 10 ? Math.round(num * 60) : Math.round(num);
    return 90;
}

// ============================================================
//  TIMER RECUPERO FLOATING (WALL-CLOCK STANDBY-PROOF)
// ============================================================
function startRestTimer(exName, blockLabel, restStr) {
    const seconds = parseRestToSeconds(restStr);
    if (!seconds) return;

    stopRestTimer(false);
    _restTimerTotalMs = seconds * 1000;
    _restTimerRemainingMs = _restTimerTotalMs;
    _restTimerEndAt = Date.now() + _restTimerRemainingMs;
    _restTimerPaused = false;
    _restTimerActive = true;

    document.getElementById('rest-timer-label').textContent = `${exName} · ${blockLabel}`;
    document.getElementById('rest-timer-bar').classList.remove('hidden');
    updateRestTimerDisplay();

    _restTimerInterval = setInterval(syncRestTimerFromClock, 250);
}

function syncRestTimerFromClock() {
    if (!_restTimerActive || _restTimerPaused || _restTimerEndAt === null) return;

    const remMs = _restTimerEndAt - Date.now();
    if (remMs <= 0) {
        _restTimerRemainingMs = 0;
        _restTimerEndAt = null;
        if (_restTimerInterval) {
            clearInterval(_restTimerInterval);
            _restTimerInterval = null;
        }
        updateRestTimerDisplay();
        playTimerDoneFeedback();
    } else {
        _restTimerRemainingMs = remMs;
        updateRestTimerDisplay();
    }
}

function updateRestTimerDisplay() {
    const remainingSec = Math.ceil(_restTimerRemainingMs / 1000);
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;

    document.getElementById('rest-timer-time').textContent = remainingSec <= 0
        ? 'PRONTO!'
        : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const pct = _restTimerTotalMs > 0 ? (_restTimerRemainingMs / _restTimerTotalMs) * 100 : 0;
    document.getElementById('rest-timer-progress').style.width = `${Math.max(0, Math.min(100, pct))}%`;
    document.getElementById('rest-timer-toggle').innerHTML = (_restTimerPaused || remainingSec <= 0)
        ? UI_SVG.play
        : UI_SVG.pause;
}

function toggleRestTimerPause() {
    if (!_restTimerActive) return;

    if (_restTimerRemainingMs <= 0) {
        _restTimerRemainingMs = _restTimerTotalMs;
        _restTimerEndAt = Date.now() + _restTimerRemainingMs;
        _restTimerPaused = false;
        if (!_restTimerInterval) _restTimerInterval = setInterval(syncRestTimerFromClock, 250);
    } else if (_restTimerPaused) {
        _restTimerPaused = false;
        _restTimerEndAt = Date.now() + _restTimerRemainingMs;
        if (!_restTimerInterval) _restTimerInterval = setInterval(syncRestTimerFromClock, 250);
    } else {
        if (_restTimerEndAt !== null) {
            _restTimerRemainingMs = Math.max(0, _restTimerEndAt - Date.now());
        }
        _restTimerEndAt = null;
        _restTimerPaused = true;
        if (_restTimerInterval) {
            clearInterval(_restTimerInterval);
            _restTimerInterval = null;
        }
    }
    updateRestTimerDisplay();
}

function adjustRestTimer(deltaSec) {
    if (!_restTimerActive) return;

    const currentMs = (!_restTimerPaused && _restTimerEndAt !== null)
        ? Math.max(0, _restTimerEndAt - Date.now())
        : _restTimerRemainingMs;

    const nextMs = Math.max(5000, currentMs + deltaSec * 1000);
    _restTimerRemainingMs = nextMs;
    if (_restTimerRemainingMs > _restTimerTotalMs) {
        _restTimerTotalMs = _restTimerRemainingMs;
    }

    if (!_restTimerPaused) {
        _restTimerEndAt = Date.now() + _restTimerRemainingMs;
        if (!_restTimerInterval) {
            _restTimerInterval = setInterval(syncRestTimerFromClock, 250);
        }
    }
    updateRestTimerDisplay();
}

function stopRestTimer(hideBar = true) {
    if (_restTimerInterval) {
        clearInterval(_restTimerInterval);
        _restTimerInterval = null;
    }
    _restTimerActive = false;
    _restTimerEndAt = null;
    _restTimerPaused = false;
    _restTimerRemainingMs = 0;
    if (hideBar) document.getElementById('rest-timer-bar')?.classList.add('hidden');
}

function playTimerDoneFeedback() {
    if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [880, 1174.66].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.14, ctx.currentTime + idx * 0.16);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.16);
            osc.stop(ctx.currentTime + idx * 0.16 + 0.26);
        });
    } catch (_) {}
}

// ============================================================
//  RENDER PRINCIPALE
// ============================================================
function renderApp() {
    renderProgramWeeksSetting();
    const weekDisplay = document.getElementById('week-display');
    weekDisplay.innerText = appState.week;
    weekDisplay.closest('.week-pill')?.classList.toggle('is-week0', appState.week === 0);

    const userSelector = document.getElementById('user-selector');
    userSelector.innerHTML = '';
    if (appState.users.length === 0) {
        const opt = document.createElement('option');
        opt.value = ''; opt.textContent = '— Nessun profilo —';
        userSelector.appendChild(opt);
    } else {
        appState.users.forEach(user => {
            const opt = document.createElement('option');
            opt.value = user.id; opt.textContent = user.name;
            if (user.id === appState.currentUserId) opt.selected = true;
            userSelector.appendChild(opt);
        });
    }

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    document.getElementById('header-user-name').textContent = currentUser ? currentUser.name : 'Tocca per configurare';

    const curW = getUserWeights()['w' + appState.week];
    document.getElementById('nav-weight-label').textContent = curW != null ? `${curW.toFixed(1)} kg` : 'Peso';

    renderWorkoutView(currentUser);

    if (activeTab === 'weight') renderWeightView();
    if (activeTab === 'report') renderReportView();
}

function renderWorkoutView(currentUser) {
    const strip = document.getElementById('day-tabs-strip');
    const container = document.getElementById('active-day-container');

    if (!currentUser || !currentUser.days || currentUser.days.length === 0) {
        strip.innerHTML = '';
        container.innerHTML = renderEmptyState();
        return;
    }

    if (!activeDayId || !currentUser.days.some(d => d.id === activeDayId)) {
        const firstOpen = currentUser.days.find(d => d.isOpen);
        activeDayId = firstOpen ? firstOpen.id : currentUser.days[0].id;
    }

    // 1. Barra orizzontale tab giorni (delegata via data-action)
    strip.innerHTML = currentUser.days.map(day => {
        const isActive = day.id === activeDayId;
        const total = day.exercises.length;
        let done = 0;
        for (let i = 0; i < total; i++) {
            const lk = `w${appState.week}_${currentUser.id}_${day.id}_${day.exercises[i].id}`;
            if (appState.logs[lk]?.done) done++;
        }
        const isDayDone = total > 0 && done === total;
        const doneDotHtml = (isDayDone && !isActive)
            ? `<span class="day-done-dot" aria-hidden="true"></span>`
            : '';
        return `
            <button type="button" data-action="select-day" data-day-id="${escapeHtml(day.id)}" class="day-tab-pill ${isActive ? 'active' : ''}">
                ${getDayIconSvg(day)}
                <span>${escapeHtml(day.name)}</span>
                ${doneDotHtml}
            </button>
        `;
    }).join('') + `
        <button type="button" data-action="open-add-day" class="day-tab-add" title="Aggiungi nuovo giorno">
            ${UI_SVG.plus}
        </button>
    `;

    // 2. Giorno attivo
    const day = currentUser.days.find(d => d.id === activeDayId);
    const totalEx = day.exercises.length;
    let doneEx = 0;
    day.exercises.forEach(ex => {
        const lk = `w${appState.week}_${currentUser.id}_${day.id}_${ex.id}`;
        if (appState.logs[lk]?.done) doneEx++;
    });
    const pct = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0;

    let carriedAny = false;
    let cardsHtml = '';

    if (totalEx === 0) {
        cardsHtml = `
            <div class="panel-card p-8 text-center mb-3">
                <p class="text-sm font-bold text-app mb-1">Giorno ancora vuoto</p>
                <p class="text-xs text-muted">Aggiungi un esercizio singolo o incolla la lista qui sotto.</p>
            </div>
        `;
    } else {
        day.exercises.forEach(ex => {
            const res = renderExerciseCard(currentUser, day, ex);
            if (res.carriedNow) carriedAny = true;
            cardsHtml += res.html;
        });
    }

    // Banner dedicato SOLO in Settimana 0 (Prova / Calibrazione)
    const week0BannerHtml = appState.week === 0
        ? `<div class="week0-banner" role="note">
               <span class="week0-banner-icon">${UI_SVG.compass}</span>
               <p class="week0-banner-text">
                   <strong>Settimana 0 (Prova)</strong> — Oggi vai leggero, concentra la tecnica e cerca di capire i carichi giusti.
               </p>
           </div>`
        : '';

    container.innerHTML = `
        ${week0BannerHtml}

        <div class="day-hero">
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="day-hero-icon">${getDayIconSvg(day)}</div>
                    <div class="min-w-0">
                        <h2 class="text-base sm:text-lg font-black tracking-tight truncate">${escapeHtml(day.name)}</h2>
                        <div class="text-xs font-semibold text-muted tabular-nums mt-0.5">
                            ${doneEx} di ${totalEx} completati · ${pct}%
                        </div>
                    </div>
                </div>
                <button type="button" data-action="open-edit-day" data-day-id="${escapeHtml(day.id)}" class="icon-btn" title="Modifica giorno e icona">
                    ${UI_SVG.edit}
                </button>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${pct}%;"></div>
            </div>
        </div>

        <div>${cardsHtml}</div>

        <div class="grid grid-cols-2 gap-2.5 mt-3">
            <button type="button" data-action="prepare-single-add" data-day-id="${escapeHtml(day.id)}" class="btn btn-ghost">
                ${UI_SVG.plus} Esercizio
            </button>
            <button type="button" data-action="prepare-bulk-add" data-day-id="${escapeHtml(day.id)}" class="btn btn-outline">
                ${UI_SVG.bolt} Incolla Lista
            </button>
        </div>
    `;

    if (carriedAny) saveData();
}

function selectDay(dayId) {
    activeDayId = dayId;
    closeAllPopovers();
    renderWorkoutView(appState.users.find(u => u.id === appState.currentUserId));
}

function renderExerciseCard(currentUser, day, ex) {
    const logKey = `w${appState.week}_${currentUser.id}_${day.id}_${ex.id}`;
    const log = appState.logs[logKey] || { done: false, weights: [], up: false };
    if (log.weight && (!log.weights || log.weights.length === 0)) log.weights = [log.weight];
    const weightsArray = log.weights || [];

    const rawTarget = getRawTargetForWeek(ex, appState.week);
    const parsedTarget = parseTargetAndRests(rawTarget);
    const blocks = parseTargetBlocks(parsedTarget.cleanTarget);
    const restsArray = getRestsForWeek(ex, appState.week);

    let upBadgeHtml = '';
    let prevNoteHtml = '';
    if (appState.week >= 1) {
        const prevWeek = appState.week - 1;
        const prevLog = appState.logs[`w${prevWeek}_${currentUser.id}_${day.id}_${ex.id}`];
        if (prevLog && prevLog.up) {
            upBadgeHtml = `<div class="up-badge">${UI_SVG.flame} Aumenta il carico</div>`;
        }
        const prevNoteText = typeof prevLog?.note === 'string' ? prevLog.note.trim() : '';
        if (prevNoteText) {
            const prevLabel = prevWeek === 0 ? 'Nota da S0:' : `Nota da S${prevWeek}:`;
            prevNoteHtml = `
                <div class="prev-note-chip">
                    <span class="prev-note-icon" aria-hidden="true">${UI_SVG.noteSm}</span>
                    <div class="prev-note-body">
                        <span class="prev-note-label">${prevLabel}</span>
                        <span class="prev-note-text">"${escapeHtml(prevNoteText)}"</span>
                    </div>
                </div>
            `;
        }
    }

    // Auto-carry sicuro anche se il numero di blocchi cambia tra S(w-1) e S(w)
    let carriedNow = false;
    let prevWeights = null;
    if (appState.week >= 1) {
        const prevWeek = appState.week - 1;
        const prevLog = appState.logs[`w${prevWeek}_${currentUser.id}_${day.id}_${ex.id}`];
        const prevRawTarget = getRawTargetForWeek(ex, prevWeek);
        const prevBlocks = parseTargetBlocks(parseTargetAndRests(prevRawTarget).cleanTarget);

        let pArr = prevLog ? (Array.isArray(prevLog.weights) ? prevLog.weights : []) : [];
        if (prevLog && prevLog.weight && pArr.length === 0) pArr = [prevLog.weight];
        // Tronca ai blocchi reali della settimana precedente (evita pesi "fantasma")
        pArr = pArr.slice(0, Math.max(1, prevBlocks.length));
        if (pArr.some(v => v !== '' && v !== undefined && v !== null)) {
            prevWeights = pArr;
        }
    }

    const activeSlice = weightsArray.slice(0, blocks.length);
    const isCurrentEmpty = !activeSlice.some(v => v !== '' && v !== undefined && v !== null);
    let finalLog = log;
    if (isCurrentEmpty && prevWeights && !appState.carried[logKey]) {
        const carriedWeights = Array.from({ length: blocks.length }, (_, idx) => {
            const pv = prevWeights[idx];
            return (pv !== '' && pv !== undefined && pv !== null) ? String(pv) : '';
        });
        if (carriedWeights.some(v => v !== '')) {
            appState.logs[logKey] = {
                ...(appState.logs[logKey] || {}),
                weights: carriedWeights,
                done: false,
                up: false,
                carried: true,
            };
            appState.carried[logKey] = true;
            finalLog = appState.logs[logKey];
            carriedNow = true;
        }
    }

    return {
        carriedNow,
        html: renderExerciseCardInternal(day.id, ex, logKey, finalLog, blocks, restsArray, upBadgeHtml, prevNoteHtml, !!finalLog.carried)
    };
}

function renderExerciseCardInternal(dayId, ex, logKey, log, blocks, restsArray, upBadgeHtml, prevNoteHtml, isCarried) {
    const weightsArray = log.weights || [];
    const popId = `pop_${ex.id}`;

    const blocksHtml = blocks.map((block, i) => {
        const val = weightsArray[i] ?? '';
        const restVal = (restsArray && restsArray[i]) ? restsArray[i] : '';
        const restPillHtml = restVal
            ? `<button type="button"
                   data-action="start-rest"
                   data-ex-name="${escapeHtml(ex.name)}"
                   data-block-label="${escapeHtml(block)}"
                   data-rest-str="${escapeHtml(restVal)}"
                   class="rest-pill"
                   title="Avvia recupero ${escapeHtml(restVal)}">
                   ${UI_SVG.clock} <span>${escapeHtml(restVal)}</span>
               </button>`
            : '';

        return `
            <div class="ex-block-item">
                <div class="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                    <span class="text-xs font-extrabold brand-text uppercase tracking-wide tabular-nums">${escapeHtml(block)}</span>
                    ${restPillHtml}
                </div>
                <div class="weight-pill">
                    <input type="number" step="0.25" inputmode="decimal"
                        placeholder="—" value="${escapeHtml(val)}"
                        data-weight-input="1"
                        data-log-key="${escapeHtml(logKey)}"
                        data-block-index="${i}">
                    <span class="unit">kg</span>
                </div>
            </div>
        `;
    }).join('');

    const carriedLabel = appState.week === 1 ? 'da S0' : `S${appState.week - 1}`;
    const carriedBadge = isCarried
        ? `<span class="carried-badge" data-carried-for="${escapeHtml(logKey)}">${UI_SVG.arrowUp} ${carriedLabel}</span>`
        : '';
    const coachNoteHtml = ex.coachNote
        ? `<p class="ex-coach-note">${escapeHtml(ex.coachNote)}</p>`
        : '';
    const isJustCompleted = !!(log.done && _justCompletedLogKey === logKey);

    const currentNote = typeof log.note === 'string' ? log.note : '';
    const hasNote = currentNote.trim().length > 0;
    const isNoteOpen = _openNoteKeys.has(logKey);
    const weekShort = appState.week === 0 ? 'S0' : `S${appState.week}`;
    const noteTitle = appState.week < getProgramWeekCount()
        ? `Nota ${weekShort} · promemoria in S${appState.week + 1}`
        : `Nota ${weekShort}`;

    return `
        <div class="ex-card ${log.done ? 'done' : ''} ${isJustCompleted ? 'just-completed' : ''}" data-ex-card-key="${escapeHtml(logKey)}">
            <span class="ex-shine-layer" aria-hidden="true"></span>
            ${upBadgeHtml}
            <div class="flex items-start gap-3">
                <label class="cursor-pointer mt-0.5 flex-shrink-0">
                    <input type="checkbox" class="sr-only" ${log.done ? 'checked' : ''}
                        data-action="toggle-done"
                        data-log-key="${escapeHtml(logKey)}">
                    <span class="ex-check">${UI_SVG.check}</span>
                </label>
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-app text-[14.5px] break-words leading-snug">
                        ${escapeHtml(ex.name)}${carriedBadge}
                    </h3>
                    ${coachNoteHtml}
                </div>
                <div class="flex items-center gap-0.5 flex-shrink-0">
                    <button type="button"
                        data-action="toggle-note"
                        data-log-key="${escapeHtml(logKey)}"
                        data-note-btn-for="${escapeHtml(logKey)}"
                        class="mini-action-btn note-btn ${hasNote ? 'has-note' : ''} ${isNoteOpen ? 'active' : ''}"
                        title="${hasNote ? `Modifica nota ${weekShort}` : `Aggiungi nota ${weekShort}`}"
                        aria-expanded="${isNoteOpen ? 'true' : 'false'}">
                        ${UI_SVG.note}
                    </button>
                    <button type="button" data-action="toggle-up" data-log-key="${escapeHtml(logKey)}" class="mini-action-btn ${log.up ? 'active' : ''}" title="Aumenta carico settimana prossima">
                        ${UI_SVG.trendUp}
                    </button>
                    <button type="button" data-action="toggle-ex-menu" data-popover-id="${escapeHtml(popId)}" class="mini-action-btn" title="Altre opzioni">
                        ${UI_SVG.dots}
                    </button>
                </div>
            </div>

            ${prevNoteHtml}

            <div class="ex-note-drawer ${isNoteOpen ? 'open' : ''}" data-note-drawer-for="${escapeHtml(logKey)}">
                <div class="ex-note-drawer-inner">
                    <div class="ex-note-box">
                        <div class="ex-note-head">
                            <span class="ex-note-title">${noteTitle}</span>
                            <button type="button"
                                data-action="clear-note"
                                data-log-key="${escapeHtml(logKey)}"
                                data-note-clear-for="${escapeHtml(logKey)}"
                                class="ex-note-clear ${hasNote ? '' : 'hidden'}">
                                Cancella
                            </button>
                        </div>
                        <textarea rows="2" maxlength="280"
                            class="ex-note-input"
                            placeholder="Es. Fermo 2s al petto, chiuse bene..."
                            data-note-input="1"
                            data-log-key="${escapeHtml(logKey)}">${escapeHtml(currentNote)}</textarea>
                    </div>
                </div>
            </div>

            <div id="${escapeHtml(popId)}" class="ex-popover hidden">
                <button type="button" data-action="edit-ex" data-day-id="${escapeHtml(dayId)}" data-ex-id="${escapeHtml(ex.id)}" class="ex-popover-item">
                    ${UI_SVG.edit} Modifica / Recuperi
                </button>
                <button type="button" data-action="delete-ex" data-day-id="${escapeHtml(dayId)}" data-ex-id="${escapeHtml(ex.id)}" class="ex-popover-item danger">
                    ${UI_SVG.trash} Elimina esercizio
                </button>
            </div>

            <div class="ex-blocks-list">${blocksHtml}</div>
        </div>
    `;
}

function toggleExMenu(event, popId) {
    event.stopPropagation();
    const el = document.getElementById(popId);
    if (!el) return;
    const wasHidden = el.classList.contains('hidden');
    closeAllPopovers();
    if (wasHidden) {
        el.classList.remove('hidden');
        el.closest('.ex-card')?.classList.add('popover-open');
        openPopoverId = popId;
    }
}

function closeAllPopovers() {
    if (openPopoverId) {
        const el = document.getElementById(openPopoverId);
        el?.classList.add('hidden');
        el?.closest('.ex-card')?.classList.remove('popover-open');
        openPopoverId = null;
    }
}

function renderEmptyState() {
    return `
        <div class="empty-hero mt-4">
            <div class="w-14 h-14 mx-auto rounded-2xl brand-soft-bg brand-text flex items-center justify-center mb-4">
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4"/><path d="M21 10v4"/><rect x="5" y="7" width="3" height="10" rx="1"/><rect x="16" y="7" width="3" height="10" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <h2 class="text-lg font-black mb-1">Nessuna scheda attiva</h2>
            <p class="text-muted mb-5 max-w-xs mx-auto text-xs leading-relaxed">Incolla tutta la tua scheda in una volta sola, crea il primo giorno oppure sincronizza dal cloud.</p>
            <div class="flex flex-col gap-2 max-w-xs mx-auto">
                <button type="button" data-action="open-import-plan" class="btn btn-primary">Incolla Scheda Intera</button>
                <button type="button" data-action="open-add-day" class="btn btn-outline">Nuovo Giorno</button>
                <button type="button" data-action="open-cloud-settings" class="btn btn-ghost">Connetti Cloud Sync</button>
            </div>
        </div>
    `;
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// ============================================================
//  PULIZIA CHIAVI ORFANE (logs / carried / bodyWeight)
// ============================================================
function deleteMatchingLogKeys(predicate) {
    if (appState.logs && typeof appState.logs === 'object') {
        Object.keys(appState.logs).forEach(k => {
            if (predicate(k)) delete appState.logs[k];
        });
    }
    if (appState.carried && typeof appState.carried === 'object') {
        Object.keys(appState.carried).forEach(k => {
            if (predicate(k)) delete appState.carried[k];
        });
    }
}

function cleanupExerciseLogs(userId, dayId, exId) {
    const suffix = `${userId}_${dayId}_${exId}`;
    deleteMatchingLogKeys(k => /^w\d+_/.test(k) && k.replace(/^w\d+_/, '') === suffix);
}

function cleanupDayLogs(userId, dayId, dayObj = null) {
    const prefix = `${userId}_${dayId}_`;
    const exactSuffixes = new Set(
        (dayObj?.exercises || []).map(ex => `${userId}_${dayId}_${ex.id}`)
    );
    deleteMatchingLogKeys(k => {
        if (!/^w\d+_/.test(k)) return false;
        const rest = k.replace(/^w\d+_/, '');
        return exactSuffixes.has(rest) || rest.startsWith(prefix);
    });
}

function cleanupUserLogs(userId) {
    const prefix = `${userId}_`;
    deleteMatchingLogKeys(k => /^w\d+_/.test(k) && k.replace(/^w\d+_/, '').startsWith(prefix));
    if (appState.bodyWeight && typeof appState.bodyWeight === 'object') {
        delete appState.bodyWeight[userId];
    }
    if (appState.bodyWeightGoal && typeof appState.bodyWeightGoal === 'object') {
        delete appState.bodyWeightGoal[userId];
    }
}

// ============================================================
//  GIORNI: add / edit / delete + ICON PICKER
// ============================================================
function renderIconPickerGrid(containerId, selectedKey, actionName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = Object.entries(DAY_ICONS).map(([key, item]) => `
        <button type="button" data-action="${escapeHtml(actionName)}" data-icon-key="${escapeHtml(key)}" class="icon-pick-btn ${key === selectedKey ? 'active' : ''}">
            ${item.svg}
            <span>${escapeHtml(item.label)}</span>
        </button>
    `).join('');
}

function openAddDayModal() {
    document.getElementById('new-day-name').value = '';
    tempSelectedNewDayIcon = 'dumbbell';
    renderIconPickerGrid('new-day-icon-grid', tempSelectedNewDayIcon, 'select-new-day-icon');
    openModal('add-day-modal');
}
function selectNewDayIcon(key) {
    tempSelectedNewDayIcon = key;
    renderIconPickerGrid('new-day-icon-grid', tempSelectedNewDayIcon, 'select-new-day-icon');
}
function autoSelectIconForNewDay(name) {
    const detected = detectDayIcon(name);
    if (detected !== tempSelectedNewDayIcon) {
        tempSelectedNewDayIcon = detected;
        renderIconPickerGrid('new-day-icon-grid', tempSelectedNewDayIcon, 'select-new-day-icon');
    }
}

function openEditDayModal(dayId) {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser?.days.find(d => d.id === dayId);
    if (!day) return;
    tempEditDayId = dayId;
    document.getElementById('edit-day-name').value = day.name;
    tempSelectedEditDayIcon = (day.icon && DAY_ICONS[day.icon]) ? day.icon : detectDayIcon(day.name);
    renderIconPickerGrid('edit-day-icon-grid', tempSelectedEditDayIcon, 'select-edit-day-icon');
    openModal('edit-day-modal');
}
function selectEditDayIcon(key) {
    tempSelectedEditDayIcon = key;
    renderIconPickerGrid('edit-day-icon-grid', tempSelectedEditDayIcon, 'select-edit-day-icon');
}

function saveEditDay() {
    const newName = document.getElementById('edit-day-name').value.trim();
    if (!newName) return;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser?.days.find(d => d.id === tempEditDayId);
    if (!day) return;
    day.name = newName;
    day.icon = tempSelectedEditDayIcon;
    saveData();
    closeModal('edit-day-modal');
    renderApp();
}

function deleteCurrentEditDay() {
    if (!tempEditDayId) return;
    if (!confirm('Eliminare questo giorno e tutti i suoi esercizi?')) return;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    if (!currentUser) return;
    const dayToDelete = currentUser.days.find(d => d.id === tempEditDayId);
    currentUser.days = currentUser.days.filter(d => d.id !== tempEditDayId);
    cleanupDayLogs(currentUser.id, tempEditDayId, dayToDelete);
    if (activeDayId === tempEditDayId) activeDayId = currentUser.days[0]?.id || null;
    saveData();
    closeModal('edit-day-modal');
    renderApp();
}

function ensureCurrentUser() {
    let currentUser = appState.users.find(u => u.id === appState.currentUserId);
    if (!currentUser) {
        const newId = 'u_' + Date.now();
        currentUser = { id: newId, name: 'Io', days: [] };
        appState.users.push(currentUser);
        appState.currentUserId = newId;
    }
    return currentUser;
}

function saveDay() {
    const name = document.getElementById('new-day-name').value.trim();
    if (!name) return;
    const currentUser = ensureCurrentUser();
    const newDayId = 'd_' + Date.now();
    currentUser.days.push({
        id: newDayId,
        name: name,
        icon: tempSelectedNewDayIcon,
        isOpen: true,
        exercises: []
    });
    activeDayId = newDayId;
    document.getElementById('new-day-name').value = '';
    saveData();
    closeModal('add-day-modal');
    switchTab('workout');
    renderApp();
}

// ============================================================
//  UTENTI
// ============================================================
function switchUser(userId) {
    appState.currentUserId = userId;
    activeDayId = null;
    saveData();
    renderApp();
}

function saveUser() {
    const name = document.getElementById('new-user-name').value.trim();
    if (!name) return;
    const newId = 'u_' + Date.now();
    appState.users.push({ id: newId, name: name, days: [] });
    appState.currentUserId = newId;
    activeDayId = null;
    document.getElementById('new-user-name').value = '';
    saveData();
    closeModal('add-user-modal');
    renderApp();
}

function openEditUserModal() {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    if (!currentUser) return;
    document.getElementById('edit-user-name').value = currentUser.name;
    openModal('edit-user-modal');
}

function updateUser() {
    const newName = document.getElementById('edit-user-name').value.trim();
    if (!newName) return;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    if (!currentUser) return;
    currentUser.name = newName;
    saveData();
    closeModal('edit-user-modal');
    renderApp();
}

function deleteUser() {
    if (appState.users.length <= 1) { alert("Non puoi eliminare l'unico profilo rimasto!"); return; }
    if (!confirm("Vuoi eliminare questo profilo e tutti i suoi dati?")) return;
    const deletedUserId = appState.currentUserId;
    appState.users = appState.users.filter(u => u.id !== deletedUserId);
    cleanupUserLogs(deletedUserId);
    appState.currentUserId = appState.users[0].id;
    activeDayId = null;
    saveData();
    closeModal('edit-user-modal');
    renderApp();
}

// ============================================================
//  ESERCIZI: add, bulk, edit, delete + PROGRESSIONI S1-S9 CONFIGURABILI & RECUPERI
// ============================================================
function getRestsForWeek(ex, weekNum) {
    if (!ex) return [];
    const w = Number.isFinite(weekNum) ? weekNum : 1;
    const rawTarget = getRawTargetForWeek(ex, w);
    const parsed = parseTargetAndRests(rawTarget);
    const blockCount = Math.max(1, parseTargetBlocks(parsed.cleanTarget).length);

    let chosen = null;
    if (Array.isArray(ex.restsByWeek)) {
        const idx = w === 0 ? 0 : Math.min(w - 1, ex.restsByWeek.length - 1);
        if (idx >= 0 && Array.isArray(ex.restsByWeek[idx])) chosen = ex.restsByWeek[idx];
    } else if (ex.restsByWeek && typeof ex.restsByWeek === 'object') {
        // Per S7-S9 eredita il recupero dell'ultima settimana con un valore
        // esplicito, invece di perdere un recupero salvato in S6.
        const candidates = Object.keys(ex.restsByWeek)
            .map(key => Number(key))
            .filter(key => Number.isInteger(key) && key >= 1 && key <= w)
            .sort((a, b) => b - a);
        const selectedWeek = w === 0
            ? (Array.isArray(ex.restsByWeek['0']) ? 0 : (Array.isArray(ex.restsByWeek['1']) ? 1 : null))
            : candidates.find(key => Array.isArray(ex.restsByWeek[String(key)]));
        if (selectedWeek !== null && selectedWeek !== undefined && Array.isArray(ex.restsByWeek[String(selectedWeek)])) {
            chosen = ex.restsByWeek[String(selectedWeek)];
        }
    }

    if (chosen === null && Array.isArray(ex.rests) && ex.rests.length > 0) {
        chosen = ex.rests;
    }
    if (chosen === null) {
        chosen = parsed.rests;
    }

    return Array.isArray(chosen)
        ? chosen.slice(0, blockCount).map(r => normalizeRestLabel(r))
        : [];
}

function normalizeRestsForTarget(targetStr, restsArr) {
    const parsed = parseTargetAndRests(targetStr || '3x10');
    const blockCount = Math.max(1, parseTargetBlocks(parsed.cleanTarget).length);
    const src = Array.isArray(restsArr) ? restsArr : [];
    const out = Array.from({ length: blockCount }, (_, i) =>
        normalizeRestLabel(src[i] || parsed.rests[i] || '')
    );
    return out.some(v => v !== '') ? out : [];
}

function hasWeeklyVariation(targets, rests) {
    if (!Array.isArray(targets) || targets.length < 2) return false;
    const baseT = String(targets[0] || '').trim();
    const baseR = JSON.stringify(rests?.[0] || []);
    for (let i = 1; i < targets.length; i++) {
        if (String(targets[i] || '').trim() !== baseT) return true;
        if (JSON.stringify(rests?.[i] || []) !== baseR) return true;
    }
    return false;
}

function hasExerciseWeeklyProgression(ex) {
    if (!ex) return false;
    const targets = [];
    const rests = [];
    for (let w = 1; w <= getProgramWeekCount(); w++) {
        targets.push(parseTargetAndRests(getRawTargetForWeek(ex, w)).cleanTarget);
        rests.push(getRestsForWeek(ex, w));
    }
    return hasWeeklyVariation(targets, rests);
}

function formatTargetWithRests(cleanTarget, restsArr) {
    const blocks = parseTargetBlocks(cleanTarget || '3x10');
    const rests = Array.isArray(restsArr) ? restsArr : [];
    return blocks.map((blk, i) => rests[i] ? `${blk} (${rests[i]})` : blk).join(' + ');
}

function summarizeWeeklyProgression(exOrParsed) {
    const entries = [];
    for (let w = 1; w <= getProgramWeekCount(); w++) {
        let cleanTarget, rests;
        if (Array.isArray(exOrParsed.progression)) {
            const raw = exOrParsed.progression[w - 1] || exOrParsed.progression[0] || '3x10';
            cleanTarget = parseTargetAndRests(raw).cleanTarget;
            rests = getRestsForWeek(exOrParsed, w);
        } else {
            cleanTarget = exOrParsed.target || '3x10';
            rests = exOrParsed.rests || [];
        }
        const sig = formatTargetWithRests(cleanTarget, rests);
        const last = entries[entries.length - 1];
        if (last && last.sig === sig) {
            last.end = w;
        } else {
            entries.push({ start: w, end: w, sig });
        }
    }
    return entries.map(g => ({
        label: g.start === g.end ? `S${g.start}` : `S${g.start}-${g.end}`,
        text: g.sig,
    }));
}

function applyProgressionAndRestsToExercise(ex, targets, rests, { week0Target = undefined, week0Rests = undefined, clearWeek0 = false } = {}) {
    const cleanTargets = [];
    const cleanRests = [];
    const weekCount = Math.max(DEFAULT_PROGRAM_WEEKS, getProgramWeekCount(), Array.isArray(targets) ? targets.length : 0);

    for (let i = 0; i < weekCount; i++) {
        const fallbackTarget = cleanTargets[i - 1] || targets?.[0] || '3x10';
        const parsed = parseTargetAndRests(targets?.[i] || fallbackTarget);
        cleanTargets.push(parsed.cleanTarget);
        cleanRests.push(normalizeRestsForTarget(parsed.cleanTarget, rests?.[i] || rests?.[i - 1]));
    }

    ex.progression = cleanTargets;

    if (clearWeek0) {
        delete ex.week0Target;
    } else if (week0Target !== undefined) {
        const parsed0 = parseTargetAndRests(week0Target);
        ex.week0Target = parsed0.cleanTarget;
    }

    // Preserva eventuale recupero dedicato per S0 se non si azzera S0
    let finalW0Rests = null;
    if (!clearWeek0) {
        if (week0Rests !== undefined) {
            const t0 = ex.week0Target || cleanTargets[0];
            finalW0Rests = normalizeRestsForTarget(t0, week0Rests);
        } else if (ex.restsByWeek && !Array.isArray(ex.restsByWeek) && Array.isArray(ex.restsByWeek['0'])) {
            finalW0Rests = ex.restsByWeek['0'];
        }
    }

    const firstSig = JSON.stringify(cleanRests[0]);
    const restsUniform = cleanRests.every(r => JSON.stringify(r) === firstSig) && !finalW0Rests;

    if (restsUniform) {
        delete ex.restsByWeek;
        if (cleanRests[0].length > 0) ex.rests = cleanRests[0];
        else delete ex.rests;
    } else {
        delete ex.rests;
        const map = {};
        if (finalW0Rests && finalW0Rests.length > 0) map['0'] = finalW0Rests;
        for (let i = 0; i < weekCount; i++) {
            if (cleanRests[i].length > 0) map[String(i + 1)] = cleanRests[i];
        }
        if (Object.keys(map).length > 0) ex.restsByWeek = map;
        else delete ex.restsByWeek;
    }
}

function renderRestInputs(prefix, existingRests = null) {
    const targetInput = document.getElementById(`${prefix}-ex-target`);
    const container = document.getElementById(`${prefix}-ex-rests-container`);
    if (!targetInput || !container) return;

    const typedValues = Array.from(container.querySelectorAll('input[data-rest-idx]')).map(inp => inp.value);
    const parsed = parseTargetAndRests(targetInput.value.trim() || '3x10');
    const blocks = parseTargetBlocks(parsed.cleanTarget);

    let html = `<label class="micro-label">Recuperi per blocco (opzionale)</label><div class="space-y-2">`;
    blocks.forEach((blk, idx) => {
        const val = existingRests !== null
            ? (existingRests[idx] || parsed.rests[idx] || '')
            : (parsed.rests[idx] || typedValues[idx] || '');
        html += `
            <div class="flex items-center gap-2">
                <span class="text-xs font-bold brand-text min-w-[78px] truncate">${escapeHtml(blk)}</span>
                <input type="text" data-rest-prefix="${escapeHtml(prefix)}" data-rest-idx="${idx}" value="${escapeHtml(val)}" class="field !py-2 !text-xs flex-1" placeholder="es. 3'  o  1'30&quot;  o  90s">
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function collectRestInputs(prefix) {
    const container = document.getElementById(`${prefix}-ex-rests-container`);
    if (!container) return [];
    const values = Array.from(container.querySelectorAll('input[data-rest-idx]')).map(inp => normalizeRestLabel(inp.value));
    return values.some(v => v !== '') ? values : [];
}

function updateProgBadge(prefix) {
    const draft = _modalProgDraft[prefix];
    const badge = document.getElementById(`${prefix}-prog-badge`);
    if (!draft || !badge) return;
    const isCustom = hasWeeklyVariation(draft.targets, draft.rests);
    badge.textContent = isCustom ? 'Personalizzata' : 'Uniforme';
    badge.classList.toggle('is-custom', isCustom);
}

function renderProgWeekRestsHtml(prefix, weekNum, targetStr, restsArr) {
    const parsed = parseTargetAndRests(targetStr || '3x10');
    const blocks = parseTargetBlocks(parsed.cleanTarget);
    const rests = Array.isArray(restsArr) ? restsArr : [];

    return blocks.map((blk, idx) => {
        const val = rests[idx] || parsed.rests[idx] || '';
        return `
            <label class="prog-rest-item">
                <span class="prog-rest-block">${escapeHtml(blk)}</span>
                <input type="text" class="prog-rest-input"
                    data-prog-prefix="${escapeHtml(prefix)}"
                    data-prog-week="${weekNum}"
                    data-prog-rest-idx="${idx}"
                    value="${escapeHtml(val)}"
                    placeholder="rec.">
            </label>
        `;
    }).join('');
}

function renderProgAccordionRows(prefix) {
    const draft = _modalProgDraft[prefix];
    const listEl = document.getElementById(`${prefix}-prog-weeks-list`);
    if (!draft || !listEl) return;

    let html = '';
    for (let w = 1; w <= draft.targets.length; w++) {
        const idx = w - 1;
        const targetVal = draft.targets[idx] || '3x10';
        const restsVal = draft.rests[idx] || [];
        const isCurrent = (prefix === 'edit' && appState.week === w);
        const fillBtn = w < draft.targets.length
            ? `<button type="button" data-action="prog-fill-forward" data-prog-prefix="${escapeHtml(prefix)}" data-prog-week="${w}" class="prog-fill-btn" title="Copia S${w} fino a S${draft.targets.length}">Da S${w} in poi</button>`
            : '';

        html += `
            <div class="prog-week-row ${isCurrent ? 'is-current' : ''}">
                <div class="prog-week-top">
                    <span class="prog-week-label">S${w}</span>
                    <input type="text"
                        class="field !py-1.5 !px-2.5 !text-xs flex-1"
                        data-prog-prefix="${escapeHtml(prefix)}"
                        data-prog-week="${w}"
                        data-prog-target="1"
                        value="${escapeHtml(targetVal)}"
                        placeholder="es. 4x6 o 2x4 + 2x6">
                    ${fillBtn}
                </div>
                <div class="prog-week-rests" data-prog-rests-wrap="${escapeHtml(prefix)}-${w}">
                    ${renderProgWeekRestsHtml(prefix, w, targetVal, restsVal)}
                </div>
            </div>
        `;
    }
    listEl.innerHTML = html;
    updateProgBadge(prefix);
}

function setProgAccordionOpen(prefix, isOpen) {
    const draft = _modalProgDraft[prefix];
    if (!draft) return;
    draft.open = isOpen;

    const toggle = document.getElementById(`${prefix}-prog-toggle`);
    const body = document.getElementById(`${prefix}-prog-body`);
    if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (body) body.classList.toggle('hidden', !isOpen);

    if (isOpen) {
        if (!draft.touched) syncTopInputsToProgDraft(prefix);
        renderProgAccordionRows(prefix);
    }
}

function toggleProgAccordion(prefix) {
    const draft = _modalProgDraft[prefix];
    if (!draft) return;
    setProgAccordionOpen(prefix, !draft.open);
}

function syncTopInputsToProgDraft(prefix) {
    const draft = _modalProgDraft[prefix];
    if (!draft) return;
    const rawTarget = document.getElementById(`${prefix}-ex-target`)?.value.trim() || '3x10';
    const parsed = parseTargetAndRests(rawTarget);
    const manualRests = collectRestInputs(prefix);
    const finalRests = manualRests.length > 0 ? manualRests : parsed.rests;

    if (prefix === 'single') {
        if (!draft.touched) {
            draft.targets = Array(getProgramWeekCount()).fill(parsed.cleanTarget);
            draft.rests = Array.from({ length: getProgramWeekCount() }, () => [...finalRests]);
        }
    } else if (prefix === 'edit') {
        if (!draft.touched) {
            // Ricalcola dalla base applicando lo scope selezionato
            draft.targets = [...draft.baseTargets];
            draft.rests = draft.baseRests.map(r => [...r]);

            if (tempEditScope === 'all') {
                draft.targets = Array(draft.baseTargets.length).fill(parsed.cleanTarget);
                draft.rests = Array.from({ length: draft.baseTargets.length }, () => [...finalRests]);
            } else if (tempEditScope === 'from') {
                const startIdx = appState.week === 0 ? 0 : Math.max(0, appState.week - 1);
                for (let i = startIdx; i < draft.targets.length; i++) {
                    draft.targets[i] = parsed.cleanTarget;
                    draft.rests[i] = [...finalRests];
                }
            } else if (appState.week >= 1) {
                const idx = appState.week - 1;
                draft.targets[idx] = parsed.cleanTarget;
                draft.rests[idx] = [...finalRests];
            }
        } else if (appState.week >= 1) {
            const idx = appState.week - 1;
            draft.targets[idx] = parsed.cleanTarget;
            draft.rests[idx] = [...finalRests];
        }
    }

    if (draft.open) renderProgAccordionRows(prefix);
    else updateProgBadge(prefix);
}

function handleExerciseTargetInput(prefix) {
    renderRestInputs(prefix);
    syncTopInputsToProgDraft(prefix);
}

function setEditScope(scope) {
    tempEditScope = scope;
    document.querySelectorAll('#edit-ex-scope-group [data-edit-scope]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.editScope === scope);
    });
    const draft = _modalProgDraft.edit;
    if (draft) {
        // Permette allo scope rapido di riallineare il draft se l'utente lo clicca esplicitamente
        draft.touched = false;
        syncTopInputsToProgDraft('edit');
    }
}

function copyProgFromWeekForward(prefix, fromWeek) {
    const draft = _modalProgDraft[prefix];
    if (!draft || fromWeek < 1 || fromWeek > draft.targets.length) return;
    draft.touched = true;
    const srcIdx = fromWeek - 1;
    const parsed = parseTargetAndRests(draft.targets[srcIdx] || '3x10');
    const cleanT = parsed.cleanTarget;
    const srcRests = normalizeRestsForTarget(cleanT, draft.rests[srcIdx]);

    for (let i = srcIdx; i < draft.targets.length; i++) {
        draft.targets[i] = cleanT;
        draft.rests[i] = [...srcRests];
    }
    renderProgAccordionRows(prefix);

    if (prefix === 'edit' && appState.week >= fromWeek) {
        document.getElementById('edit-ex-target').value = cleanT;
        renderRestInputs('edit', srcRests);
    }
}

function handleProgTargetRowInput(inputEl) {
    const prefix = inputEl.dataset.progPrefix;
    const w = parseInt(inputEl.dataset.progWeek, 10);
    const draft = _modalProgDraft[prefix];
    if (!draft || isNaN(w) || w < 1 || w > draft.targets.length) return;

    draft.touched = true;
    const rawVal = inputEl.value;
    const parsed = parseTargetAndRests(rawVal.trim() || '3x10');
    const idx = w - 1;
    draft.targets[idx] = parsed.cleanTarget;

    const existing = draft.rests[idx] || [];
    const blockCount = Math.max(1, parseTargetBlocks(parsed.cleanTarget).length);
    const mergedRests = Array.from({ length: blockCount }, (_, b) =>
        normalizeRestLabel(parsed.rests[b] || existing[b] || '')
    );
    draft.rests[idx] = mergedRests.some(v => v !== '') ? mergedRests : [];

    const restsWrap = document.querySelector(`[data-prog-rests-wrap="${CSS.escape(prefix)}-${w}"]`);
    if (restsWrap) {
        restsWrap.innerHTML = renderProgWeekRestsHtml(prefix, w, draft.targets[idx], draft.rests[idx]);
    }

    if (prefix === 'edit' && appState.week === w) {
        document.getElementById('edit-ex-target').value = draft.targets[idx];
        renderRestInputs('edit', draft.rests[idx]);
    }
    updateProgBadge(prefix);
}

function handleProgRestRowInput(inputEl) {
    const prefix = inputEl.dataset.progPrefix;
    const w = parseInt(inputEl.dataset.progWeek, 10);
    const restIdx = parseInt(inputEl.dataset.progRestIdx, 10);
    const draft = _modalProgDraft[prefix];
    if (!draft || isNaN(w) || isNaN(restIdx) || w < 1 || w > draft.targets.length) return;

    draft.touched = true;
    const idx = w - 1;
    if (!Array.isArray(draft.rests[idx])) draft.rests[idx] = [];
    draft.rests[idx][restIdx] = normalizeRestLabel(inputEl.value);

    if (prefix === 'edit' && appState.week === w) {
        const topRestInp = document.querySelector(`input[data-rest-prefix="edit"][data-rest-idx="${restIdx}"]`);
        if (topRestInp) topRestInp.value = inputEl.value;
    }
    updateProgBadge(prefix);
}

function prepareSingleAdd(dayId) {
    tempTargetDayId = dayId;
    document.getElementById('single-ex-name').value = '';
    document.getElementById('single-ex-coach-note').value = '';
    document.getElementById('single-ex-target').value = '';

    _modalProgDraft.single = {
        open: false,
        touched: false,
        targets: Array(getProgramWeekCount()).fill('3x10'),
        rests: Array.from({ length: getProgramWeekCount() }, () => []),
    };

    renderRestInputs('single', []);
    setProgAccordionOpen('single', false);
    updateProgBadge('single');
    openModal('single-add-modal');
}

function prepareBulkAdd(dayId) {
    tempTargetDayId = dayId;
    openModal('bulk-add-modal');
}

function saveSingleExercise() {
    const name = document.getElementById('single-ex-name').value.trim();
    const coachNote = (document.getElementById('single-ex-coach-note')?.value || '').trim().slice(0, 220);
    const rawTarget = document.getElementById('single-ex-target').value.trim() || '3x10';
    if (!name) return;

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser?.days.find(d => d.id === tempTargetDayId);
    if (!day) return;

    const draft = _modalProgDraft.single;
    const newEx = { id: 'e_' + Date.now(), name: name, progression: [] };
    if (coachNote) newEx.coachNote = coachNote;

    if (draft && (draft.open || draft.touched)) {
        applyProgressionAndRestsToExercise(newEx, draft.targets, draft.rests);
    } else {
        const parsed = parseTargetAndRests(rawTarget);
        const manualRests = collectRestInputs('single');
        const finalRests = manualRests.length > 0 ? manualRests : parsed.rests;
        applyProgressionAndRestsToExercise(
            newEx,
            Array(getProgramWeekCount()).fill(parsed.cleanTarget),
            Array.from({ length: getProgramWeekCount() }, () => [...finalRests])
        );
    }

    day.exercises.push(newEx);
    saveData();
    closeModal('single-add-modal');
    renderApp();
}

function parseWeeklyProgressionSpec(rawSpec) {
    const segments = String(rawSpec || '').split(/[|;]/).map(s => s.trim()).filter(Boolean);
    if (segments.length === 0) return null;

    const weekSegRegex = /^(?:sett\.?|settimana|s|w)\s*([0-9])(?:\s*[-–—]\s*(?:s|w)?\s*([0-9]))?\s*[:\-]\s*(.+)$/i;
    const matched = [];

    for (const seg of segments) {
        const m = seg.match(weekSegRegex);
        if (!m) return null;
        const start = parseInt(m[1], 10);
        const end = m[2] !== undefined ? parseInt(m[2], 10) : start;
        const lo = Math.min(start, end);
        const hi = Math.max(start, end);
        if (lo < 0 || hi > getProgramWeekCount()) return null;
        const parsed = parseTargetAndRests(m[3].trim());
        matched.push({ lo, hi, target: parsed.cleanTarget, rests: parsed.rests });
    }

    if (matched.length === 0) return null;

    const weekCount = getProgramWeekCount();
    const targets = Array(weekCount).fill(null);
    const rests = Array(weekCount).fill(null);
    let week0Target = null;
    let week0Rests = null;

    matched.forEach(seg => {
        for (let w = seg.lo; w <= seg.hi; w++) {
            if (w === 0) {
                week0Target = seg.target;
                week0Rests = seg.rests;
            } else if (w >= 1 && w <= weekCount) {
                targets[w - 1] = seg.target;
                rests[w - 1] = [...seg.rests];
            }
        }
    });

    // Riempi eventuali settimane mancanti propagando l'ultima valida (o la prima definita)
    const firstDefinedIdx = targets.findIndex(t => t !== null);
    const fallbackTarget = firstDefinedIdx !== -1 ? targets[firstDefinedIdx] : (week0Target || '3x10');
    const fallbackRests = firstDefinedIdx !== -1 ? rests[firstDefinedIdx] : (week0Rests || []);

    let lastTarget = fallbackTarget;
    let lastRests = [...fallbackRests];
    for (let i = 0; i < weekCount; i++) {
        if (targets[i] === null) {
            targets[i] = lastTarget;
            rests[i] = [...lastRests];
        } else {
            lastTarget = targets[i];
            lastRests = [...rests[i]];
        }
    }

    const tempEx = {};
    applyProgressionAndRestsToExercise(tempEx, targets, rests, {
        week0Target: week0Target !== null ? week0Target : undefined,
        week0Rests: week0Rests !== null ? week0Rests : undefined,
    });

    return {
        target: targets[0],
        rests: tempEx.rests || [],
        progression: tempEx.progression,
        restsByWeek: tempEx.restsByWeek || null,
        week0Target: tempEx.week0Target || null,
        hasWeeklyProg: hasWeeklyVariation(targets, rests) || week0Target !== null,
    };
}

function parseExerciseLine(line) {
    let cleaned = line.replace(/^[\-\*•\d\.\)\s]+(?=[A-Za-zÀ-ÿ])/, '').trim();
    if (!cleaned) cleaned = line.trim();

    // 1. Rilevazione prioritaria della sintassi multi-settimana (es. S1-2: 4x6 (2'30") | S3-4: ...)
    const weekStartMatch = cleaned.match(/^(.*?)(?:\s*[-–—:|]\s*|\s+)((?:sett\.?|settimana|s|w)\s*[0-9](?:\s*[-–—]\s*(?:s|w)?\s*[0-9])?\s*[:\-].+)$/i);
    if (weekStartMatch && weekStartMatch[1].trim()) {
        const weekly = parseWeeklyProgressionSpec(weekStartMatch[2].trim());
        if (weekly) {
            return {
                name: weekStartMatch[1].replace(/[-–—:|]+$/, '').trim(),
                ...weekly,
            };
        }
    }

    let name = cleaned;
    let rawTarget = '3x10';

    const sepMatch = cleaned.match(/^(.+?)\s*(?:[-–—:|])\s*(.+)$/);
    if (sepMatch && /\d\s*[x×]\s*\d/i.test(sepMatch[2])) {
        name = sepMatch[1].trim();
        rawTarget = sepMatch[2].trim();
    } else if (sepMatch && cleaned.includes('-')) {
        name = sepMatch[1].trim();
        rawTarget = sepMatch[2].trim() || '3x10';
    } else {
        const nxrIdx = cleaned.search(/\b\d+\s*[x×]\s*\d+/i);
        if (nxrIdx > 1) {
            name = cleaned.slice(0, nxrIdx).replace(/[-–—:|]+$/, '').trim();
            rawTarget = cleaned.slice(nxrIdx).trim();
        }
    }

    const parsed = parseTargetAndRests(rawTarget);
    return {
        name,
        target: parsed.cleanTarget,
        rests: parsed.rests,
        progression: Array(getProgramWeekCount()).fill(parsed.cleanTarget),
        restsByWeek: null,
        week0Target: null,
        hasWeeklyProg: false,
    };
}

function buildExerciseObjectFromParsed(id, parsed) {
    const fallbackTarget = parsed.target || parsed.progression?.[0] || '3x10';
    const sourceProgression = Array.isArray(parsed.progression) && parsed.progression.length > 0
        ? parsed.progression
        : [fallbackTarget];
    const progression = Array.from({ length: getProgramWeekCount() }, (_, idx) =>
        sourceProgression[idx] || sourceProgression[idx - 1] || sourceProgression[sourceProgression.length - 1] || fallbackTarget
    );
    const ex = {
        id,
        name: parsed.name,
        progression,
    };
    if (parsed.week0Target) ex.week0Target = parsed.week0Target;
    if (parsed.restsByWeek && Object.keys(parsed.restsByWeek).length > 0) {
        ex.restsByWeek = parsed.restsByWeek;
    } else if (Array.isArray(parsed.rests) && parsed.rests.length > 0) {
        ex.rests = parsed.rests;
    }
    if (parsed.coachNote && String(parsed.coachNote).trim()) {
        ex.coachNote = String(parsed.coachNote).trim();
    }
    return ex;
}

function saveBulkExercises() {
    const text = document.getElementById('bulk-text').value;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) return;

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser?.days.find(d => d.id === tempTargetDayId);
    if (!day) return;
    const baseTs = Date.now();

    lines.forEach((line, index) => {
        const parsed = parseExerciseLine(line);
        day.exercises.push(buildExerciseObjectFromParsed(`e_bulk_${baseTs}_${index}`, parsed));
    });

    document.getElementById('bulk-text').value = '';
    saveData();
    closeModal('bulk-add-modal');
    renderApp();
}

function deleteEx(dayId, exId) {
    if (!confirm('Togliere questo esercizio?')) return;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser?.days.find(d => d.id === dayId);
    if (!day) return;
    day.exercises = day.exercises.filter(e => e.id !== exId);
    cleanupExerciseLogs(currentUser.id, dayId, exId);
    saveData();
    renderApp();
}

function openEditEx(dayId, exId) {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser?.days.find(d => d.id === dayId);
    const ex = day?.exercises.find(e => e.id === exId);
    if (!ex) return;

    tempEditDayId = dayId;
    tempEditExId = exId;
    tempEditScope = 'only';

    const rawTarget = getRawTargetForWeek(ex, appState.week);
    const parsed = parseTargetAndRests(rawTarget);
    const initialRests = getRestsForWeek(ex, appState.week);

    document.getElementById('edit-ex-name').value = ex.name;
    document.getElementById('edit-ex-coach-note').value = ex.coachNote || '';
    document.getElementById('edit-ex-target').value = parsed.cleanTarget;
    document.getElementById('edit-ex-week-label').textContent = appState.week === 0 ? '0 - Prova' : appState.week;

    // Aggiorna etichette pillole scope rapido
    document.getElementById('edit-scope-only-label').textContent = appState.week === 0 ? 'Solo S0' : `Solo S${appState.week}`;
    document.getElementById('edit-scope-from-label').textContent = appState.week === 0 ? `S0 + S1–S${getProgramWeekCount()}` : `Da S${appState.week} in poi`;
    document.querySelectorAll('#edit-ex-scope-group [data-edit-scope]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.editScope === 'only');
    });

    const baseTargets = [];
    const baseRests = [];
    for (let w = 1; w <= getProgramWeekCount(); w++) {
        baseTargets.push(parseTargetAndRests(getRawTargetForWeek(ex, w)).cleanTarget);
        baseRests.push(getRestsForWeek(ex, w));
    }

    _modalProgDraft.edit = {
        open: false,
        touched: false,
        baseTargets,
        baseRests,
        targets: [...baseTargets],
        rests: baseRests.map(r => [...r]),
    };

    renderRestInputs('edit', initialRests);
    setProgAccordionOpen('edit', false);
    updateProgBadge('edit');
    openModal('edit-ex-modal');
}

function saveEditEx() {
    const newName = document.getElementById('edit-ex-name').value.trim();
    const rawTarget = document.getElementById('edit-ex-target').value.trim() || '3x10';
    if (!newName) return;

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser?.days.find(d => d.id === tempEditDayId);
    const ex = day?.exercises.find(e => e.id === tempEditExId);
    if (!ex) return;

    ex.name = newName;
    const coachNote = (document.getElementById('edit-ex-coach-note')?.value || '').trim().slice(0, 220);
    if (coachNote) ex.coachNote = coachNote;
    else delete ex.coachNote;

    const parsed = parseTargetAndRests(rawTarget);
    const manualRests = collectRestInputs('edit');
    const finalRests = manualRests.length > 0 ? manualRests : parsed.rests;
    const draft = _modalProgDraft.edit;

    if (draft && (draft.open || draft.touched)) {
        const opts = {};
        if (appState.week === 0) {
            opts.week0Target = parsed.cleanTarget;
            opts.week0Rests = finalRests;
        }
        applyProgressionAndRestsToExercise(ex, draft.targets, draft.rests, opts);
    } else {
        const weekCount = draft ? draft.baseTargets.length : getProgramWeekCount();
        const targets = draft ? [...draft.baseTargets] : Array(weekCount).fill(parsed.cleanTarget);
        const rests = draft ? draft.baseRests.map(r => [...r]) : Array.from({ length: weekCount }, () => []);
        const opts = {};

        if (tempEditScope === 'all') {
            for (let i = 0; i < weekCount; i++) {
                targets[i] = parsed.cleanTarget;
                rests[i] = [...finalRests];
            }
            opts.clearWeek0 = true;
        } else if (tempEditScope === 'from') {
            const startIdx = appState.week === 0 ? 0 : Math.max(0, appState.week - 1);
            for (let i = startIdx; i < weekCount; i++) {
                targets[i] = parsed.cleanTarget;
                rests[i] = [...finalRests];
            }
            if (appState.week === 0) opts.clearWeek0 = true;
        } else {
            if (appState.week === 0) {
                opts.week0Target = parsed.cleanTarget;
                opts.week0Rests = finalRests;
            } else {
                const idx = Math.max(0, appState.week - 1);
                targets[idx] = parsed.cleanTarget;
                rests[idx] = [...finalRests];
            }
        }

        applyProgressionAndRestsToExercise(ex, targets, rests, opts);
    }

    saveData();
    closeModal('edit-ex-modal');
    renderApp();
}

// ============================================================
//  IMPORTAZIONE SCHEDA COMPLETA (TESTO + AI PDF GEMINI)
// ============================================================
function openImportPlanModal() {
    setupPdfDropzone();
    document.getElementById('import-plan-text').value = '';
    _parsedImportDays = [];
    resetPdfImportState();
    switchImportPlanTab('text');
    openModal('import-plan-modal');
}

function closeImportPlanModal() {
    _pdfParseReqId += 1; // invalida eventuali chiamate AI ancora in volo
    _pdfParsingInFlight = false;
    setPdfLoadingUi(false);
    closeModal('import-plan-modal');
}

function switchImportPlanTab(tab) {
    _importPlanTab = tab === 'pdf' ? 'pdf' : 'text';

    const btnText = document.getElementById('import-tab-btn-text');
    const btnPdf = document.getElementById('import-tab-btn-pdf');
    const panelText = document.getElementById('import-tab-text');
    const panelPdf = document.getElementById('import-tab-pdf');

    const isPdf = _importPlanTab === 'pdf';
    if (btnText) {
        btnText.classList.toggle('active', !isPdf);
        btnText.setAttribute('aria-selected', isPdf ? 'false' : 'true');
    }
    if (btnPdf) {
        btnPdf.classList.toggle('active', isPdf);
        btnPdf.setAttribute('aria-selected', isPdf ? 'true' : 'false');
    }
    if (panelText) panelText.classList.toggle('hidden', isPdf);
    if (panelPdf) panelPdf.classList.toggle('hidden', !isPdf);

    if (isPdf) {
        _parsedImportDays = _pdfParsedDays;
        renderImportPlanPreviewList(_parsedImportDays, 'pdf');
    } else {
        updateImportPlanPreview();
    }
}

function resetPdfImportState() {
    _aiSelectedFiles = [];
    _pdfParsedDays = [];
    _pdfParsingInFlight = false;
    if (_importPlanTab === 'pdf') _parsedImportDays = [];

    const pdfInput = document.getElementById('import-pdf-file');
    const photoInput = document.getElementById('import-photo-file');
    if (pdfInput) pdfInput.value = '';
    if (photoInput) photoInput.value = '';

    document.getElementById('pdf-dropzone')?.classList.remove('hidden');
    document.getElementById('pdf-dropzone-area')?.classList.remove('is-dragover');
    document.getElementById('pdf-selected-card')?.classList.add('hidden');
    const thumbs = document.getElementById('ai-thumbs-strip');
    if (thumbs) {
        thumbs.innerHTML = '';
        thumbs.classList.add('hidden');
    }
    setPdfLoadingUi(false);
    setPdfError('');
    setPdfSuccess('');
    if (_importPlanTab === 'pdf') {
        renderImportPlanPreviewList([], 'pdf');
    }
}

function setupPdfDropzone() {
    if (_pdfDropzoneBound) return;
    const dropzone = document.getElementById('pdf-dropzone-area');
    if (!dropzone) return;
    _pdfDropzoneBound = true;

    ['dragenter', 'dragover'].forEach(evName => {
        dropzone.addEventListener(evName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('is-dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evName => {
        dropzone.addEventListener(evName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('is-dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length > 0) processSelectedAiFiles(files);
    });

    dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('import-photo-file')?.click();
        }
    });
}

function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function setPdfError(message) {
    const box = document.getElementById('pdf-error-box');
    const txt = document.getElementById('pdf-error-text');
    if (!box || !txt) return;
    if (!message) {
        box.classList.add('hidden');
        txt.textContent = '';
    } else {
        txt.textContent = message;
        box.classList.remove('hidden');
    }
}

function setPdfSuccess(message) {
    const box = document.getElementById('pdf-success-box');
    const txt = document.getElementById('pdf-success-text');
    if (!box || !txt) return;
    if (!message) {
        box.classList.add('hidden');
        txt.textContent = '';
    } else {
        txt.textContent = message;
        box.classList.remove('hidden');
    }
}

function setPdfLoadingUi(isLoading) {
    const box = document.getElementById('pdf-loading-state');
    const analyzeBtn = document.getElementById('pdf-analyze-btn');
    const changeBtn = document.getElementById('pdf-change-btn');
    const importBtn = document.getElementById('import-plan-btn');

    if (box) box.classList.toggle('hidden', !isLoading);
    if (analyzeBtn) {
        analyzeBtn.disabled = isLoading;
        analyzeBtn.textContent = isLoading ? 'Analizzo...' : 'Analizza AI';
    }
    if (changeBtn) changeBtn.disabled = isLoading;
    if (importBtn && isLoading) importBtn.disabled = true;

    document.querySelectorAll('#ai-thumbs-strip button').forEach(btn => {
        btn.disabled = isLoading;
    });
}

function handleAiFilesSelected(event, sourceMode = 'auto') {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    processSelectedAiFiles(files, sourceMode);
}

function isPdfFile(file) {
    return file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name || ''));
}

function isImageFile(file) {
    return file && (
        (typeof file.type === 'string' && file.type.startsWith('image/')) ||
        /\.(jpe?g|png|webp|heic|heif|bmp|gif)$/i.test(file.name || '')
    );
}

// Comprime e ridimensiona la foto lato client mantenendo nitide le tabelle della scheda
async function compressImageFile(file, maxDim = 1800, maxTargetBytes = 900 * 1024) {
    let source = null;
    let width = 0;
    let height = 0;
    let objectUrl = null;

    try {
        if (typeof createImageBitmap === 'function') {
            source = await createImageBitmap(file);
            width = source.width;
            height = source.height;
        } else {
            objectUrl = URL.createObjectURL(file);
            source = await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Impossibile decodificare l\'immagine.'));
                img.src = objectUrl;
            });
            width = source.naturalWidth || source.width;
            height = source.naturalHeight || source.height;
        }

        if (!width || !height) {
            throw new Error('Immagine vuota o corrotta.');
        }

        const scale = Math.min(1, maxDim / Math.max(width, height));
        const targetW = Math.max(1, Math.round(width * scale));
        const targetH = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas non disponibile sul dispositivo.');

        // Sfondo bianco per evitare PNG trasparenti con testo scuro illeggibile in JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(source, 0, 0, targetW, targetH);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
        let byteLength = Math.floor((base64.length * 3) / 4);

        // Se supera il budget per singola foto, abbassa leggermente la qualità
        while (byteLength > maxTargetBytes && quality > 0.55) {
            quality = Number((quality - 0.1).toFixed(2));
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
            byteLength = Math.floor((base64.length * 3) / 4);
        }

        const cleanName = (file.name || 'foto_scheda.jpg').replace(/\.[^.]+$/, '') + '.jpg';
        return {
            kind: 'image',
            name: cleanName,
            mimeType: 'image/jpeg',
            base64,
            byteLength,
            previewUrl: dataUrl,
        };
    } catch (_) {
        throw new Error(`Impossibile leggere "${file.name || 'la foto'}". Usa un'immagine JPG, PNG o WebP.`);
    } finally {
        if (source && typeof source.close === 'function') source.close();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
}

async function processSelectedAiFiles(files, sourceMode = 'auto') {
    setPdfError('');
    setPdfSuccess('');
    _pdfParsedDays = [];
    if (_importPlanTab === 'pdf') _parsedImportDays = [];

    const pdfCandidate = files.find(isPdfFile);
    const imageCandidates = files.filter(isImageFile);

    if (sourceMode === 'pdf' || (pdfCandidate && imageCandidates.length === 0)) {
        const file = pdfCandidate || files[0];
        if (!isPdfFile(file)) {
            setPdfError('Seleziona un file in formato PDF (.pdf).');
            renderImportPlanPreviewList([], 'pdf');
            return;
        }
        if (file.size === 0) {
            setPdfError('Il file PDF selezionato è vuoto.');
            renderImportPlanPreviewList([], 'pdf');
            return;
        }
        if (file.size > MAX_PDF_IMPORT_BYTES) {
            setPdfError(`Il PDF pesa ${formatFileSize(file.size)} e supera il limite massimo di 3 MB. Prova a comprimerlo prima di caricarlo.`);
            renderImportPlanPreviewList([], 'pdf');
            return;
        }

        _aiSelectedFiles = [{
            kind: 'pdf',
            file,
            name: file.name || 'scheda.pdf',
            mimeType: 'application/pdf',
            byteLength: file.size,
        }];
        renderSelectedAiFiles();
        renderImportPlanPreviewList([], 'pdf');
        return;
    }

    if (imageCandidates.length === 0) {
        setPdfError('Formato non supportato. Seleziona un PDF oppure una o più foto (JPG, PNG, WebP).');
        renderImportPlanPreviewList([], 'pdf');
        return;
    }

    // Se ci sono già foto selezionate le accodiamo fino a MAX_AI_IMAGES; se c'era un PDF lo sostituiamo
    const existingImages = _aiSelectedFiles.every(f => f.kind === 'image') ? [..._aiSelectedFiles] : [];
    const availableSlots = MAX_AI_IMAGES - existingImages.length;
    if (availableSlots <= 0) {
        setPdfError(`Hai già raggiunto il massimo di ${MAX_AI_IMAGES} foto per analisi.`);
        return;
    }

    const toProcess = imageCandidates.slice(0, availableSlots);
    const ignoredCount = imageCandidates.length - toProcess.length;
    const projectedCount = existingImages.length + toProcess.length;
    const maxDim = projectedCount > 2 ? 1500 : 1800;
    const perPhotoBudget = Math.floor((MAX_PDF_IMPORT_BYTES * 0.9) / Math.max(1, projectedCount));

    try {
        const compressed = [];
        for (const imgFile of toProcess) {
            if (imgFile.size === 0) continue;
            compressed.push(await compressImageFile(imgFile, maxDim, perPhotoBudget));
        }

        if (compressed.length === 0) {
            setPdfError('Le immagini selezionate sembrano vuote.');
            return;
        }

        const nextList = [...existingImages, ...compressed];
        const totalBytes = nextList.reduce((acc, f) => acc + f.byteLength, 0);
        if (totalBytes > MAX_PDF_IMPORT_BYTES) {
            setPdfError(`Le foto superano i 3 MB totali (${formatFileSize(totalBytes)}). Rimuovi una foto o carica meno pagine alla volta.`);
            return;
        }

        _aiSelectedFiles = nextList;
        if (ignoredCount > 0) {
            setPdfError(`Sono state aggiunte solo le prime ${toProcess.length} foto (limite massimo: ${MAX_AI_IMAGES}).`);
        }
        renderSelectedAiFiles();
        renderImportPlanPreviewList([], 'pdf');
    } catch (err) {
        setPdfError(err?.message || 'Errore durante la preparazione della foto.');
    }
}

function removeAiSelectedFile(index) {
    if (_pdfParsingInFlight) return;
    _aiSelectedFiles.splice(index, 1);
    _pdfParsedDays = [];
    if (_importPlanTab === 'pdf') _parsedImportDays = [];
    setPdfError('');
    setPdfSuccess('');

    if (_aiSelectedFiles.length === 0) {
        resetPdfImportState();
    } else {
        renderSelectedAiFiles();
        renderImportPlanPreviewList([], 'pdf');
    }
}

function renderSelectedAiFiles() {
    const dropzone = document.getElementById('pdf-dropzone');
    const cardWrap = document.getElementById('pdf-selected-card');
    const badgeEl = document.getElementById('pdf-selected-badge');
    const nameEl = document.getElementById('pdf-selected-name');
    const sizeEl = document.getElementById('pdf-selected-size');
    const thumbsEl = document.getElementById('ai-thumbs-strip');

    if (_aiSelectedFiles.length === 0) {
        dropzone?.classList.remove('hidden');
        cardWrap?.classList.add('hidden');
        if (thumbsEl) thumbsEl.classList.add('hidden');
        return;
    }

    const totalBytes = _aiSelectedFiles.reduce((acc, f) => acc + (f.byteLength || 0), 0);
    const isPdf = _aiSelectedFiles[0].kind === 'pdf';

    if (badgeEl) badgeEl.textContent = isPdf ? 'PDF' : 'IMG';
    if (nameEl) {
        nameEl.textContent = isPdf
            ? _aiSelectedFiles[0].name
            : (_aiSelectedFiles.length === 1
                ? _aiSelectedFiles[0].name
                : `${_aiSelectedFiles.length} foto selezionate`);
    }
    if (sizeEl) {
        sizeEl.textContent = isPdf
            ? formatFileSize(totalBytes)
            : `${formatFileSize(totalBytes)} · ottimizzate`;
    }

    if (thumbsEl) {
        if (isPdf) {
            thumbsEl.innerHTML = '';
            thumbsEl.classList.add('hidden');
        } else {
            const thumbsHtml = _aiSelectedFiles.map((item, idx) => `
                <div class="ai-thumb-item">
                    <img src="${item.previewUrl}" alt="Foto ${idx + 1}">
                    <button type="button" data-action="remove-ai-file" data-file-index="${idx}" class="ai-thumb-remove" title="Rimuovi foto">×</button>
                </div>
            `).join('');

            const addMoreHtml = _aiSelectedFiles.length < MAX_AI_IMAGES
                ? `<button type="button" data-action="add-more-photos" class="ai-thumb-add" title="Aggiungi un'altra foto">
                       ${UI_SVG.plus}
                       <span>Foto</span>
                   </button>`
                : '';

            thumbsEl.innerHTML = thumbsHtml + addMoreHtml;
            thumbsEl.classList.remove('hidden');
        }
    }

    dropzone?.classList.add('hidden');
    cardWrap?.classList.remove('hidden');
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const res = String(reader.result || '');
            const commaIdx = res.indexOf(',');
            resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
        };
        reader.onerror = () => reject(new Error('Impossibile leggere il file dal dispositivo.'));
        reader.readAsDataURL(file);
    });
}

async function analyzePdfWithAi() {
    if (_aiSelectedFiles.length === 0 || _pdfParsingInFlight) return;

    if (!navigator.onLine) {
        setPdfError('Sei offline. Serve una connessione internet per analizzare la scheda con Gemini AI.');
        return;
    }

    const reqId = ++_pdfParseReqId;
    _pdfParsingInFlight = true;
    _pdfParsedDays = [];
    _parsedImportDays = [];
    setPdfError('');
    setPdfSuccess('');
    setPdfLoadingUi(true);
    renderImportPlanPreviewList([], 'pdf');

    try {
        const preparedFiles = [];
        for (const item of _aiSelectedFiles) {
            if (item.kind === 'pdf') {
                const base64 = await readFileAsBase64(item.file);
                preparedFiles.push({
                    base64,
                    mimeType: 'application/pdf',
                    fileName: item.name,
                });
            } else {
                preparedFiles.push({
                    base64: item.base64,
                    mimeType: item.mimeType || 'image/jpeg',
                    fileName: item.name,
                });
            }
        }

        if (reqId !== _pdfParseReqId) return;

        const res = await fetch('/api/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: preparedFiles,
                fileName: preparedFiles[0]?.fileName || 'scheda',
            }),
        });

        if (reqId !== _pdfParseReqId) return;

        let data = null;
        try {
            data = await res.json();
        } catch (_) {
            data = null;
        }

        if (!res.ok) {
            if (res.status === 413) {
                throw new Error('I file sono troppo pesanti per il server (max 3 MB totali).');
            }
            if (res.status === 504) {
                throw new Error('Tempo scaduto durante l\'analisi AI. Prova con meno pagine o un file più leggero.');
            }
            throw new Error(data?.error || `Errore server AI (codice ${res.status}).`);
        }

        const days = Array.isArray(data?.days) ? data.days : [];
        if (days.length === 0) {
            throw new Error('Nessun giorno o esercizio trovato in questo file.');
        }

        _pdfParsedDays = days;
        const totalEx = days.reduce((acc, d) => acc + (d.exercises?.length || 0), 0);
        setPdfSuccess(`Estratti ${days.length} giorni e ${totalEx} esercizi. Controlla l'anteprima qui sotto e conferma l'importazione.`);

        if (_importPlanTab === 'pdf') {
            _parsedImportDays = _pdfParsedDays;
            renderImportPlanPreviewList(_parsedImportDays, 'pdf');
        }
    } catch (err) {
        if (reqId !== _pdfParseReqId) return;
        const msg = (err && err.message) ? err.message : 'Errore imprevisto durante l\'analisi AI.';
        setPdfError(msg);
        if (_importPlanTab === 'pdf') {
            renderImportPlanPreviewList([], 'pdf');
        }
    } finally {
        if (reqId === _pdfParseReqId) {
            _pdfParsingInFlight = false;
            setPdfLoadingUi(false);
            if (_importPlanTab === 'pdf') {
                renderImportPlanPreviewList(_parsedImportDays, 'pdf');
            }
        }
    }
}

function parseFullWorkoutPlan(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '' && !/^[-=_*]{3,}$/.test(l));
    const days = [];
    let currentDay = null;

    const isExplicitDayHeader = (line) => {
        if (/^#{1,4}\s+/.test(line)) return true;
        if (/^(giorno|day|scheda|allenamento|sessione|workout|split|luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica)\b/i.test(line)) return true;
        if (/^[A-Z]\s*[\)\:\-]\s+[A-Za-zÀ-ÿ]/.test(line) && !/\d\s*[x×]\s*\d/i.test(line)) return true;
        return false;
    };

    lines.forEach(line => {
        const hasNxR = /\d\s*[x×]\s*\d/i.test(line);
        if (isExplicitDayHeader(line) || (!hasNxR && !line.includes('-') && line.length <= 42 && (currentDay === null || currentDay.exercises.length > 0))) {
            const cleanTitle = line.replace(/^#{1,4}\s*/, '').replace(/^\*\*|\*\*$/g, '').replace(/:$/, '').trim();
            currentDay = { name: cleanTitle, icon: detectDayIcon(cleanTitle), exercises: [] };
            days.push(currentDay);
        } else {
            if (!currentDay) {
                currentDay = { name: 'Giorno 1', icon: 'dumbbell', exercises: [] };
                days.push(currentDay);
            }
            const parsedEx = parseExerciseLine(line);
            if (parsedEx.name) currentDay.exercises.push(parsedEx);
        }
    });

    return days.filter(d => d.exercises.length > 0 || days.length === 1);
}

function renderImportPlanPreviewList(days, mode = 'text') {
    const preview = document.getElementById('import-plan-preview');
    const btn = document.getElementById('import-plan-btn');
    if (!preview || !btn) return;

    if (!Array.isArray(days) || days.length === 0) {
        if (mode === 'pdf') {
            const placeholder = _pdfParsingInFlight
                ? 'Lettura della scheda con AI in corso...'
                : (_aiSelectedFiles.length > 0
                    ? 'Premi "Analizza AI" per estrarre la scheda in anteprima.'
                    : 'Carica una foto, uno screenshot o un PDF sopra per vedere qui l\'anteprima estratta dall\'AI.');
            preview.innerHTML = `<p class="text-dim italic text-center py-4">${placeholder}</p>`;
        } else {
            const hasText = document.getElementById('import-plan-text')?.value.trim();
            preview.innerHTML = `<p class="text-dim italic text-center py-4">${hasText ? 'Nessun giorno riconosciuto.' : 'Incolla la scheda sopra per vedere l\'anteprima...'}</p>`;
        }
        btn.disabled = true;
        btn.textContent = 'Importa Scheda';
        return;
    }

    const totalEx = days.reduce((acc, d) => acc + (d.exercises?.length || 0), 0);

    preview.innerHTML = days.map(d => `
        <div class="mb-3 last:mb-0 pb-2.5 last:pb-0 border-b last:border-b-0 border-app">
            <div class="flex items-center gap-2 font-extrabold text-app mb-1.5">
                <span class="brand-text">${DAY_ICONS[d.icon]?.svg || DAY_ICONS.dumbbell.svg}</span>
                <span>${escapeHtml(d.name)}</span>
                <span class="text-[10px] font-bold text-dim ml-auto">${d.exercises.length} es.</span>
            </div>
            <div class="space-y-1.5 pl-6">
                ${d.exercises.map(ex => {
                    const coachNotePreview = ex.coachNote
                        ? `<div class="import-coach-note">${escapeHtml(ex.coachNote)}</div>`
                        : '';
                    if (ex.hasWeeklyProg) {
                        const groups = summarizeWeeklyProgression(ex);
                        const w0Rests = getRestsForWeek(ex, 0);
                        const w0Pill = ex.week0Target
                            ? `<span class="import-prog-pill"><strong>S0</strong> ${escapeHtml(formatTargetWithRests(ex.week0Target, w0Rests))}</span>`
                            : '';
                        return `<div class="text-[11px]">
                            <div class="font-semibold text-app truncate">${escapeHtml(ex.name)}</div>
                            ${coachNotePreview}
                            <div class="import-prog-list">
                                ${w0Pill}
                                ${groups.map(g => `<span class="import-prog-pill"><strong>${escapeHtml(g.label)}</strong> ${escapeHtml(g.text)}</span>`).join('')}
                            </div>
                        </div>`;
                    }
                    const restsClean = Array.isArray(ex.rests) ? ex.rests.filter(Boolean) : [];
                    const restTag = restsClean.length ? ` <span class="text-dim">(${escapeHtml(restsClean.join(' / '))})</span>` : '';
                    return `<div class="text-[11px]">
                        <div class="flex justify-between gap-2">
                            <span class="text-muted truncate">${escapeHtml(ex.name)}</span>
                            <span class="font-bold brand-text flex-shrink-0">${escapeHtml(ex.target)}${restTag}</span>
                        </div>
                        ${coachNotePreview}
                    </div>`;
                }).join('')}
            </div>
        </div>
    `).join('');

    btn.disabled = _pdfParsingInFlight;
    btn.textContent = `Importa ${days.length} giorni (${totalEx} esercizi)`;
}

function updateImportPlanPreview() {
    const text = document.getElementById('import-plan-text').value;
    if (!text.trim()) {
        _parsedImportDays = [];
        renderImportPlanPreviewList([], 'text');
        return;
    }

    _parsedImportDays = parseFullWorkoutPlan(text);
    renderImportPlanPreviewList(_parsedImportDays, 'text');
}

function executeImportPlan() {
    if (_parsedImportDays.length === 0 || _pdfParsingInFlight) return;
    const currentUser = ensureCurrentUser();
    const baseTs = Date.now();
    let firstNewId = null;

    _parsedImportDays.forEach((d, dIdx) => {
        const dayId = `d_imp_${baseTs}_${dIdx}`;
        if (!firstNewId) firstNewId = dayId;
        currentUser.days.push({
            id: dayId,
            name: d.name,
            icon: d.icon,
            isOpen: dIdx === 0,
            exercises: d.exercises.map((ex, eIdx) =>
                buildExerciseObjectFromParsed(`e_imp_${baseTs}_${dIdx}_${eIdx}`, ex)
            )
        });
    });

    activeDayId = firstNewId;
    saveData();
    closeImportPlanModal();
    switchTab('workout');
    renderApp();
}
// ============================================================
//  LOGS & SETTIMANE (0..6, input debounced 500ms + change/blur)
// ============================================================
function toggleDone(logKey, isChecked) {
    if (!appState.logs[logKey]) appState.logs[logKey] = { weights: [] };
    appState.logs[logKey].done = isChecked;

    if (isChecked) {
        _justCompletedLogKey = logKey;
        if (navigator.vibrate) navigator.vibrate(18);
    } else {
        _justCompletedLogKey = null;
    }

    saveData();
    renderApp();

    // Resetta subito il flag così eventuali re-render successivi non ripetono il flash
    _justCompletedLogKey = null;

    if (isChecked) {
        if (_justCompletedClearTimer) clearTimeout(_justCompletedClearTimer);
        _justCompletedClearTimer = setTimeout(() => {
            const card = document.querySelector(`[data-ex-card-key="${CSS.escape(logKey)}"]`);
            if (card) card.classList.remove('just-completed');
            _justCompletedClearTimer = null;
        }, 900);
    }
}

function applyWeightValueInMemory(logKey, value, index) {
    if (!appState.logs[logKey]) appState.logs[logKey] = { done: false, weights: [], up: false };
    if (!Array.isArray(appState.logs[logKey].weights)) appState.logs[logKey].weights = [];
    const prevVal = appState.logs[logKey].weights[index] ?? '';
    const nextVal = String(value ?? '');
    const changed = String(prevVal) !== nextVal;

    appState.logs[logKey].weights[index] = nextVal;
    if (appState.logs[logKey].carried && changed) {
        appState.logs[logKey].carried = false;
        const badge = document.querySelector(`[data-carried-for="${CSS.escape(logKey)}"]`);
        if (badge) badge.remove();
    }
    return changed;
}

function handleWeightInputDebounced(inputEl) {
    const logKey = inputEl.dataset.logKey;
    const index = parseInt(inputEl.dataset.blockIndex, 10);
    if (!logKey || isNaN(index)) return;

    applyWeightValueInMemory(logKey, inputEl.value, index);
    _hasPendingWeightInput = true;

    if (_weightInputDebounceTimer) clearTimeout(_weightInputDebounceTimer);
    _weightInputDebounceTimer = setTimeout(() => {
        _weightInputDebounceTimer = null;
        _hasPendingWeightInput = false;
        saveData();
    }, WEIGHT_INPUT_DEBOUNCE_MS);
}

function commitWeightInput(inputEl) {
    const logKey = inputEl.dataset.logKey;
    const index = parseInt(inputEl.dataset.blockIndex, 10);
    if (!logKey || isNaN(index)) return;

    const changed = applyWeightValueInMemory(logKey, inputEl.value, index);
    if (_weightInputDebounceTimer) {
        clearTimeout(_weightInputDebounceTimer);
        _weightInputDebounceTimer = null;
    }
    if (changed || _hasPendingWeightInput) {
        _hasPendingWeightInput = false;
        saveData();
    }
}

function toggleExerciseNote(logKey) {
    if (!logKey) return;
    const esc = CSS.escape(logKey);
    const drawer = document.querySelector(`[data-note-drawer-for="${esc}"]`);
    const btn = document.querySelector(`[data-note-btn-for="${esc}"]`);
    const willOpen = !_openNoteKeys.has(logKey);

    if (willOpen) _openNoteKeys.add(logKey);
    else _openNoteKeys.delete(logKey);

    if (drawer) drawer.classList.toggle('open', willOpen);
    if (btn) {
        btn.classList.toggle('active', willOpen);
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    if (willOpen && drawer) {
        const ta = drawer.querySelector('textarea[data-note-input="1"]');
        if (ta) {
            setTimeout(() => {
                ta.focus();
                ta.setSelectionRange(ta.value.length, ta.value.length);
            }, 60);
        }
    }
}

function applyNoteValueInMemory(logKey, rawValue) {
    const nextRaw = String(rawValue ?? '').slice(0, 280);
    const trimmed = nextRaw.trim();
    const existingLog = appState.logs[logKey];
    const prevVal = typeof existingLog?.note === 'string' ? existingLog.note : '';

    if (trimmed === '') {
        if (existingLog && Object.prototype.hasOwnProperty.call(existingLog, 'note')) {
            delete existingLog.note;
        }
    } else {
        if (!appState.logs[logKey]) appState.logs[logKey] = { done: false, weights: [], up: false };
        appState.logs[logKey].note = nextRaw;
    }

    const esc = CSS.escape(logKey);
    const hasNote = trimmed.length > 0;
    const btn = document.querySelector(`[data-note-btn-for="${esc}"]`);
    if (btn) btn.classList.toggle('has-note', hasNote);
    const clearBtn = document.querySelector(`[data-note-clear-for="${esc}"]`);
    if (clearBtn) clearBtn.classList.toggle('hidden', !hasNote);

    return prevVal !== (trimmed === '' ? '' : nextRaw);
}

function handleNoteInputDebounced(textareaEl) {
    const logKey = textareaEl.dataset.logKey;
    if (!logKey) return;

    applyNoteValueInMemory(logKey, textareaEl.value);
    _hasPendingNoteInput = true;

    if (_noteInputDebounceTimer) clearTimeout(_noteInputDebounceTimer);
    _noteInputDebounceTimer = setTimeout(() => {
        _noteInputDebounceTimer = null;
        _hasPendingNoteInput = false;
        saveData();
    }, WEIGHT_INPUT_DEBOUNCE_MS);
}

function commitNoteInput(textareaEl) {
    const logKey = textareaEl.dataset.logKey;
    if (!logKey) return;

    const trimmed = String(textareaEl.value ?? '').trim().slice(0, 280);
    if (textareaEl.value !== trimmed) textareaEl.value = trimmed;

    const changed = applyNoteValueInMemory(logKey, trimmed);
    if (_noteInputDebounceTimer) {
        clearTimeout(_noteInputDebounceTimer);
        _noteInputDebounceTimer = null;
    }
    if (changed || _hasPendingNoteInput) {
        _hasPendingNoteInput = false;
        saveData();
    }
}

function clearExerciseNote(logKey) {
    if (!logKey) return;
    if (_noteInputDebounceTimer) {
        clearTimeout(_noteInputDebounceTimer);
        _noteInputDebounceTimer = null;
    }
    _hasPendingNoteInput = false;

    const changed = applyNoteValueInMemory(logKey, '');
    const esc = CSS.escape(logKey);
    const drawer = document.querySelector(`[data-note-drawer-for="${esc}"]`);
    const ta = drawer?.querySelector('textarea[data-note-input="1"]');
    if (ta) ta.value = '';

    _openNoteKeys.delete(logKey);
    if (drawer) drawer.classList.remove('open');
    const btn = document.querySelector(`[data-note-btn-for="${esc}"]`);
    if (btn) {
        btn.classList.remove('active', 'has-note');
        btn.setAttribute('aria-expanded', 'false');
    }

    if (changed) saveData();
}

function toggleUpFlag(logKey) {
    if (!appState.logs[logKey]) appState.logs[logKey] = { weights: [] };
    appState.logs[logKey].up = !appState.logs[logKey].up;
    saveData();
    renderApp();
}

function changeWeek(delta) {
    const newWeek = appState.week + delta;
    if (newWeek >= 0 && newWeek <= getProgramWeekCount()) {
        _openNoteKeys.clear();
        appState.week = newWeek;
        saveData();
        renderApp();
    }
}

function jumpToWeek(weekNum) {
    if (weekNum >= 0 && weekNum <= getProgramWeekCount()) {
        _openNoteKeys.clear();
        appState.week = weekNum;
        saveData();
        renderApp();
    }
}

// ============================================================
//  VISTA PESO CORPOREO + OBIETTIVO STELLA SVG (S1–S9 configurabili + S0 opz.)
// ============================================================
function getUserWeights() {
    if (!appState.currentUserId) return {};
    return appState.bodyWeight[appState.currentUserId] || {};
}

function getUserWeightGoal() {
    if (!appState.currentUserId || !appState.bodyWeightGoal) return null;
    const g = appState.bodyWeightGoal[appState.currentUserId];
    return (typeof g === 'number' && !isNaN(g)) ? g : null;
}

function setUserWeight(weekKey, value) {
    if (!appState.currentUserId) return;
    if (!appState.bodyWeight[appState.currentUserId]) appState.bodyWeight[appState.currentUserId] = {};
    if (value === '' || value == null || isNaN(parseFloat(value))) {
        delete appState.bodyWeight[appState.currentUserId][weekKey];
    } else {
        appState.bodyWeight[appState.currentUserId][weekKey] = parseFloat(value);
    }
}

function setUserWeightGoal(value) {
    if (!appState.currentUserId) return;
    if (!appState.bodyWeightGoal) appState.bodyWeightGoal = {};
    if (value === '' || value == null || isNaN(parseFloat(value))) {
        delete appState.bodyWeightGoal[appState.currentUserId];
    } else {
        appState.bodyWeightGoal[appState.currentUserId] = parseFloat(value);
    }
}

function renderWeightView() {
    const weights = getUserWeights();
    const goal = getUserWeightGoal();
    const curW = weights['w' + appState.week];

    document.getElementById('weight-week-label').textContent = appState.week === 0 ? '0 (Prova)' : String(appState.week);
    document.getElementById('weight-week-label-2').textContent = String(appState.week);
    document.getElementById('weight-input').value = curW != null ? curW : '';
    document.getElementById('weight-goal-input').value = goal != null ? goal : '';

    let latest = curW;
    if (latest == null) {
        for (let w = getProgramWeekCount(); w >= 0; w--) {
            if (weights['w' + w] != null) { latest = weights['w' + w]; break; }
        }
    }

    document.getElementById('kpi-weight-current').textContent = latest != null ? `${latest.toFixed(1)} kg` : '—';
    document.getElementById('kpi-weight-goal').textContent = goal != null ? `${goal.toFixed(1)} kg` : '—';

    const deltaEl = document.getElementById('kpi-weight-delta');
    if (goal != null && latest != null) {
        const diff = Number((goal - latest).toFixed(1));
        if (Math.abs(diff) < 0.05) {
            deltaEl.textContent = 'Target!';
            deltaEl.style.color = '#10b981';
        } else {
            deltaEl.textContent = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
            deltaEl.style.color = 'var(--text)';
        }
    } else {
        deltaEl.textContent = '—';
        deltaEl.style.color = 'var(--text-dim)';
    }

    const grid = document.getElementById('weight-weeks-grid');
    let gridHtml = '';

    // Riferimento S0 opzionale (visibile solo se sei su S0 o se hai registrato un peso in S0)
    const w0Val = weights['w0'];
    if (appState.week === 0 || w0Val != null) {
        gridHtml += `
            <button type="button" data-action="jump-week" data-week="0" class="weight-week-chip week0-chip col-span-3 sm:col-span-9 ${appState.week === 0 ? 'active' : ''}">
                <span class="text-[10.5px] font-bold ${appState.week === 0 ? 'text-amber-500' : 'text-dim'}">SETT 0 · PROVA (RIFERIMENTO)</span>
                <span class="text-sm font-extrabold tabular-nums ${w0Val != null ? 'text-app' : 'text-dim'}">${w0Val != null ? `${w0Val.toFixed(1)} kg` : '—'}</span>
            </button>
        `;
    }

    for (let w = 1; w <= getProgramWeekCount(); w++) {
        const v = weights['w' + w];
        gridHtml += `
            <button type="button" data-action="jump-week" data-week="${w}" class="weight-week-chip ${w === appState.week ? 'active' : ''}">
                <span class="text-[10px] font-bold ${w === appState.week ? 'brand-text' : 'text-dim'}">SETT ${w}</span>
                <span class="text-sm font-extrabold tabular-nums mt-0.5 ${v != null ? 'text-app' : 'text-dim'}">${v != null ? v.toFixed(1) : '—'}</span>
            </button>
        `;
    }
    grid.innerHTML = gridHtml;

    setTimeout(renderWeightChart, 40);
}

function saveWeightAndGoal() {
    if (!appState.currentUserId) {
        ensureCurrentUser();
    }
    const wVal = document.getElementById('weight-input').value.trim();
    const gVal = document.getElementById('weight-goal-input').value.trim();
    setUserWeight('w' + appState.week, wVal);
    setUserWeightGoal(gVal);
    saveData();
    renderApp();
}

function makeSvgStarPoints(cx, cy, outerR = 10, innerR = 4.4) {
    const pts = [];
    for (let k = 0; k < 10; k++) {
        const angle = -Math.PI / 2 + k * (Math.PI / 5);
        const r = k % 2 === 0 ? outerR : innerR;
        pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
    }
    return pts.join(' ');
}

function renderWeightChart() {
    const wrap = document.getElementById('weight-chart-wrap');
    if (!wrap) return;

    const data = getUserWeights();
    const goal = getUserWeightGoal();

    const styles = getComputedStyle(document.documentElement);
    const brandColor = styles.getPropertyValue('--brand-500').trim() || '#f43f5e';
    const textDim = styles.getPropertyValue('--text-dim').trim() || '#6b7280';
    const textMain = styles.getPropertyValue('--text').trim() || '#fafafa';
    const surfaceColor = styles.getPropertyValue('--surface').trim() || '#121216';
    const gridColor = styles.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.08)';

    const W = 420;
    const H = 220;
    const padL = 46;
    const padR = 24;
    const padB = 26;
    const plotW = W - padL - padR;

    const hasW0 = typeof data['w0'] === 'number' && !isNaN(data['w0']);
    const startW = hasW0 ? 0 : 1;
    const totalWeeks = getProgramWeekCount();
    const stepsCount = hasW0 ? totalWeeks : Math.max(1, totalWeeks - 1);

    const points = [];
    for (let w = startW; w <= totalWeeks; w++) {
        const v = data['w' + w];
        const idx = w - startW;
        const x = padL + 16 + (idx / stepsCount) * (plotW - 32);
        points.push({ w, x, val: (typeof v === 'number' && !isNaN(v)) ? v : null, isRef: w === 0 });
    }

    const recordedAll = points.filter(p => p.val !== null);
    const recordedMain = recordedAll.filter(p => !p.isRef);
    const refPoint = hasW0 ? points[0] : null;
    const validVals = recordedAll.map(p => p.val);

    if (validVals.length === 0) {
        const goalHtml = goal != null ? `
            <line x1="${padL}" y1="42" x2="${W - padR - 14}" y2="42" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="6 4" opacity="0.9"/>
            <rect x="${padL + 4}" y="20" width="118" height="17" rx="5" fill="rgba(245,158,11,0.16)"/>
            <text x="${padL + 10}" y="31.5" fill="#f59e0b" font-size="10" font-weight="700" font-family="Inter, sans-serif">Obiettivo ${goal.toFixed(1)} kg</text>
            <polygon points="${makeSvgStarPoints(W - padR - 4, 42, 10, 4.4)}" fill="#f59e0b" stroke="#fef3c7" stroke-width="1.2" stroke-linejoin="round"/>
        ` : '';
        wrap.innerHTML = `
            <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto max-h-[245px] block select-none">
                ${goalHtml}
                <text x="${W / 2}" y="${H / 2 + 12}" text-anchor="middle" fill="${textDim}" font-size="12" font-weight="600" font-family="Inter, sans-serif">
                    Inserisci il peso per visualizzare l'andamento
                </text>
            </svg>
        `;
        return;
    }

    const dMin = Math.min(...validVals);
    const dMax = Math.max(...validVals);
    const dSpan = dMax - dMin;

    const farThreshold = Math.max(2.5, dSpan * 1.6);
    const isGoalFarAbove = goal != null && (goal - dMax) > farThreshold;
    const isGoalFarBelow = goal != null && (dMin - goal) > farThreshold;

    let topY, botY, yMin, yMax, goalY = null, breakY = null;

    if (isGoalFarAbove) {
        goalY = 26;
        breakY = 48;
        topY = 66;
        botY = H - padB;
        const padVal = Math.max(0.4, dSpan * 0.45);
        yMin = dMin - padVal;
        yMax = dMax + padVal;
    } else if (isGoalFarBelow) {
        topY = 24;
        botY = 142;
        breakY = 158;
        goalY = 176;
        const padVal = Math.max(0.4, dSpan * 0.45);
        yMin = dMin - padVal;
        yMax = dMax + padVal;
    } else {
        topY = 28;
        botY = H - padB;
        const allVals = goal != null ? [...validVals, goal] : validVals;
        const aMin = Math.min(...allVals);
        const aMax = Math.max(...allVals);
        const padVal = Math.max(0.5, (aMax - aMin) * 0.28);
        yMin = aMin - padVal;
        yMax = aMax + padVal;
    }

    const valToY = (v) => topY + ((yMax - v) / (yMax - yMin)) * (botY - topY);
    if (goal != null && goalY === null) {
        goalY = valToY(goal);
    }

    const ticks = [yMin, (yMin + yMax) / 2, yMax];
    const gridSvg = ticks.map(tv => {
        const y = valToY(tv);
        return `
            <line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="${gridColor}" stroke-width="1"/>
            <text x="${padL - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" fill="${textDim}" font-size="10" font-weight="600" font-family="Inter, sans-serif">${tv.toFixed(1)}</text>
        `;
    }).join('');

    const breakSvg = breakY != null ? `
        <line x1="${padL}" y1="${breakY}" x2="${W - padR}" y2="${breakY}" stroke="${gridColor}" stroke-width="1" stroke-dasharray="2 4"/>
        <text x="${padL - 10}" y="${breakY + 4}" text-anchor="end" fill="${textDim}" font-size="13" font-weight="700" font-family="Inter, sans-serif">≈</text>
    ` : '';

    let goalSvg = '';
    if (goal != null && goalY != null) {
        const starX = W - padR - 4;
        const labelText = `Obiettivo ${goal.toFixed(1)} kg`;
        const pillW = labelText.length * 6.1 + 14;
        const pillY = goalY - 21 < 2 ? goalY + 5 : goalY - 21;

        goalSvg = `
            <line x1="${padL}" y1="${goalY.toFixed(1)}" x2="${(starX - 13).toFixed(1)}" y2="${goalY.toFixed(1)}"
                  stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="6 4" opacity="0.9"/>
            <rect x="${padL + 4}" y="${pillY.toFixed(1)}" width="${pillW.toFixed(0)}" height="17" rx="5" fill="rgba(245, 158, 11, 0.16)"/>
            <text x="${padL + 11}" y="${(pillY + 11.5).toFixed(1)}" fill="#f59e0b" font-size="9.5" font-weight="800" font-family="Inter, sans-serif">${labelText}</text>
            <g filter="url(#starGlow)">
                <polygon points="${makeSvgStarPoints(starX, goalY, 10, 4.4)}" fill="#f59e0b" stroke="#fef3c7" stroke-width="1.2" stroke-linejoin="round"/>
            </g>
        `;
    }

    // Curva principale S1–S-N
    const mainCoords = recordedMain.map(p => ({ ...p, y: valToY(p.val) }));
    let lineSvg = '';
    if (mainCoords.length >= 2) {
        const linePath = mainCoords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
        const areaPath = `${linePath} L ${mainCoords[mainCoords.length - 1].x.toFixed(1)} ${botY.toFixed(1)} L ${mainCoords[0].x.toFixed(1)} ${botY.toFixed(1)} Z`;
        lineSvg = `
            <path d="${areaPath}" fill="url(#weightAreaGrad)"/>
            <path d="${linePath}" fill="none" stroke="${brandColor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        `;
    }

    // Connettore tratteggiato smorzato da S0 (riferimento) al primo punto S1–S-N
    let refSvg = '';
    if (refPoint && refPoint.val !== null) {
        const ry = valToY(refPoint.val);
        const isActive = appState.week === 0;
        const refColor = isActive ? '#f59e0b' : textDim;
        const labelY = ry - 11 < topY - 4 ? ry + 18 : ry - 10;

        if (mainCoords.length > 0) {
            refSvg += `<line x1="${refPoint.x.toFixed(1)}" y1="${ry.toFixed(1)}" x2="${mainCoords[0].x.toFixed(1)}" y2="${mainCoords[0].y.toFixed(1)}" stroke="${textDim}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6"/>`;
        }
        refSvg += `
            <g style="cursor:pointer;" data-action="jump-week" data-week="0">
                ${isActive ? `<circle cx="${refPoint.x.toFixed(1)}" cy="${ry.toFixed(1)}" r="8.5" fill="#f59e0b" opacity="0.22"/>` : ''}
                <circle cx="${refPoint.x.toFixed(1)}" cy="${ry.toFixed(1)}" r="4" fill="${surfaceColor}" stroke="${refColor}" stroke-width="2"/>
                <text x="${refPoint.x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" fill="${refColor}" font-size="10" font-weight="700" font-family="Inter, sans-serif">${refPoint.val.toFixed(1)}</text>
            </g>
        `;
    }

    const dotsSvg = mainCoords.map(c => {
        const isActive = c.w === appState.week;
        const labelY = c.y - 11 < topY - 4 ? c.y + 18 : c.y - 10;
        return `
            <g style="cursor:pointer;" data-action="jump-week" data-week="${c.w}">
                ${isActive ? `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="9" fill="${brandColor}" opacity="0.22"/>` : ''}
                <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${isActive ? 5.2 : 4.2}" fill="${brandColor}" stroke="${surfaceColor}" stroke-width="2"/>
                <text x="${c.x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" fill="${isActive ? brandColor : textMain}" font-size="10.5" font-weight="800" font-family="Inter, sans-serif">${c.val.toFixed(1)}</text>
            </g>
        `;
    }).join('');

    const xLabelsSvg = points.map(p => {
        const isActive = p.w === appState.week;
        const fill = p.isRef
            ? (isActive ? '#f59e0b' : textDim)
            : (isActive ? brandColor : textDim);
        return `
            <text x="${p.x.toFixed(1)}" y="${H - 7}" text-anchor="middle" style="cursor:pointer;" data-action="jump-week" data-week="${p.w}"
                  fill="${fill}" font-size="${p.isRef ? '9.5' : '10.5'}" font-weight="${isActive ? '800' : '700'}" opacity="${p.isRef && !isActive ? '0.75' : '1'}" font-family="Inter, sans-serif">
                S${p.w}
            </text>
        `;
    }).join('');

    wrap.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto max-h-[245px] block select-none" role="img" aria-label="Trend peso corporeo 6 settimane">
            <defs>
                <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${brandColor}" stop-opacity="0.28"/>
                    <stop offset="100%" stop-color="${brandColor}" stop-opacity="0.01"/>
                </linearGradient>
                <filter id="starGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#f59e0b" flood-opacity="0.65"/>
                </filter>
            </defs>
            ${gridSvg}
            ${breakSvg}
            ${lineSvg}
            ${refSvg}
            ${goalSvg}
            ${dotsSvg}
            ${xLabelsSvg}
        </svg>
    `;
}

// ============================================================
//  HELPER REPORT & PDF (troncamento blocchi + trend multi-blocco + S0 opz.)
// ============================================================
function getRawTargetForWeek(ex, weekNum) {
    if (!ex) return '3x10';
    if (weekNum === 0) {
        if (typeof ex.week0Target === 'string' && ex.week0Target.trim() !== '') {
            return ex.week0Target;
        }
        if (Array.isArray(ex.progression) && ex.progression.length > 0 && ex.progression[0]) {
            return ex.progression[0];
        }
        return '3x10';
    }
    if (!Array.isArray(ex.progression) || ex.progression.length === 0) return '3x10';
    const idx = Math.max(0, weekNum - 1);
    return ex.progression[idx] || ex.progression[ex.progression.length - 1] || '3x10';
}

function buildWeekWeightEntry(userId, dayId, ex, w) {
    const rawTarget = getRawTargetForWeek(ex, w);
    const parsed = parseTargetAndRests(rawTarget);
    const blocks = parseTargetBlocks(parsed.cleanTarget);
    const blockCount = Math.max(1, blocks.length);

    const logKey = `w${w}_${userId}_${dayId}_${ex.id}`;
    const log = appState.logs[logKey];
    let rawWeights = log ? (Array.isArray(log.weights) ? log.weights : []) : [];
    if (log && log.weight && rawWeights.length === 0) rawWeights = [log.weight];

    const truncated = Array.from({ length: blockCount }, (_, idx) => {
        const v = rawWeights[idx];
        return (v !== '' && v !== undefined && v !== null) ? String(v).trim() : '';
    });

    const hasAny = truncated.some(v => v !== '');
    const nums = truncated.map(v => {
        if (v === '') return null;
        const n = parseFloat(v.replace(',', '.'));
        return Number.isFinite(n) ? n : null;
    });

    const text = hasAny ? truncated.map(v => v !== '' ? v : '-').join(' + ') : '-';
    return { week: w, blockCount, values: truncated, nums, hasAny, text };
}

function getExerciseReportData(userId, dayId, ex) {
    const week0 = buildWeekWeightEntry(userId, dayId, ex, 0);
    const weeks = [];
    const loggedWeeks = [];

    for (let w = 1; w <= getProgramWeekCount(); w++) {
        const entry = buildWeekWeightEntry(userId, dayId, ex, w);
        weeks.push(entry);
        if (entry.nums.some(n => n !== null)) {
            loggedWeeks.push(entry);
        }
    }

    // Trend calcolato sulle settimane del ciclo configurato
    let trend = {
        status: 'none',
        pdfLabel: 'N/D',
        mdLabel: 'dati insufficienti',
    };

    if (loggedWeeks.length >= 2) {
        const firstEntry = loggedWeeks[0];
        const lastEntry = loggedWeeks[loggedWeeks.length - 1];
        const sameBlockCount = firstEntry.blockCount === lastEntry.blockCount;
        const compareCount = sameBlockCount ? lastEntry.blockCount : 1;

        const blockDeltas = [];
        for (let b = 0; b < compareCount; b++) {
            let firstNum = null;
            let lastNum = null;
            let validCount = 0;

            for (const lw of loggedWeeks) {
                if (b < lw.nums.length && lw.nums[b] !== null) {
                    if (firstNum === null) firstNum = lw.nums[b];
                    lastNum = lw.nums[b];
                    validCount++;
                }
            }

            if (validCount >= 2 && firstNum !== null && lastNum !== null) {
                blockDeltas.push(Number((lastNum - firstNum).toFixed(2)));
            } else {
                blockDeltas.push(null);
            }
        }

        const validDeltas = blockDeltas.filter(d => d !== null);
        if (validDeltas.length > 0) {
            const netDelta = Number(validDeltas.reduce((acc, d) => acc + d, 0).toFixed(2));
            const anyChange = validDeltas.some(d => d !== 0);

            if (!anyChange) {
                trend = { status: 'flat', pdfLabel: 'Stabile', mdLabel: 'stabile' };
            } else if (compareCount === 1) {
                const d = validDeltas[0];
                const signed = d > 0 ? `+${d}` : `${d}`;
                trend = {
                    status: d > 0 ? 'up' : 'down',
                    pdfLabel: `${signed} kg`,
                    mdLabel: `${signed}kg`,
                };
            } else {
                const formattedParts = blockDeltas.map(d => {
                    if (d === null) return '-';
                    if (d > 0) return `+${d}`;
                    return `${d}`;
                });
                const joined = formattedParts.join(' / ');
                const status = netDelta > 0 ? 'up' : (netDelta < 0 ? 'down' : 'flat');
                trend = {
                    status,
                    pdfLabel: `${joined} kg`,
                    mdLabel: `${joined} kg (per blocco)`,
                };
            }
        }
    }

    return { week0, weeks, trend };
}

// ============================================================
//  VISTA REPORT CARICHI & CALCOLATORE 1RM / AVVICINAMENTO
// ============================================================
let _calcMode = '1rm'; // '1rm' | 'warmup'

function renderReportView() {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const selector = document.getElementById('export-day-selector');

    if (!currentUser || !currentUser.days || currentUser.days.length === 0) {
        if (selector) selector.innerHTML = '<option value="">— Nessun giorno —</option>';
        currentExportText = '';
    } else if (selector) {
        const prevVal = selector.value;
        selector.innerHTML = '';

        const allOpt = document.createElement('option');
        allOpt.value = '__ALL__';
        allOpt.textContent = 'Tutta la scheda (tutti i giorni)';
        selector.appendChild(allOpt);

        currentUser.days.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.name;
            selector.appendChild(opt);
        });

        if (prevVal && Array.from(selector.options).some(o => o.value === prevVal)) {
            selector.value = prevVal;
        } else if (activeDayId && currentUser.days.some(d => d.id === activeDayId)) {
            selector.value = activeDayId;
        } else {
            selector.value = '__ALL__';
        }

        generateReport();
    }

    populateCalcExerciseSelector();
    updateLoadCalculator();
}

function generateReport() {
    const selected = document.getElementById('export-day-selector')?.value;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    if (!currentUser || !selected) return;

    const daysToExport = selected === '__ALL__'
        ? currentUser.days
        : currentUser.days.filter(d => d.id === selected);

    const activeWeekLabel = appState.week === 0 ? 'S0 (Prova)' : `S${appState.week}`;
    let md = `# Report Carichi — ${selected === '__ALL__' ? 'Scheda Completa' : daysToExport[0]?.name}\n`;
    md += `Profilo: ${currentUser.name} · Settimana corrente: ${activeWeekLabel}\n\n`;

    daysToExport.forEach(day => {
        if (daysToExport.length > 1) md += `## ${day.name}\n\n`;

        day.exercises.forEach(ex => {
            const rawTarget = getRawTargetForWeek(ex, appState.week);
            const parsed = parseTargetAndRests(rawTarget);
            const rests = getRestsForWeek(ex, appState.week);
            const restNote = rests.filter(Boolean).length ? ` | Rec: ${rests.filter(Boolean).join(' / ')}` : '';

            md += `### ${ex.name}\n`;
            if (hasExerciseWeeklyProgression(ex)) {
                const planStr = summarizeWeeklyProgression(ex).map(g => `${g.label}: ${g.text}`).join(' | ');
                md += `Target (${activeWeekLabel}): ${parsed.cleanTarget}${restNote}\n`;
                md += `Schema S1-S${getProgramWeekCount()}: ${planStr}\n`;
            } else {
                md += `Target: ${parsed.cleanTarget}${restNote}\n`;
            }

            const reportData = getExerciseReportData(currentUser.id, day.id, ex);
            if (reportData.week0 && reportData.week0.hasAny) {
                md += `Prova (S0): ${reportData.week0.text}kg\n`;
            }

            const weightsStr = reportData.weeks.map(item =>
                item.hasAny ? `S${item.week}: ${item.text}kg` : `S${item.week}: -`
            );

            md += `Progressione: ${weightsStr.join(' -> ')}\n`;
            md += `Trend: ${reportData.trend.mdLabel}\n\n`;
        });
    });

    currentExportText = md;
}

// VISTA REPORT CARICHI

function copyExport() {
    if (!currentExportText) return;
    navigator.clipboard.writeText(currentExportText).then(() => {
        const btn = document.getElementById('copy-export-btn');
        const original = btn.innerHTML;
        btn.innerHTML = `${UI_SVG.check} Copiato!`;
        setTimeout(() => { btn.innerHTML = original; }, 1500);
    });
}

function formatCalcKg(val) {
    const rounded = Math.round(val * 4) / 4; // step 0.25 kg coerente con gli input
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function getLatestExerciseWeightAndReps(userId, dayId, ex) {
    const maxW = getProgramWeekCount();
    const order = [appState.week];
    for (let w = maxW; w >= 0; w--) {
        if (w !== appState.week) order.push(w);
    }

    let foundWeight = null;
    let foundWeek = null;

    for (const w of order) {
        const entry = buildWeekWeightEntry(userId, dayId, ex, w);
        const firstNum = entry.nums.find(n => n !== null && n > 0);
        if (firstNum !== undefined) {
            foundWeight = firstNum;
            foundWeek = w;
            break;
        }
    }

    const refWeek = foundWeek !== null ? foundWeek : appState.week;
    const rawTarget = getRawTargetForWeek(ex, refWeek);
    const cleanTarget = parseTargetAndRests(rawTarget).cleanTarget;
    const firstBlock = parseTargetBlocks(cleanTarget)[0] || cleanTarget;
    const repMatch = firstBlock.match(/\d+\s*[x×]\s*(\d+)/i);
    const reps = repMatch ? parseInt(repMatch[1], 10) : 6;

    return {
        weight: foundWeight,
        reps: Number.isFinite(reps) && reps > 0 ? reps : 6,
        week: foundWeek,
        blockLabel: firstBlock,
    };
}

function populateCalcExerciseSelector() {
    const sel = document.getElementById('calc-ex-selector');
    if (!sel) return;

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const prevVal = sel.value;

    sel.innerHTML = '<option value="">Inserimento manuale</option>';
    if (!currentUser || !Array.isArray(currentUser.days) || currentUser.days.length === 0) {
        const hintEl = document.getElementById('calc-ex-hint');
        if (hintEl) hintEl.textContent = '';
        return;
    }

    let firstLoggedVal = '';
    currentUser.days.forEach(day => {
        if (!day.exercises || day.exercises.length === 0) return;
        const group = document.createElement('optgroup');
        group.label = day.name;

        day.exercises.forEach(ex => {
            const val = `${day.id}:::${ex.id}`;
            const latest = getLatestExerciseWeightAndReps(currentUser.id, day.id, ex);
            if (!firstLoggedVal && latest.weight !== null) firstLoggedVal = val;

            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = latest.weight !== null
                ? `${ex.name} (${formatCalcKg(latest.weight)} kg)`
                : ex.name;
            group.appendChild(opt);
        });

        sel.appendChild(group);
    });

    const hasPrev = prevVal && Array.from(sel.options).some(o => o.value === prevVal);
    if (hasPrev) {
        sel.value = prevVal;
    } else if (firstLoggedVal && !document.getElementById('calc-weight-input')?.value) {
        sel.value = firstLoggedVal;
        onCalcExerciseChange();
    }
}

function onCalcExerciseChange() {
    const sel = document.getElementById('calc-ex-selector');
    const weightInput = document.getElementById('calc-weight-input');
    const repsInput = document.getElementById('calc-reps-input');
    const hintEl = document.getElementById('calc-ex-hint');
    if (!sel || !weightInput || !repsInput) return;

    const val = sel.value;
    if (!val) {
        if (hintEl) hintEl.textContent = 'Modalità manuale';
        updateLoadCalculator();
        return;
    }

    const [dayId, exId] = val.split(':::');
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser?.days.find(d => d.id === dayId);
    const ex = day?.exercises.find(e => e.id === exId);
    if (!ex) return;

    const latest = getLatestExerciseWeightAndReps(currentUser.id, day.id, ex);
    weightInput.value = latest.weight !== null ? String(latest.weight) : '';
    repsInput.value = String(latest.reps);

    if (hintEl) {
        hintEl.textContent = latest.week !== null
            ? `S${latest.week} · ${latest.blockLabel}`
            : `Target: ${latest.blockLabel}`;
    }

    updateLoadCalculator();
}

function setCalcMode(mode) {
    _calcMode = mode === 'warmup' ? 'warmup' : '1rm';
    const isWarmup = _calcMode === 'warmup';

    const tab1rm = document.getElementById('calc-tab-1rm');
    const tabWarmup = document.getElementById('calc-tab-warmup');
    const repsWrap = document.getElementById('calc-reps-wrap');
    const inputsGrid = document.getElementById('calc-inputs-grid');
    const weightLabel = document.getElementById('calc-weight-label');

    if (tab1rm) {
        tab1rm.classList.toggle('active', !isWarmup);
        tab1rm.setAttribute('aria-selected', isWarmup ? 'false' : 'true');
    }
    if (tabWarmup) {
        tabWarmup.classList.toggle('active', isWarmup);
        tabWarmup.setAttribute('aria-selected', isWarmup ? 'true' : 'false');
    }
    if (repsWrap) repsWrap.classList.toggle('hidden', isWarmup);
    if (inputsGrid) {
        inputsGrid.classList.toggle('grid-cols-2', !isWarmup);
        inputsGrid.classList.toggle('grid-cols-1', isWarmup);
    }
    if (weightLabel) {
        weightLabel.textContent = isWarmup ? 'Carico allenante (kg)' : 'Carico usato (kg)';
    }

    updateLoadCalculator();
}

function updateLoadCalculator() {
    const output = document.getElementById('calc-output');
    const weightRaw = document.getElementById('calc-weight-input')?.value;
    const repsRaw = document.getElementById('calc-reps-input')?.value;
    if (!output) return;

    const weight = parseFloat(String(weightRaw || '').replace(',', '.'));
    if (!Number.isFinite(weight) || weight <= 0) {
        output.innerHTML = `
            <div class="calc-empty">
                Seleziona un esercizio o inserisci un carico in kg per calcolare ${
                    _calcMode === '1rm' ? 'il massimale stimato.' : 'la scaletta progressiva consigliata.'
                }
            </div>
        `;
        return;
    }

    if (_calcMode === '1rm') {
        const reps = Math.max(1, Math.min(30, parseInt(repsRaw, 10) || 1));
        const est1RM = reps === 1 ? weight : weight * (1 + reps / 30);

        const rows = [
            { pct: 95, title: 'Forza massima',      reps: '2 rip' },
            { pct: 90, title: 'Forza sub-max',      reps: '3–4 rip' },
            { pct: 85, title: 'Forza / Ipertrofia', reps: '5–6 rip' },
            { pct: 80, title: 'Ipertrofia',         reps: '7–8 rip' },
            { pct: 75, title: 'Volume',             reps: '9–10 rip' },
            { pct: 70, title: 'Resistenza / Pump',  reps: '11–12 rip' },
        ];

        output.innerHTML = `
            <div class="calc-hero">
                <div>
                    <div class="calc-hero-label">Massimale Stimato (1RM)</div>
                    <div class="calc-hero-sub">Formula Epley · ${formatCalcKg(weight)} kg × ${reps} rip</div>
                </div>
                <div class="calc-hero-val tabular-nums">${formatCalcKg(est1RM)} <span>kg</span></div>
            </div>
            <div class="calc-list">
                ${rows.map((r, idx) => `
                    <div class="calc-row ${idx === 0 ? 'is-peak' : ''}">
                        <span class="calc-row-bar" style="width: ${r.pct}%;" aria-hidden="true"></span>
                        <div class="calc-row-inner">
                            <span class="calc-pct-pill tabular-nums">${r.pct}%</span>
                            <div class="calc-row-info">
                                <span class="calc-row-title">${r.title}</span>
                                <span class="calc-reps-badge tabular-nums">${r.reps}</span>
                            </div>
                            <span class="calc-row-kg tabular-nums">${formatCalcKg(est1RM * (r.pct / 100))} <small>kg</small></span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        const steps = [
            { pct: 50, title: 'Riscaldamento',        reps: '8 rip' },
            { pct: 60, title: 'Attivazione',          reps: '6 rip' },
            { pct: 70, title: 'Avvicinamento',        reps: '4–5 rip' },
            { pct: 80, title: 'Carico medio',         reps: '3 rip' },
            { pct: 85, title: 'Prep. carico',         reps: '2 rip' },
            { pct: 90, title: 'Ultimo avvicinamento', reps: '1–2 rip' },
        ];

        output.innerHTML = `
            <div class="calc-hero">
                <div>
                    <div class="calc-hero-label">Carico Allenante (100%)</div>
                    <div class="calc-hero-sub">Scaletta progressiva consigliata</div>
                </div>
                <div class="calc-hero-val tabular-nums">${formatCalcKg(weight)} <span>kg</span></div>
            </div>
            <div class="calc-list">
                ${steps.map((s, idx) => `
                    <div class="calc-row ${idx === steps.length - 1 ? 'is-peak' : ''}">
                        <span class="calc-row-bar" style="width: ${s.pct}%;" aria-hidden="true"></span>
                        <div class="calc-row-inner">
                            <span class="calc-pct-pill tabular-nums">${s.pct}%</span>
                            <div class="calc-row-info">
                                <span class="calc-row-title">${s.title}</span>
                                <span class="calc-reps-badge tabular-nums">${s.reps}</span>
                            </div>
                            <span class="calc-row-kg tabular-nums">${formatCalcKg(weight * (s.pct / 100))} <small>kg</small></span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// ============================================================
//  MODALI & EVENT DELEGATION SICURA
// ============================================================
function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add('flex');
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    el.classList.remove('flex');
}

let _delegatedEventsBound = false;
function setupDelegatedEvents() {
    if (_delegatedEventsBound) return;
    _delegatedEventsBound = true;

    document.addEventListener('click', (e) => {
        if (e.target.classList?.contains('modal-overlay')) {
            e.target.classList.add('hidden');
            e.target.classList.remove('flex');
            return;
        }

        const actionEl = e.target.closest('[data-action]');
        if (actionEl) {
            const action = actionEl.dataset.action;
            switch (action) {
                case 'select-day':
                    selectDay(actionEl.dataset.dayId);
                    return;
                case 'open-add-day':
                    openAddDayModal();
                    return;
                case 'open-edit-day':
                    openEditDayModal(actionEl.dataset.dayId);
                    return;
                case 'prepare-single-add':
                    prepareSingleAdd(actionEl.dataset.dayId);
                    return;
                case 'prepare-bulk-add':
                    prepareBulkAdd(actionEl.dataset.dayId);
                    return;
                case 'start-rest':
                    startRestTimer(
                        actionEl.dataset.exName || 'Recupero',
                        actionEl.dataset.blockLabel || '',
                        actionEl.dataset.restStr || ''
                    );
                    return;
                case 'toggle-note':
                    toggleExerciseNote(actionEl.dataset.logKey);
                    return;
                case 'clear-note':
                    clearExerciseNote(actionEl.dataset.logKey);
                    return;
                case 'toggle-up':
                    toggleUpFlag(actionEl.dataset.logKey);
                    return;
                case 'toggle-ex-menu':
                    toggleExMenu(e, actionEl.dataset.popoverId);
                    return;
                case 'edit-ex':
                    closeAllPopovers();
                    openEditEx(actionEl.dataset.dayId, actionEl.dataset.exId);
                    return;
                case 'delete-ex':
                    closeAllPopovers();
                    deleteEx(actionEl.dataset.dayId, actionEl.dataset.exId);
                    return;
                case 'select-new-day-icon':
                    selectNewDayIcon(actionEl.dataset.iconKey);
                    return;
                case 'select-edit-day-icon':
                    selectEditDayIcon(actionEl.dataset.iconKey);
                    return;
                case 'set-theme':
                    setTheme(actionEl.dataset.themeKey);
                    return;
                case 'cycle-bg': {
                    const delta = parseInt(actionEl.dataset.delta, 10);
                    if (!isNaN(delta)) cycleBackground(delta);
                    return;
                }
                case 'add-program-week':
                    addProgramWeek();
                    return;
                case 'remove-program-week':
                    removeProgramWeek();
                    return;
                case 'jump-week': {
                    const w = parseInt(actionEl.dataset.week, 10);
                    if (!isNaN(w)) jumpToWeek(w);
                    return;
                }
                case 'open-import-plan':
                    openImportPlanModal();
                    return;
                case 'open-cloud-settings':
                    switchTab('settings', 'cloud-section');
                    return;
                case 'prog-fill-forward': {
                    const pw = parseInt(actionEl.dataset.progWeek, 10);
                    if (!isNaN(pw)) copyProgFromWeekForward(actionEl.dataset.progPrefix, pw);
                    return;
                }
                case 'remove-ai-file': {
                    const idx = parseInt(actionEl.dataset.fileIndex, 10);
                    if (!isNaN(idx)) removeAiSelectedFile(idx);
                    return;
                }
                case 'add-more-photos':
                    document.getElementById('import-photo-file')?.click();
                    return;
                default:
                    break;
            }
        }

        if (openPopoverId && !e.target.closest('.ex-popover')) {
            closeAllPopovers();
        }
    });

    document.addEventListener('input', (e) => {
        const target = e.target;
        if (!target || !target.matches) return;
        if (target.matches('input[data-weight-input="1"]')) {
            handleWeightInputDebounced(target);
        } else if (target.matches('textarea[data-note-input="1"]')) {
            handleNoteInputDebounced(target);
        } else if (target.matches('input[data-rest-prefix][data-rest-idx]')) {
            syncTopInputsToProgDraft(target.dataset.restPrefix);
        } else if (target.matches('input[data-prog-target="1"]')) {
            handleProgTargetRowInput(target);
        } else if (target.matches('input[data-prog-rest-idx]')) {
            handleProgRestRowInput(target);
        }
    });

    document.addEventListener('change', (e) => {
        const target = e.target;
        if (!target || !target.matches) return;
        if (target.matches('input[data-action="toggle-done"]')) {
            toggleDone(target.dataset.logKey, target.checked);
        } else if (target.matches('input[data-weight-input="1"]')) {
            commitWeightInput(target);
        } else if (target.matches('textarea[data-note-input="1"]')) {
            commitNoteInput(target);
        }
    });

    document.addEventListener('focusout', (e) => {
        const target = e.target;
        if (!target || !target.matches) return;
        if (target.matches('input[data-weight-input="1"]')) {
            commitWeightInput(target);
        } else if (target.matches('textarea[data-note-input="1"]')) {
            commitNoteInput(target);
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            let needsFlushSave = false;
            if (_weightInputDebounceTimer) {
                clearTimeout(_weightInputDebounceTimer);
                _weightInputDebounceTimer = null;
                _hasPendingWeightInput = false;
                needsFlushSave = true;
            }
            if (_noteInputDebounceTimer) {
                clearTimeout(_noteInputDebounceTimer);
                _noteInputDebounceTimer = null;
                _hasPendingNoteInput = false;
                needsFlushSave = true;
            }
            if (needsFlushSave) saveData();

            if (_cloudDebounceTimer && navigator.onLine && CLOUD_ENABLED && appState.syncKey) {
                clearTimeout(_cloudDebounceTimer);
                _cloudDebounceTimer = null;
                flushCloudSync({ keepalive: true });
            }
        } else if (document.visibilityState === 'visible') {
            syncRestTimerFromClock();
        }
    });

    window.addEventListener('focus', () => {
        syncRestTimerFromClock();
    });

    window.addEventListener('online', async () => {
        if (CLOUD_ENABLED && appState.syncKey) {
            const syncRes = await syncWithCloud();
            if (syncRes.action === 'pulled') {
                renderApp();
            }
        }
    });

    window.addEventListener('offline', () => {
        if (CLOUD_ENABLED && appState.syncKey) {
            updateCloudStatusUi('offline');
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
