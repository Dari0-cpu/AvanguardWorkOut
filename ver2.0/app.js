/* ====================================================================
   AVANGUARD WORKOUT - APP LOGIC v4 (Native UI + Secure /api/sync)
   100% retrocompatibile con gym_tracker_pro_v6 e Supabase gym_sync
   ==================================================================== */

const CLOUD_ENABLED = true;

// ============================================================
//  TEMI (tutti i vecchi ID mantenuti + nuovi)
// ============================================================
const THEMES = {
    red:    { label: 'Crimson',     400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', rgb: '244, 63, 94',  contrast: '#ffffff' },
    orange: { label: 'Volcanic',    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', rgb: '249, 115, 22', contrast: '#ffffff' },
    yellow: { label: 'Solar Gold',  400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', rgb: '245, 158, 11', contrast: '#111318' },
    green:  { label: 'Emerald',     400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', rgb: '16, 185, 129', contrast: '#06281e' },
    cyan:   { label: 'Glacier',     400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', rgb: '6, 182, 212',  contrast: '#06242b' },
    blue:   { label: 'Cobalt',      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', rgb: '59, 130, 246', contrast: '#ffffff' },
    indigo: { label: 'Midnight',    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', rgb: '99, 102, 241', contrast: '#ffffff' },
    purple: { label: 'Ultraviolet', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', rgb: '168, 85, 247', contrast: '#ffffff' },
    pink:   { label: 'Plasma',      400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', rgb: '236, 72, 153', contrast: '#ffffff' },
    zinc:   { label: 'Titanium',    adaptive: true },
};

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
//  STATO APPLICATIVO (identico al formato salvato su DB)
// ============================================================
let appState = {
    users: [],
    currentUserId: null,
    week: 1,
    logs: {},
    bodyWeight: {},
    bodyWeightGoal: {},
    theme: 'red',
    mode: 'dark',
    syncKey: '',
    carried: {},
};

// Stato UI solo in memoria (non sporca il JSON salvato)
let activeTab = 'workout';
let activeDayId = null;
let openPopoverId = null;

let tempTargetDayId = null;
let tempEditDayId = null;
let tempEditExId = null;
let tempSelectedNewDayIcon = 'dumbbell';
let tempSelectedEditDayIcon = 'dumbbell';
let currentExportText = "";
let _weightChart = null;
let _parsedImportDays = [];

// Timer recupero
let _restTimerInterval = null;
let _restTimerTotal = 0;
let _restTimerRemaining = 0;
let _restTimerPaused = false;

// Stella SVG precaricata per Chart.js
const _starSvgImg = new Image();
_starSvgImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    `<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="28" height="28" viewBox="0 0 24 24">
        <polygon points="12,1.8 15.1,8.1 22,9.1 17,14 18.2,20.9 12,17.6 5.8,20.9 7,14 2,9.1 8.9,8.1"
            fill="#f59e0b" stroke="#fef3c7" stroke-width="1.4" stroke-linejoin="round"/>
    </svg>`
);

// ============================================================
//  INIT
// ============================================================
async function init() {
    const warningEl = document.getElementById('cloud-warning');
    if (warningEl && CLOUD_ENABLED) warningEl.classList.add('hidden');

    const savedData = localStorage.getItem('gym_tracker_pro_v6');
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

    if (CLOUD_ENABLED && appState.syncKey) {
        await pullFromCloud();
    } else {
        updateCloudStatusUi('ok');
    }

    renderApp();
}

function mergeStateSafely(incoming) {
    if (!incoming || typeof incoming !== 'object') return;
    appState = {
        ...appState,
        ...incoming,
        users: Array.isArray(incoming.users) ? incoming.users : (appState.users || []),
        logs: (incoming.logs && typeof incoming.logs === 'object') ? incoming.logs : (appState.logs || {}),
        bodyWeight: (incoming.bodyWeight && typeof incoming.bodyWeight === 'object') ? incoming.bodyWeight : (appState.bodyWeight || {}),
        bodyWeightGoal: (incoming.bodyWeightGoal && typeof incoming.bodyWeightGoal === 'object') ? incoming.bodyWeightGoal : (appState.bodyWeightGoal || {}),
        carried: (incoming.carried && typeof incoming.carried === 'object') ? incoming.carried : (appState.carried || {}),
    };
}

// ============================================================
//  PERSISTENZA + CLOUD (/api/sync) + BACKUP JSON
// ============================================================
async function saveData() {
    localStorage.setItem('gym_tracker_pro_v6', JSON.stringify(appState));
    if (CLOUD_ENABLED && appState.syncKey) {
        updateCloudStatusUi('syncing');
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-sync-key': appState.syncKey,
                },
                body: JSON.stringify({ state: appState }),
            });
            if (!res.ok) {
                console.error('Errore salvataggio cloud:', res.status, await res.text());
                updateCloudStatusUi('error');
                return;
            }
            updateCloudStatusUi('ok');
        } catch (e) {
            console.error('Errore salvataggio cloud:', e);
            updateCloudStatusUi('error');
        }
    }
}

async function pullFromCloud() {
    if (!CLOUD_ENABLED || !appState.syncKey) return { ok: false, found: false };
    updateCloudStatusUi('syncing');
    try {
        const res = await fetch('/api/sync', {
            method: 'GET',
            headers: { 'x-sync-key': appState.syncKey },
        });
        if (!res.ok) {
            console.error('Errore scaricamento cloud:', res.status, await res.text());
            updateCloudStatusUi('error');
            return { ok: false, found: false };
        }
        const data = await res.json();
        if (data && data.state) {
            mergeStateSafely(data.state);
            localStorage.setItem('gym_tracker_pro_v6', JSON.stringify(appState));
            applyMode();
            applyTheme();
            updateCloudStatusUi('ok');
            return { ok: true, found: true };
        }
        updateCloudStatusUi('ok');
        return { ok: true, found: false };
    } catch (e) {
        console.error('Errore scaricamento cloud:', e);
        updateCloudStatusUi('error');
        return { ok: false, found: false };
    }
}

async function saveCloudKey() {
    const key = document.getElementById('cloud-sync-key').value.trim();
    if (key.length < 4) { alert("Inserisci una chiave di almeno 4 caratteri!"); return; }
    appState.syncKey = key;
    if (CLOUD_ENABLED) {
        const res = await pullFromCloud();
        if (res.ok) {
            await saveData();
        } else {
            alert("Connessione a /api/sync non riuscita. I dati locali restano al sicuro.");
        }
    } else {
        localStorage.setItem('gym_tracker_pro_v6', JSON.stringify(appState));
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
            await saveData();
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
//  NAVIGAZIONE BOTTOM BAR
// ============================================================
function switchTab(tab, scrollToId = null) {
    activeTab = tab;
    closeAllPopovers();

    document.querySelectorAll('.app-view').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(`view-${tab}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('[data-nav-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.navTab === tab);
    });

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
        const dotColor = t.adaptive ? 'linear-gradient(135deg, #f4f4f5 50%, #18181b 50%)' : t[500];
        return `
            <button data-color-swatch="${key}" onclick="setTheme('${key}')" class="theme-card-btn">
                <span class="theme-dot" style="background: ${dotColor};"></span>
                <span>${t.label}</span>
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
//  TIMER RECUPERO FLOATING
// ============================================================
function startRestTimer(exName, blockLabel, restStr) {
    const seconds = parseRestToSeconds(restStr);
    if (!seconds) return;

    stopRestTimer(false);
    _restTimerTotal = seconds;
    _restTimerRemaining = seconds;
    _restTimerPaused = false;

    document.getElementById('rest-timer-label').textContent = `${exName} · ${blockLabel}`;
    document.getElementById('rest-timer-bar').classList.remove('hidden');
    updateRestTimerDisplay();

    _restTimerInterval = setInterval(tickRestTimer, 1000);
}

function tickRestTimer() {
    if (_restTimerPaused) return;
    _restTimerRemaining--;
    if (_restTimerRemaining <= 0) {
        _restTimerRemaining = 0;
        updateRestTimerDisplay();
        clearInterval(_restTimerInterval);
        _restTimerInterval = null;
        playTimerDoneFeedback();
    } else {
        updateRestTimerDisplay();
    }
}

function updateRestTimerDisplay() {
    const mins = Math.floor(_restTimerRemaining / 60);
    const secs = _restTimerRemaining % 60;
    document.getElementById('rest-timer-time').textContent = _restTimerRemaining === 0
        ? 'PRONTO!'
        : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const pct = _restTimerTotal > 0 ? (_restTimerRemaining / _restTimerTotal) * 100 : 0;
    document.getElementById('rest-timer-progress').style.width = `${Math.max(0, Math.min(100, pct))}%`;
    document.getElementById('rest-timer-toggle').innerHTML = _restTimerPaused ? UI_SVG.play : UI_SVG.pause;
}

function toggleRestTimerPause() {
    if (_restTimerRemaining === 0) {
        _restTimerRemaining = _restTimerTotal;
        _restTimerPaused = false;
        if (!_restTimerInterval) _restTimerInterval = setInterval(tickRestTimer, 1000);
    } else {
        _restTimerPaused = !_restTimerPaused;
    }
    updateRestTimerDisplay();
}

function adjustRestTimer(deltaSec) {
    _restTimerRemaining = Math.max(5, _restTimerRemaining + deltaSec);
    if (_restTimerRemaining > _restTimerTotal) _restTimerTotal = _restTimerRemaining;
    updateRestTimerDisplay();
}

function stopRestTimer(hideBar = true) {
    if (_restTimerInterval) {
        clearInterval(_restTimerInterval);
        _restTimerInterval = null;
    }
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
    document.getElementById('week-display').innerText = appState.week;

    // Aggiorna selettore utenti in Impostazioni + nome nell'header
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

    // Label Peso nella Bottom Nav
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

    // Assicura un activeDayId valido
    if (!activeDayId || !currentUser.days.some(d => d.id === activeDayId)) {
        const firstOpen = currentUser.days.find(d => d.isOpen);
        activeDayId = firstOpen ? firstOpen.id : currentUser.days[0].id;
    }

    // 1. Barra orizzontale tab giorni
    strip.innerHTML = currentUser.days.map(day => {
        const isActive = day.id === activeDayId;
        return `
            <button onclick="selectDay('${day.id}')" class="day-tab-pill ${isActive ? 'active' : ''}">
                ${getDayIconSvg(day)}
                <span>${escapeHtml(day.name)}</span>
            </button>
        `;
    }).join('') + `
        <button onclick="openAddDayModal()" class="day-tab-add" title="Aggiungi nuovo giorno">
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

    container.innerHTML = `
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
                <button onclick="openEditDayModal('${day.id}')" class="icon-btn" title="Modifica giorno e icona">
                    ${UI_SVG.edit}
                </button>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${pct}%;"></div>
            </div>
        </div>

        <div>${cardsHtml}</div>

        <div class="grid grid-cols-2 gap-2.5 mt-3">
            <button onclick="prepareSingleAdd('${day.id}')" class="btn btn-ghost">
                ${UI_SVG.plus} Esercizio
            </button>
            <button onclick="prepareBulkAdd('${day.id}')" class="btn btn-outline">
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

    const rawTarget = (ex.progression && (ex.progression[appState.week - 1] || ex.progression[ex.progression.length - 1])) || "3x10";
    const parsedTarget = parseTargetAndRests(rawTarget);
    const blocks = parseTargetBlocks(parsedTarget.cleanTarget);
    const restsArray = (Array.isArray(ex.rests) && ex.rests.length > 0) ? ex.rests : parsedTarget.rests;

    let upBadgeHtml = '';
    if (appState.week > 1) {
        const prevLog = appState.logs[`w${appState.week - 1}_${currentUser.id}_${day.id}_${ex.id}`];
        if (prevLog && prevLog.up) {
            upBadgeHtml = `<div class="up-badge">${UI_SVG.flame} Aumenta il carico</div>`;
        }
    }

    let carriedNow = false;
    let prevWeights = null;
    if (appState.week > 1) {
        const prevLog = appState.logs[`w${appState.week - 1}_${currentUser.id}_${day.id}_${ex.id}`];
        if (prevLog && prevLog.weights && prevLog.weights.some(v => v !== '' && v !== undefined && v !== null)) {
            prevWeights = prevLog.weights;
        }
    }

    const isCurrentEmpty = !weightsArray.some(v => v !== '' && v !== undefined && v !== null);
    let finalLog = log;
    if (isCurrentEmpty && prevWeights && !appState.carried[logKey]) {
        appState.logs[logKey] = {
            ...(appState.logs[logKey] || {}),
            weights: prevWeights.map(v => v || ''),
            done: false,
            up: false,
            carried: true,
        };
        appState.carried[logKey] = true;
        finalLog = appState.logs[logKey];
        carriedNow = true;
    }

    return {
        carriedNow,
        html: renderExerciseCardInternal(day.id, ex, logKey, finalLog, blocks, restsArray, upBadgeHtml, !!finalLog.carried)
    };
}

function renderExerciseCardInternal(dayId, ex, logKey, log, blocks, restsArray, upBadgeHtml, isCarried) {
    const weightsArray = log.weights || [];
    const safeExNameAttr = escapeAttr(ex.name);
    const popId = `pop_${ex.id}`;

    const blocksHtml = blocks.map((block, i) => {
        const val = weightsArray[i] ?? '';
        const restVal = (restsArray && restsArray[i]) ? restsArray[i] : '';
        const restPillHtml = restVal
            ? `<button type="button" onclick="startRestTimer('${safeExNameAttr}', '${escapeAttr(block)}', '${escapeAttr(restVal)}')" class="rest-pill" title="Avvia recupero ${escapeAttr(restVal)}">
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
                        placeholder="—" value="${escapeAttr(val)}"
                        onchange="updateWeight('${logKey}', this.value, ${i})">
                    <span class="unit">kg</span>
                </div>
            </div>
        `;
    }).join('');

    const carriedBadge = isCarried
        ? `<span class="carried-badge">${UI_SVG.arrowUp} S${appState.week - 1}</span>`
        : '';

    return `
        <div class="ex-card ${log.done ? 'done' : ''}">
            ${upBadgeHtml}
            <div class="flex items-start gap-3">
                <label class="cursor-pointer mt-0.5 flex-shrink-0">
                    <input type="checkbox" class="sr-only" ${log.done ? 'checked' : ''} onchange="toggleDone('${logKey}', this.checked)">
                    <span class="ex-check">${UI_SVG.check}</span>
                </label>
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-app text-[14.5px] break-words leading-snug">
                        ${escapeHtml(ex.name)}${carriedBadge}
                    </h3>
                </div>
                <div class="flex items-center gap-0.5 flex-shrink-0">
                    <button onclick="toggleUpFlag('${logKey}')" class="mini-action-btn ${log.up ? 'active' : ''}" title="Aumenta carico settimana prossima">
                        ${UI_SVG.trendUp}
                    </button>
                    <button onclick="toggleExMenu(event, '${popId}')" class="mini-action-btn" title="Altre opzioni">
                        ${UI_SVG.dots}
                    </button>
                </div>
            </div>

            <div id="${popId}" class="ex-popover hidden">
                <button onclick="closeAllPopovers(); openEditEx('${dayId}','${ex.id}')" class="ex-popover-item">
                    ${UI_SVG.edit} Modifica / Recuperi
                </button>
                <button onclick="closeAllPopovers(); deleteEx('${dayId}','${ex.id}')" class="ex-popover-item danger">
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
    const wasHidden = el.classList.contains('hidden');
    closeAllPopovers();
    if (wasHidden) {
        el.classList.remove('hidden');
        openPopoverId = popId;
    }
}

function closeAllPopovers() {
    if (openPopoverId) {
        document.getElementById(openPopoverId)?.classList.add('hidden');
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
                <button onclick="openImportPlanModal()" class="btn btn-primary">Incolla Scheda Intera</button>
                <button onclick="openAddDayModal()" class="btn btn-outline">Nuovo Giorno</button>
                <button onclick="switchTab('settings', 'cloud-section')" class="btn btn-ghost">Connetti Cloud Sync</button>
            </div>
        </div>
    `;
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
function escapeAttr(s) {
    return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ============================================================
//  GIORNI: add / edit / delete + ICON PICKER
// ============================================================
function renderIconPickerGrid(containerId, selectedKey, onSelectFnName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = Object.entries(DAY_ICONS).map(([key, item]) => `
        <button type="button" onclick="${onSelectFnName}('${key}')" class="icon-pick-btn ${key === selectedKey ? 'active' : ''}">
            ${item.svg}
            <span>${item.label}</span>
        </button>
    `).join('');
}

function openAddDayModal() {
    document.getElementById('new-day-name').value = '';
    tempSelectedNewDayIcon = 'dumbbell';
    renderIconPickerGrid('new-day-icon-grid', tempSelectedNewDayIcon, 'selectNewDayIcon');
    openModal('add-day-modal');
}
function selectNewDayIcon(key) {
    tempSelectedNewDayIcon = key;
    renderIconPickerGrid('new-day-icon-grid', tempSelectedNewDayIcon, 'selectNewDayIcon');
}
function autoSelectIconForNewDay(name) {
    const detected = detectDayIcon(name);
    if (detected !== tempSelectedNewDayIcon) {
        tempSelectedNewDayIcon = detected;
        renderIconPickerGrid('new-day-icon-grid', tempSelectedNewDayIcon, 'selectNewDayIcon');
    }
}

function openEditDayModal(dayId) {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser?.days.find(d => d.id === dayId);
    if (!day) return;
    tempEditDayId = dayId;
    document.getElementById('edit-day-name').value = day.name;
    tempSelectedEditDayIcon = (day.icon && DAY_ICONS[day.icon]) ? day.icon : detectDayIcon(day.name);
    renderIconPickerGrid('edit-day-icon-grid', tempSelectedEditDayIcon, 'selectEditDayIcon');
    openModal('edit-day-modal');
}
function selectEditDayIcon(key) {
    tempSelectedEditDayIcon = key;
    renderIconPickerGrid('edit-day-icon-grid', tempSelectedEditDayIcon, 'selectEditDayIcon');
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
    currentUser.days = currentUser.days.filter(d => d.id !== tempEditDayId);
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
    currentUser.name = newName;
    saveData();
    closeModal('edit-user-modal');
    renderApp();
}

function deleteUser() {
    if (appState.users.length <= 1) { alert("Non puoi eliminare l'unico profilo rimasto!"); return; }
    if (!confirm("Vuoi eliminare questo profilo e tutti i suoi dati?")) return;
    appState.users = appState.users.filter(u => u.id !== appState.currentUserId);
    appState.currentUserId = appState.users[0].id;
    activeDayId = null;
    saveData();
    closeModal('edit-user-modal');
    renderApp();
}

// ============================================================
//  ESERCIZI: add, bulk, edit, delete + RECUPERI
// ============================================================
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
                <input type="text" data-rest-idx="${idx}" value="${escapeAttr(val)}" class="field !py-2 !text-xs flex-1" placeholder="es. 3'  o  1'30&quot;  o  90s">
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

function prepareSingleAdd(dayId) {
    tempTargetDayId = dayId;
    document.getElementById('single-ex-name').value = '';
    document.getElementById('single-ex-target').value = '';
    renderRestInputs('single', []);
    openModal('single-add-modal');
}

function prepareBulkAdd(dayId) {
    tempTargetDayId = dayId;
    openModal('bulk-add-modal');
}

function saveSingleExercise() {
    const name = document.getElementById('single-ex-name').value.trim();
    const rawTarget = document.getElementById('single-ex-target').value.trim() || '3x10';
    if (!name) return;

    const parsed = parseTargetAndRests(rawTarget);
    const manualRests = collectRestInputs('single');
    const finalRests = manualRests.length > 0 ? manualRests : parsed.rests;

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === tempTargetDayId);
    const newEx = {
        id: 'e_' + Date.now(),
        name: name,
        progression: Array(6).fill(parsed.cleanTarget)
    };
    if (finalRests.length > 0) newEx.rests = finalRests;

    day.exercises.push(newEx);
    saveData();
    closeModal('single-add-modal');
    renderApp();
}

function parseExerciseLine(line) {
    let cleaned = line.replace(/^[\-\*•\d\.\)\s]+(?=[A-Za-zÀ-ÿ])/, '').trim();
    if (!cleaned) cleaned = line.trim();

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
    return { name, target: parsed.cleanTarget, rests: parsed.rests };
}

function saveBulkExercises() {
    const text = document.getElementById('bulk-text').value;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) return;

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === tempTargetDayId);
    const baseTs = Date.now();

    lines.forEach((line, index) => {
        const parsed = parseExerciseLine(line);
        const ex = {
            id: `e_bulk_${baseTs}_${index}`,
            name: parsed.name,
            progression: Array(6).fill(parsed.target)
        };
        if (parsed.rests.length > 0) ex.rests = parsed.rests;
        day.exercises.push(ex);
    });

    document.getElementById('bulk-text').value = '';
    saveData();
    closeModal('bulk-add-modal');
    renderApp();
}

function deleteEx(dayId, exId) {
    if (!confirm('Togliere questo esercizio?')) return;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === dayId);
    day.exercises = day.exercises.filter(e => e.id !== exId);
    saveData();
    renderApp();
}

function openEditEx(dayId, exId) {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === dayId);
    const ex = day.exercises.find(e => e.id === exId);
    if (!ex) return;

    tempEditDayId = dayId;
    tempEditExId = exId;
    const rawTarget = ex.progression[appState.week - 1] || ex.progression[0] || '3x10';
    const parsed = parseTargetAndRests(rawTarget);

    document.getElementById('edit-ex-name').value = ex.name;
    document.getElementById('edit-ex-target').value = parsed.cleanTarget;
    document.getElementById('edit-ex-apply-all').checked = false;
    document.getElementById('edit-ex-week-label').textContent = appState.week;

    const initialRests = (Array.isArray(ex.rests) && ex.rests.length > 0) ? ex.rests : parsed.rests;
    renderRestInputs('edit', initialRests);
    openModal('edit-ex-modal');
}

function saveEditEx() {
    const newName = document.getElementById('edit-ex-name').value.trim();
    const rawTarget = document.getElementById('edit-ex-target').value.trim() || '3x10';
    const applyAll = document.getElementById('edit-ex-apply-all').checked;
    if (!newName) return;

    const parsed = parseTargetAndRests(rawTarget);
    const manualRests = collectRestInputs('edit');
    const finalRests = manualRests.length > 0 ? manualRests : parsed.rests;

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === tempEditDayId);
    const ex = day.exercises.find(e => e.id === tempEditExId);
    ex.name = newName;

    if (applyAll) {
        ex.progression = Array(6).fill(parsed.cleanTarget);
    } else {
        if (!ex.progression || ex.progression.length < 6) {
            ex.progression = Array(6).fill(ex.progression?.[0] || parsed.cleanTarget);
        }
        ex.progression[appState.week - 1] = parsed.cleanTarget;
    }

    if (finalRests.length > 0) ex.rests = finalRests;
    else delete ex.rests;

    saveData();
    closeModal('edit-ex-modal');
    renderApp();
}

// ============================================================
//  IMPORTAZIONE SCHEDA COMPLETA (MULTI-GIORNO)
// ============================================================
function openImportPlanModal() {
    document.getElementById('import-plan-text').value = '';
    _parsedImportDays = [];
    updateImportPlanPreview();
    openModal('import-plan-modal');
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

function updateImportPlanPreview() {
    const text = document.getElementById('import-plan-text').value;
    const preview = document.getElementById('import-plan-preview');
    const btn = document.getElementById('import-plan-btn');

    if (!text.trim()) {
        _parsedImportDays = [];
        preview.innerHTML = `<p class="text-dim italic text-center py-4">Incolla la scheda sopra per vedere l'anteprima...</p>`;
        btn.disabled = true;
        btn.textContent = 'Importa Scheda';
        return;
    }

    _parsedImportDays = parseFullWorkoutPlan(text);
    const totalEx = _parsedImportDays.reduce((acc, d) => acc + d.exercises.length, 0);

    if (_parsedImportDays.length === 0) {
        preview.innerHTML = `<p class="text-dim italic text-center py-4">Nessun giorno riconosciuto.</p>`;
        btn.disabled = true;
        btn.textContent = 'Importa Scheda';
        return;
    }

    preview.innerHTML = _parsedImportDays.map(d => `
        <div class="mb-3 last:mb-0 pb-2.5 last:pb-0 border-b last:border-b-0 border-app">
            <div class="flex items-center gap-2 font-extrabold text-app mb-1.5">
                <span class="brand-text">${DAY_ICONS[d.icon]?.svg || DAY_ICONS.dumbbell.svg}</span>
                <span>${escapeHtml(d.name)}</span>
                <span class="text-[10px] font-bold text-dim ml-auto">${d.exercises.length} es.</span>
            </div>
            <div class="space-y-1 pl-6">
                ${d.exercises.map(ex => {
                    const restTag = ex.rests.length ? ` <span class="text-dim">(${escapeHtml(ex.rests.filter(Boolean).join(' / '))})</span>` : '';
                    return `<div class="flex justify-between gap-2 text-[11px]">
                        <span class="text-muted truncate">${escapeHtml(ex.name)}</span>
                        <span class="font-bold brand-text flex-shrink-0">${escapeHtml(ex.target)}${restTag}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `).join('');

    btn.disabled = false;
    btn.textContent = `Importa ${_parsedImportDays.length} giorni (${totalEx} esercizi)`;
}

function executeImportPlan() {
    if (_parsedImportDays.length === 0) return;
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
            exercises: d.exercises.map((ex, eIdx) => {
                const obj = {
                    id: `e_imp_${baseTs}_${dIdx}_${eIdx}`,
                    name: ex.name,
                    progression: Array(6).fill(ex.target)
                };
                if (ex.rests.length > 0) obj.rests = ex.rests;
                return obj;
            })
        });
    });

    activeDayId = firstNewId;
    saveData();
    closeModal('import-plan-modal');
    switchTab('workout');
    renderApp();
}

// ============================================================
//  LOGS & SETTIMANE
// ============================================================
function toggleDone(logKey, isChecked) {
    if (!appState.logs[logKey]) appState.logs[logKey] = { weights: [] };
    appState.logs[logKey].done = isChecked;
    saveData();
    renderApp();
}

function updateWeight(logKey, value, index) {
    if (!appState.logs[logKey]) appState.logs[logKey] = { done: false, weights: [], up: false };
    if (!appState.logs[logKey].weights) appState.logs[logKey].weights = [];
    appState.logs[logKey].weights[index] = value;
    if (appState.logs[logKey].carried) appState.logs[logKey].carried = false;
    saveData();
}

function toggleUpFlag(logKey) {
    if (!appState.logs[logKey]) appState.logs[logKey] = { weights: [] };
    appState.logs[logKey].up = !appState.logs[logKey].up;
    saveData();
    renderApp();
}

function changeWeek(delta) {
    const newWeek = appState.week + delta;
    if (newWeek >= 1 && newWeek <= 6) {
        appState.week = newWeek;
        saveData();
        renderApp();
    }
}

function jumpToWeek(weekNum) {
    if (weekNum >= 1 && weekNum <= 6) {
        appState.week = weekNum;
        saveData();
        renderApp();
    }
}

// ============================================================
//  VISTA PESO CORPOREO + OBIETTIVO STELLA SVG
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

    document.getElementById('weight-week-label').textContent = appState.week;
    document.getElementById('weight-week-label-2').textContent = appState.week;
    document.getElementById('weight-input').value = curW != null ? curW : '';
    document.getElementById('weight-goal-input').value = goal != null ? goal : '';

    // Ultimo peso registrato per i KPI
    let latest = curW;
    if (latest == null) {
        for (let w = 6; w >= 1; w--) {
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

    // Griglia 6 settimane cliccabile
    const grid = document.getElementById('weight-weeks-grid');
    let gridHtml = '';
    for (let w = 1; w <= 6; w++) {
        const v = weights['w' + w];
        gridHtml += `
            <button onclick="jumpToWeek(${w})" class="weight-week-chip ${w === appState.week ? 'active' : ''}">
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

    const points = [];
    for (let w = 1; w <= 6; w++) {
        const v = data['w' + w];
        const x = padL + 16 + ((w - 1) / 5) * (plotW - 32);
        points.push({ w, x, val: (typeof v === 'number' && !isNaN(v)) ? v : null });
    }

    const recorded = points.filter(p => p.val !== null);
    const validVals = recorded.map(p => p.val);

    // Nessun peso ancora inserito
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

    // Scala intelligente: se l'obiettivo è lontano, zoomiamo sulla curva reale e mettiamo la fascia traguardo con break
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

    // Griglia orizzontale (3 tacche pulite)
    const ticks = [yMin, (yMin + yMax) / 2, yMax];
    const gridSvg = ticks.map(tv => {
        const y = valToY(tv);
        return `
            <line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="${gridColor}" stroke-width="1"/>
            <text x="${padL - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" fill="${textDim}" font-size="10" font-weight="600" font-family="Inter, sans-serif">${tv.toFixed(1)}</text>
        `;
    }).join('');

    // Indicatore salto di scala (≈) quando l'obiettivo è fuori scala zoom
    const breakSvg = breakY != null ? `
        <line x1="${padL}" y1="${breakY}" x2="${W - padR}" y2="${breakY}" stroke="${gridColor}" stroke-width="1" stroke-dasharray="2 4"/>
        <text x="${padL - 10}" y="${breakY + 4}" text-anchor="end" fill="${textDim}" font-size="13" font-weight="700" font-family="Inter, sans-serif">≈</text>
    ` : '';

    // Linea obiettivo + Stella SVG
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

    // Linea progressione + area sfumata
    const coords = recorded.map(p => ({ ...p, y: valToY(p.val) }));
    let lineSvg = '';
    if (coords.length >= 2) {
        const linePath = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
        const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${botY.toFixed(1)} L ${coords[0].x.toFixed(1)} ${botY.toFixed(1)} Z`;
        lineSvg = `
            <path d="${areaPath}" fill="url(#weightAreaGrad)"/>
            <path d="${linePath}" fill="none" stroke="${brandColor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        `;
    }

    // Punti + valori numerici sopra ogni settimana
    const dotsSvg = coords.map(c => {
        const isActive = c.w === appState.week;
        const labelY = c.y - 11 < topY - 4 ? c.y + 18 : c.y - 10;
        return `
            <g style="cursor:pointer;" onclick="jumpToWeek(${c.w})">
                ${isActive ? `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="9" fill="${brandColor}" opacity="0.22"/>` : ''}
                <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${isActive ? 5.2 : 4.2}" fill="${brandColor}" stroke="${surfaceColor}" stroke-width="2"/>
                <text x="${c.x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" fill="${isActive ? brandColor : textMain}" font-size="10.5" font-weight="800" font-family="Inter, sans-serif">${c.val.toFixed(1)}</text>
            </g>
        `;
    }).join('');

    // Etichette asse X (S1..S6 cliccabili)
    const xLabelsSvg = points.map(p => {
        const isActive = p.w === appState.week;
        return `
            <text x="${p.x.toFixed(1)}" y="${H - 7}" text-anchor="middle" style="cursor:pointer;" onclick="jumpToWeek(${p.w})"
                  fill="${isActive ? brandColor : textDim}" font-size="10.5" font-weight="${isActive ? '800' : '700'}" font-family="Inter, sans-serif">
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
            ${goalSvg}
            ${dotsSvg}
            ${xLabelsSvg}
        </svg>
    `;
}

// ============================================================
//  VISTA REPORT CARICHI (compatibile con pdfexp.js)
// ============================================================
function renderReportView() {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const selector = document.getElementById('export-day-selector');
    const preview = document.getElementById('export-preview');

    if (!currentUser || !currentUser.days || currentUser.days.length === 0) {
        selector.innerHTML = '<option value="">— Nessun giorno —</option>';
        preview.textContent = 'Aggiungi almeno un giorno alla tua scheda per generare il report.';
        currentExportText = '';
        return;
    }

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

function generateReport() {
    const selected = document.getElementById('export-day-selector').value;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    if (!currentUser || !selected) return;

    const daysToExport = selected === '__ALL__'
        ? currentUser.days
        : currentUser.days.filter(d => d.id === selected);

    let md = `# Report Carichi — ${selected === '__ALL__' ? 'Scheda Completa' : daysToExport[0]?.name}\n`;
    md += `Profilo: ${currentUser.name} · Settimana corrente: S${appState.week}\n\n`;

    daysToExport.forEach(day => {
        if (daysToExport.length > 1) md += `## ${day.name}\n\n`;

        day.exercises.forEach(ex => {
            const rawTarget = ex.progression?.[appState.week - 1] || ex.progression?.[0] || '3x10';
            const parsed = parseTargetAndRests(rawTarget);
            const rests = (Array.isArray(ex.rests) && ex.rests.length) ? ex.rests : parsed.rests;
            const restNote = rests.filter(Boolean).length ? ` | Rec: ${rests.filter(Boolean).join(' / ')}` : '';

            md += `### ${ex.name}\n`;
            md += `Target: ${parsed.cleanTarget}${restNote}\n`;

            const weightsStr = [];
            let firstW = null, lastW = null;
            for (let w = 1; w <= 6; w++) {
                const log = appState.logs[`w${w}_${currentUser.id}_${day.id}_${ex.id}`];
                let wArray = log ? (log.weights || []) : [];
                if (log && log.weight && wArray.length === 0) wArray = [log.weight];

                if (wArray.length > 0 && wArray.some(val => val !== '' && val != null)) {
                    const str = wArray.map(val => (val !== '' && val != null) ? val : '-').join(' + ');
                    weightsStr.push(`S${w}: ${str}kg`);
                    const firstNum = parseFloat(wArray[0]);
                    if (!isNaN(firstNum)) {
                        if (firstW === null) firstW = firstNum;
                        lastW = firstNum;
                    }
                } else {
                    weightsStr.push(`S${w}: -`);
                }
            }
            md += `Progressione: ${weightsStr.join(' -> ')}\n`;
            if (firstW !== null && lastW !== null) {
                const diff = Number((lastW - firstW).toFixed(2));
                if (diff > 0) md += `Trend: +${diff}kg\n`;
                else if (diff < 0) md += `Trend: ${diff}kg\n`;
                else md += `Trend: stabile\n`;
            } else {
                md += `Trend: dati insufficienti\n`;
            }
            md += `\n`;
        });
    });

    currentExportText = md;
    document.getElementById('export-preview').textContent = md;
}

function copyExport() {
    if (!currentExportText) return;
    navigator.clipboard.writeText(currentExportText).then(() => {
        const btn = document.getElementById('copy-export-btn');
        const original = btn.innerHTML;
        btn.innerHTML = `${UI_SVG.check} Copiato!`;
        setTimeout(() => { btn.innerHTML = original; }, 1500);
    });
}

// ============================================================
//  MODALI & CHIUSURA POPOVER
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

document.addEventListener('click', (e) => {
    if (e.target.classList?.contains('modal-overlay')) {
        e.target.classList.add('hidden');
        e.target.classList.remove('flex');
    }
    if (openPopoverId && !e.target.closest('.ex-popover')) {
        closeAllPopovers();
    }
});

document.addEventListener('DOMContentLoaded', init);