/* ====================================================================
   AVANGUARD WORKOUT - APP LOGIC
   ==================================================================== */

// ============================================================
//  SUPABASE CONFIG (mantenuto uguale per non perdere il database)
// ============================================================
const SUPABASE_URL = "https://rvodpmmzwvvdcvsiqxhr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b2RwbW16d3Z2ZGN2c2lxeGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjA2NTksImV4cCI6MjA5OTU5NjY1OX0.hcQaVKdaKPfLsTaH896t1NjE3aXfdkxOBezoqWZ5iWA";

// ============================================================
//  TEMA (colori accent + modalità chiaro/scuro)
// ============================================================
const THEMES = {
    red:    { 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', rgb: '239, 68, 68' },
    blue:   { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', rgb: '59, 130, 246' },
    green:  { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', rgb: '34, 197, 94' },
    yellow: { 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', rgb: '234, 179, 8' },
    purple: { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', rgb: '168, 85, 247' },
    orange: { 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', rgb: '249, 115, 22' },
    pink:   { 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', rgb: '236, 72, 153' },
    cyan:   { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', rgb: '6, 182, 212' },
};

// ============================================================
//  STATO APPLICATIVO
// ============================================================
let appState = {
    users: [],
    currentUserId: null,
    week: 1,
    logs: {},
    bodyWeight: {},            // { [userId]: { w1: 75, w2: 75.5, ... } }
    theme: 'red',
    mode: 'dark',              // 'dark' | 'light'
    syncKey: '',
    carried: {},               // set di logKey per cui abbiamo già riportato i carichi dalla settimana precedente
};

let _supabaseClient = null;
let tempTargetDayId = null;
let tempEditDayId = null;
let tempEditExId = null;
let currentExportText = "";
let _weightChart = null;

// ============================================================
//  INIT
// ============================================================
async function init() {
    if (SUPABASE_URL && SUPABASE_KEY) {
        try {
            _supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            document.getElementById('cloud-warning').classList.add('hidden');
        } catch (e) {
            console.error('Supabase init failed', e);
        }
    }

    const savedData = localStorage.getItem('gym_tracker_pro_v6');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        appState = { ...appState, ...parsed };
        //migrazione: assicura che tutti i campi esistano
        if (!appState.bodyWeight) appState.bodyWeight = {};
        if (!appState.carried) appState.carried = {};
        if (!appState.users) appState.users = [];
    }

    // Prima apertura: stato vuoto (niente Dario default)
    if (!appState.users || appState.users.length === 0) {
        appState.users = [];
        appState.currentUserId = null;
    }

    document.getElementById('cloud-sync-key').value = appState.syncKey || '';
    applyTheme();
    applyMode();

    if (_supabaseClient && appState.syncKey) {
        await pullFromCloud();
    }

    updateCloudStatusUi();
    renderApp();
}

// ============================================================
//  PERSISTENZA + CLOUD
// ============================================================
async function saveData() {
    localStorage.setItem('gym_tracker_pro_v6', JSON.stringify(appState));
    if (_supabaseClient && appState.syncKey) {
        updateCloudStatusUi(true);
        try {
            await _supabaseClient.from('gym_sync').upsert({ id: appState.syncKey, state: appState });
            updateCloudStatusUi();
        } catch (e) {
            console.error("Errore salvataggio cloud:", e);
        }
    }
}

async function pullFromCloud() {
    if (!_supabaseClient || !appState.syncKey) return;
    try {
        const { data, error } = await _supabaseClient
            .from('gym_sync')
            .select('state')
            .eq('id', appState.syncKey)
            .single();
        if (data && data.state) {
            appState = { ...appState, ...data.state };
            if (!appState.bodyWeight) appState.bodyWeight = {};
            if (!appState.carried) appState.carried = {};
            localStorage.setItem('gym_tracker_pro_v6', JSON.stringify(appState));
            applyTheme();
            applyMode();
        }
    } catch (e) {
        console.error("Errore scaricamento cloud:", e);
    }
}

async function saveCloudKey() {
    const key = document.getElementById('cloud-sync-key').value.trim();
    if (!key) { alert("Inserisci una chiave valida!"); return; }
    appState.syncKey = key;
    if (_supabaseClient) {
        await pullFromCloud();
        await saveData();
    }
    closeModal('cloud-modal');
    updateCloudStatusUi();
    renderApp();
}

function updateCloudStatusUi(isSyncing = false) {
    const dot = document.getElementById('cloud-status-dot');
    const icon = document.getElementById('cloud-icon');
    if (!_supabaseClient) {
        dot.className = "absolute top-0 right-0 w-2.5 h-2.5 bg-neutral-700 rounded-full border";
        dot.style.borderColor = 'var(--bg)';
        icon.className = "ph-bold ph-cloud-slash text-2xl text-neutral-600";
    } else if (!appState.syncKey) {
        dot.className = "absolute top-0 right-0 w-2.5 h-2.5 bg-yellow-500 rounded-full border";
        dot.style.borderColor = 'var(--bg)';
        icon.className = "ph-bold ph-cloud text-2xl text-yellow-500";
    } else if (isSyncing) {
        dot.className = "absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border sync-pulse";
        dot.style.borderColor = 'var(--bg)';
        icon.className = "ph-bold ph-cloud-arrow-up text-2xl text-blue-400";
    } else {
        dot.className = "absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border";
        dot.style.borderColor = 'var(--bg)';
        dot.style.boxShadow = '0 0 8px #10b981';
        icon.className = "ph-bold ph-cloud text-2xl text-emerald-400";
    }
}

// ============================================================
//  TEMA E MODE
// ============================================================
function applyTheme() {
    const t = THEMES[appState.theme] || THEMES.red;
    const root = document.documentElement;
    root.style.setProperty('--brand-400', t[400]);
    root.style.setProperty('--brand-500', t[500]);
    root.style.setProperty('--brand-600', t[600]);
    root.style.setProperty('--brand-700', t[700]);
    root.style.setProperty('--brand-rgb', t.rgb);
    // rigenero le varianti alpha
    root.style.setProperty('--brand-50',  `rgba(${t.rgb}, .08)`);
    root.style.setProperty('--brand-100', `rgba(${t.rgb}, .14)`);
    root.style.setProperty('--brand-200', `rgba(${t.rgb}, .22)`);
    // attiva swatch
    document.querySelectorAll('[data-color-swatch]').forEach(el => {
        el.classList.toggle('active', el.dataset.colorSwatch === appState.theme);
    });
}

function applyMode() {
    document.documentElement.setAttribute('data-theme', appState.mode);
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
    saveData();
}

// ============================================================
//  PARSING TARGET -> blocchi di input
//  Regola: il "+" separa blocchi SOLO se entrambi i lati
//  contengono un pattern "NxR" (es. 3x10). Se uno dei due
//  lati non ha "x" (es. 3x10+10 = reps alternate dx/sx),
//  resta UN SOLO blocco.
// ============================================================
function parseTargetBlocks(targetText) {
    if (!targetText) return ['3x10'];
    const rawParts = targetText.split('+').map(p => p.trim()).filter(p => p !== '');
    if (rawParts.length === 0) return [targetText];

    const hasNxR = (s) => /\d\s*x\s*\d/i.test(s);

    const blocks = [];
    let current = '';
    for (const part of rawParts) {
        if (current === '') {
            current = part;
        } else {
            const currentHasX = hasNxR(current);
            const partHasX = hasNxR(part);
            if (currentHasX && partHasX) {
                blocks.push(current);
                current = part;
            } else {
                // stesso blocco (reps alternate tipo 10+10)
                current = current + ' + ' + part;
            }
        }
    }
    if (current !== '') blocks.push(current);
    return blocks.length > 0 ? blocks : [targetText];
}

// ============================================================
//  RENDERS
// ============================================================
function renderApp() {
    document.getElementById('week-display').innerText = appState.week;

    // User selector
    const userSelector = document.getElementById('user-selector');
    userSelector.innerHTML = '';
    appState.users.forEach(user => {
        const opt = document.createElement('option');
        opt.value = user.id; opt.textContent = user.name;
        if (user.id === appState.currentUserId) opt.selected = true;
        userSelector.appendChild(opt);
    });

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const daysContainer = document.getElementById('days-container');
    daysContainer.innerHTML = '';

    // EMPTY STATE: nessun utente OPPURE utente senza giorni
    if (!currentUser || !currentUser.days || currentUser.days.length === 0) {
        daysContainer.innerHTML = renderEmptyState();
        return;
    }

    currentUser.days.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-card mb-4';

        const headerHtml = `
            <div class="p-5 flex justify-between items-center cursor-pointer select-none hover:bg-surface-2 transition-colors" onclick="toggleDay('${day.id}')">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--brand-50); color: var(--brand-500);">
                        <i class="ph-bold ph-dumbbell"></i>
                    </div>
                    <h2 class="text-lg font-extrabold truncate">${escapeHtml(day.name)}</h2>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="event.stopPropagation(); deleteDay('${day.id}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-dim hover:text-brand-500 hover:bg-surface-3 transition-colors" title="Elimina giorno">
                        <i class="ph-fill ph-trash"></i>
                    </button>
                    <i id="icon-${day.id}" class="ph-bold ph-caret-down transition-transform duration-300 text-lg text-muted ${day.isOpen ? 'rotate-180' : ''}"></i>
                </div>
            </div>
        `;

        let exHtml = `<div class="space-y-3 px-5 pb-5">`;
        if (day.exercises.length === 0) {
            exHtml += `<p class="text-dim text-sm italic text-center py-6">Nessun esercizio. Aggiungine uno qui sotto 👇</p>`;
        }

        day.exercises.forEach(ex => {
            exHtml += renderExerciseCard(currentUser, day, ex);
        });

        exHtml += `
            <div class="flex gap-2 mt-4 pt-4 divider-soft">
                <button onclick="prepareSingleAdd('${day.id}')" class="btn btn-ghost flex-1 !py-3 !text-xs">
                    <i class="ph-bold ph-plus"></i> SINGOLO
                </button>
                <button onclick="prepareBulkAdd('${day.id}')" class="btn btn-outline flex-1 !py-3 !text-xs">
                    <i class="ph-bold ph-lightning"></i> INCOLLA LISTA
                </button>
            </div>
        </div>`;

        dayDiv.innerHTML = headerHtml + `<div id="content-${day.id}" class="accordion-content ${day.isOpen ? 'open' : ''}">${exHtml}</div>`;
        daysContainer.appendChild(dayDiv);
    });

    // Aggiorna badge peso corporeo nella pill dell'header
    updateWeightPill();
}

function renderExerciseCard(currentUser, day, ex) {
    const logKey = `w${appState.week}_${currentUser.id}_${day.id}_${ex.id}`;
    const log = appState.logs[logKey] || { done: false, weights: [], up: false };
    if (log.weight && (!log.weights || log.weights.length === 0)) log.weights = [log.weight];
    const weightsArray = log.weights || [];

    let targetText = ex.progression[appState.week - 1] || ex.progression[ex.progression.length - 1] || "3x10";
    const blocks = parseTargetBlocks(targetText);

    // Badge "Aumenta carico"
    let upBadgeHtml = '';
    if (appState.week > 1) {
        const prevLogKey = `w${appState.week - 1}_${currentUser.id}_${day.id}_${ex.id}`;
        const prevLog = appState.logs[prevLogKey];
        if (prevLog && prevLog.up) {
            upBadgeHtml = `<div class="up-badge"><i class="ph-fill ph-fire text-sm"></i> Obiettivo: aumenta il carico</div>`;
        }
    }

    // Carichi settimana precedente (per hint)
    let prevWeights = null;
    if (appState.week > 1) {
        const prevLogKey = `w${appState.week - 1}_${currentUser.id}_${day.id}_${ex.id}`;
        const prevLog = appState.logs[prevLogKey];
        if (prevLog && prevLog.weights && prevLog.weights.some(v => v !== '' && v !== undefined && v !== null)) {
            prevWeights = prevLog.weights;
        }
    }

    // Riporto automatico carichi: se la settimana corrente è vuota
    // e abbiamo carichi nella settimana precedente, copiamoli automaticamente.
    const isCurrentEmpty = !weightsArray.some(v => v !== '' && v !== undefined && v !== null);
    if (isCurrentEmpty && prevWeights && !appState.carried[logKey]) {
        // Copia i pesi della settimana precedente
        appState.logs[logKey] = {
            ...(appState.logs[logKey] || {}),
            weights: prevWeights.map(v => v || ''),
            done: false,
            up: false,
            carried: true,
        };
        appState.carried[logKey] = true;
        saveData();
        // Aggiorna locals dopo il carry
        const newLog = appState.logs[logKey];
        return renderExerciseCardInternal(day.id, ex, logKey, newLog, targetText, blocks, upBadgeHtml, true);
    }

    return renderExerciseCardInternal(day.id, ex, logKey, log, targetText, blocks, upBadgeHtml, !!log.carried);
}

function renderExerciseCardInternal(dayId, ex, logKey, log, targetText, blocks, upBadgeHtml, isCarried) {
    const weightsArray = log.weights || [];

    let inputsHtml = '';
    blocks.forEach((block, i) => {
        const val = weightsArray[i] ?? '';
        inputsHtml += `
            <div class="flex items-center justify-between gap-3 mt-3 w-full">
                <div class="flex flex-col flex-1 min-w-0">
                    <span class="text-xs font-bold brand-text uppercase tracking-wide leading-tight truncate">${escapeHtml(block)}</span>
                </div>
                <div class="weight-input-wrap">
                    <input type="number" step="0.5" inputmode="decimal"
                        placeholder="0.0" value="${val}"
                        onchange="updateWeight('${logKey}', this.value, ${i})">
                    <span class="unit">Kg</span>
                </div>
            </div>
        `;
    });

    const carriedBadge = isCarried ? `<span class="carried-badge"><i class="ph ph-arrow-fat-up"></i> da S${appState.week - 1}</span>` : '';

    return `
        <div class="exercise-card p-4 ${log.done ? 'done' : ''}">
            <div class="flex items-start gap-3">
                <label class="cursor-pointer mt-1 flex-shrink-0">
                    <input type="checkbox" class="sr-only" ${log.done ? 'checked' : ''} onchange="toggleDone('${logKey}', this.checked)">
                    <span class="ex-check"><i class="ph-bold ph-check"></i></span>
                </label>
                <div class="flex-1 min-w-0">
                    ${upBadgeHtml}
                    <div class="flex justify-between items-start gap-2 pb-2 border-b border-app">
                        <h3 class="font-bold text-app text-[15px] break-words leading-tight flex-1">
                            ${escapeHtml(ex.name)}${carriedBadge}
                        </h3>
                        <div class="flex gap-1.5 flex-shrink-0">
                            <button onclick="toggleUpFlag('${logKey}')" class="up-toggle ${log.up ? 'active' : ''}" title="Aumenta carico settimana prossima">
                                <i class="ph-bold ph-trend-up text-base"></i>
                            </button>
                            <button onclick="openEditEx('${dayId}','${ex.id}')" class="up-toggle" title="Modifica esercizio">
                                <i class="ph-bold ph-pencil-simple text-base"></i>
                            </button>
                            <button onclick="deleteEx('${dayId}','${ex.id}')" class="up-toggle hover:!text-brand-500" title="Elimina">
                                <i class="ph-fill ph-trash text-base"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-col">${inputsHtml}</div>
                </div>
            </div>
        </div>
    `;
}

function renderEmptyState() {
    return `
        <div class="empty-hero mt-8">
            <div class="mascot">💪</div>
            <h2 class="text-2xl font-black mt-4 mb-2">Pronto a sollevare?</h2>
            <p class="text-muted mb-6 max-w-sm mx-auto text-sm">Non hai ancora nessuna scheda.<br>Aggiungi la tua scheda qui per iniziare a tracciare i carichi.</p>
            <div class="flex flex-col gap-3 max-w-xs mx-auto">
                <button onclick="openModal('add-day-modal')" class="btn btn-primary">
                    <i class="ph-bold ph-plus-circle"></i> Aggiungi la tua scheda qui
                </button>
                <button onclick="openModal('add-user-modal')" class="btn btn-ghost">
                    <i class="ph-bold ph-user-plus"></i> Crea un profilo
                </button>
            </div>
        </div>
    `;
}

// helper per escape HTML nei nomi utente
function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

// ============================================================
//  GIORNI: toggle / add / delete
// ============================================================
function toggleDay(dayId) {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === dayId);
    day.isOpen = !day.isOpen;
    const content = document.getElementById(`content-${dayId}`);
    const icon = document.getElementById(`icon-${dayId}`);
    if (day.isOpen) { content.classList.add('open'); icon.classList.add('rotate-180'); }
    else { content.classList.remove('open'); icon.classList.remove('rotate-180'); }
    saveData();
}

function saveDay() {
    const name = document.getElementById('new-day-name').value.trim();
    if (!name) return;
    let currentUser = appState.users.find(u => u.id === appState.currentUserId);
    // Se non esiste nessun utente, creiamo un profilo default "Io"
    if (!currentUser) {
        const newId = 'u_' + Date.now();
        appState.users.push({ id: newId, name: 'Io', days: [] });
        appState.currentUserId = newId;
        currentUser = appState.users.find(u => u.id === newId);
    }
    currentUser.days.push({ id: 'd_' + Date.now(), name: name, isOpen: true, exercises: [] });
    document.getElementById('new-day-name').value = '';
    saveData(); closeModal('add-day-modal'); renderApp();
}

function deleteDay(dayId) {
    if (!confirm('Eliminare questo giorno e tutti i suoi esercizi?')) return;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    currentUser.days = currentUser.days.filter(d => d.id !== dayId);
    saveData(); renderApp();
}

// ============================================================
//  UTENTI
// ============================================================
function switchUser(userId) {
    appState.currentUserId = userId;
    saveData();
    renderApp();
}

function saveUser() {
    const name = document.getElementById('new-user-name').value.trim();
    if (!name) return;
    const newId = 'u_' + Date.now();
    appState.users.push({ id: newId, name: name, days: [] });
    appState.currentUserId = newId;
    document.getElementById('new-user-name').value = '';
    saveData(); closeModal('add-user-modal'); renderApp();
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
    saveData(); closeModal('edit-user-modal'); renderApp();
}

function deleteUser() {
    if (appState.users.length <= 1) { alert("Non puoi eliminare l'unico profilo rimasto!"); return; }
    if (!confirm("Vuoi eliminare questo profilo e tutti i suoi dati?")) return;
    appState.users = appState.users.filter(u => u.id !== appState.currentUserId);
    appState.currentUserId = appState.users[0].id;
    saveData(); closeModal('edit-user-modal'); renderApp();
}

// ============================================================
//  ESERCIZI: add (singolo + bulk), edit, delete
// ============================================================
function prepareSingleAdd(dayId) { tempTargetDayId = dayId; openModal('single-add-modal'); }
function prepareBulkAdd(dayId) { tempTargetDayId = dayId; openModal('bulk-add-modal'); }

function saveSingleExercise() {
    const name = document.getElementById('single-ex-name').value.trim();
    const target = document.getElementById('single-ex-target').value.trim() || '3x10';
    if (!name) return;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === tempTargetDayId);
    day.exercises.push({ id: 'e_' + Date.now(), name: name, progression: Array(6).fill(target) });
    document.getElementById('single-ex-name').value = '';
    document.getElementById('single-ex-target').value = '';
    saveData(); closeModal('single-add-modal'); renderApp();
}

function saveBulkExercises() {
    const text = document.getElementById('bulk-text').value;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) return;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === tempTargetDayId);
    lines.forEach((line, index) => {
        let name = line, target = "3x10";
        // separa sul primo trattino (es. "Panca piana - 4x8 + 1x15")
        const dashIdx = line.indexOf('-');
        if (dashIdx > 0) {
            name = line.slice(0, dashIdx).trim();
            target = line.slice(dashIdx + 1).trim() || '3x10';
        }
        day.exercises.push({ id: 'e_bulk_' + Date.now() + '_' + index, name: name, progression: Array(6).fill(target) });
    });
    document.getElementById('bulk-text').value = '';
    saveData(); closeModal('bulk-add-modal'); renderApp();
}

function deleteEx(dayId, exId) {
    if (!confirm('Togliere questo esercizio?')) return;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === dayId);
    day.exercises = day.exercises.filter(e => e.id !== exId);
    saveData(); renderApp();
}

function openEditEx(dayId, exId) {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === dayId);
    const ex = day.exercises.find(e => e.id === exId);
    if (!ex) return;
    tempEditDayId = dayId;
    tempEditExId = exId;
    document.getElementById('edit-ex-name').value = ex.name;
    document.getElementById('edit-ex-target').value = ex.progression[appState.week - 1] || ex.progression[0] || '3x10';
    document.getElementById('edit-ex-apply-all').checked = false;
    document.getElementById('edit-ex-week-label').textContent = appState.week;
    openModal('edit-ex-modal');
}

function saveEditEx() {
    const newName = document.getElementById('edit-ex-name').value.trim();
    const newTarget = document.getElementById('edit-ex-target').value.trim() || '3x10';
    const applyAll = document.getElementById('edit-ex-apply-all').checked;
    if (!newName) return;

    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === tempEditDayId);
    const ex = day.exercises.find(e => e.id === tempEditExId);
    ex.name = newName;
    if (applyAll) {
        ex.progression = Array(6).fill(newTarget);
    } else {
        // modifica solo la settimana corrente
        if (!ex.progression || ex.progression.length < 6) {
            ex.progression = Array(6).fill(ex.progression?.[0] || newTarget);
        }
        ex.progression[appState.week - 1] = newTarget;
    }
    saveData(); closeModal('edit-ex-modal'); renderApp();
}

// ============================================================
//  LOGS: toggle done, update weight, toggle up
// ============================================================
function toggleDone(logKey, isChecked) {
    if (!appState.logs[logKey]) appState.logs[logKey] = { weights: [] };
    appState.logs[logKey].done = isChecked;
    saveData(); renderApp();
}

function updateWeight(logKey, value, index) {
    if (!appState.logs[logKey]) appState.logs[logKey] = { done: false, weights: [], up: false };
    if (!appState.logs[logKey].weights) appState.logs[logKey].weights = [];
    appState.logs[logKey].weights[index] = value;
    // L'utente ha modificato manualmente → non è più "carried"
    if (appState.logs[logKey].carried) appState.logs[logKey].carried = false;
    saveData();
}

function toggleUpFlag(logKey) {
    if (!appState.logs[logKey]) appState.logs[logKey] = { weights: [] };
    appState.logs[logKey].up = !appState.logs[logKey].up;
    saveData(); renderApp();
}

// ============================================================
//  SETTIMANE
// ============================================================
function changeWeek(delta) {
    let newWeek = appState.week + delta;
    if (newWeek >= 1 && newWeek <= 6) {
        appState.week = newWeek;
        // reset dei "carried" per la nuova settimana, così il riporto
        // automatico viene ricalcolato al primo render
        // (lasciamo carried invariato: traccia già per logKey che è univoco)
        saveData(); renderApp();
    }
}

// ============================================================
//  PESO CORPOREO
// ============================================================
function getUserWeights() {
    if (!appState.currentUserId) return {};
    return appState.bodyWeight[appState.currentUserId] || {};
}

function setUserWeight(week, value) {
    if (!appState.currentUserId) return;
    if (!appState.bodyWeight[appState.currentUserId]) appState.bodyWeight[appState.currentUserId] = {};
    if (value === '' || value == null) {
        delete appState.bodyWeight[appState.currentUserId][week];
    } else {
        appState.bodyWeight[appState.currentUserId][week] = parseFloat(value);
    }
    saveData();
}

function updateWeightPill() {
    const pill = document.getElementById('weight-pill-text');
    if (!pill) return;
    const w = getUserWeights()['w' + appState.week];
    pill.textContent = w != null ? w.toFixed(1) + ' kg' : '— kg';
}

function openWeightModal() {
    if (!appState.currentUserId) {
        alert('Crea prima un profilo utente!');
        return;
    }
    const input = document.getElementById('weight-input');
    const w = getUserWeights()['w' + appState.week];
    input.value = w != null ? w : '';
    document.getElementById('weight-week-label').textContent = appState.week;
    openModal('weight-modal');
    // Render chart dopo che la modal è visibile
    setTimeout(renderWeightChart, 50);
}

function saveWeight() {
    const value = document.getElementById('weight-input').value.trim();
    setUserWeight('w' + appState.week, value);
    renderWeightChart();
    updateWeightPill();
    // non chiudiamo la modale così l'utente vede subito il grafico aggiornarsi
}

function renderWeightChart() {
    const canvas = document.getElementById('weight-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = getUserWeights();

    const labels = [];
    const values = [];
    for (let w = 1; w <= 6; w++) {
        labels.push('S' + w);
        const v = data['w' + w];
        values.push(v != null ? v : null);
    }

    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--brand-500').trim();
    const brandRgb = getComputedStyle(document.documentElement).getPropertyValue('--brand-rgb').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

    if (_weightChart) {
        _weightChart.destroy();
    }
    _weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Peso (kg)',
                data: values,
                borderColor: brandColor,
                backgroundColor: `rgba(${brandRgb}, 0.15)`,
                fill: true,
                tension: 0.32,
                pointBackgroundColor: brandColor,
                pointBorderColor: brandColor,
                pointRadius: 5,
                pointHoverRadius: 7,
                spanGaps: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ctx.parsed.y != null ? ctx.parsed.y.toFixed(1) + ' kg' : '—'
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: {
                    ticks: { color: textColor, callback: (v) => v + ' kg' },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

// ============================================================
//  REPORT CARICHI (Markdown export)
// ============================================================
function openExportModal() {
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    if (!currentUser || currentUser.days.length === 0) {
        alert("Nessun giorno presente.");
        return;
    }
    const selector = document.getElementById('export-day-selector');
    selector.innerHTML = '';
    currentUser.days.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id; opt.textContent = d.name;
        selector.appendChild(opt);
    });
    generateReport();
    openModal('export-modal');
}

function generateReport() {
    const dayId = document.getElementById('export-day-selector').value;
    const currentUser = appState.users.find(u => u.id === appState.currentUserId);
    const day = currentUser.days.find(d => d.id === dayId);
    if (!day) return;

    let md = `# Report Carichi: ${day.name}\n`;
    md += `Profilo: ${currentUser.name}  ·  Settimana corrente: S${appState.week}\n\n`;

    day.exercises.forEach(ex => {
        md += `### ${ex.name}\n`;
        let weightsStr = [];
        let firstW = null, lastW = null;
        for (let w = 1; w <= 6; w++) {
            const logKey = `w${w}_${currentUser.id}_${day.id}_${ex.id}`;
            const log = appState.logs[logKey];
            let wArray = log ? (log.weights || []) : [];
            if (log && log.weight && wArray.length === 0) wArray.push(log.weight);

            if (wArray.length > 0 && wArray.some(val => val !== '')) {
                const str = wArray.map(val => val || '-').join(' + ');
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
        md += `Progressione: ${weightsStr.join('  ->  ')}\n`;
        if (firstW !== null && lastW !== null) {
            const diff = lastW - firstW;
            if (diff > 0)      md += `Trend: +${diff}kg\n`;
            else if (diff < 0) md += `Trend: ${diff}kg\n`;
            else               md += `Trend: stabile\n`;
        } else {
            md += `Trend: dati insufficienti\n`;
        }
        md += `\n`;
    });

    currentExportText = md;
    document.getElementById('export-preview').textContent = md;
}

function copyExport() {
    navigator.clipboard.writeText(currentExportText).then(() => {
        const btn = document.getElementById('copy-export-btn');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="ph-bold ph-check"></i> Copiato!';
        setTimeout(() => { btn.innerHTML = original; }, 1500);
    });
}

// ============================================================
//  MODALI
// ============================================================
function openModal(id) {
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    el.classList.add('flex');
}
function closeModal(id) {
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.classList.remove('flex');
}

// ============================================================
//  AVVIO
// ============================================================
document.addEventListener('DOMContentLoaded', init);
