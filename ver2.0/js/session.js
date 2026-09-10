/* ============================================================
   AVANGUARD 2.0 — SESSION PLAYER + TIMER RECUPERO
   ============================================================ */

'use strict';

let SES = null;        // sessione in corso
let _sesTick = null;   // cronometro
let _rest = null;      // stato recupero {end, raf}

// ---------- Audio (WebAudio, offline) ----------
let _audioCtx = null;
function beep() {
  if (!S.settings.sound) return;
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = _audioCtx.currentTime;
    [0, 0.18, 0.36].forEach((off, i) => {
      const o = _audioCtx.createOscillator();
      const g = _audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t0 + off);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.14);
      o.connect(g); g.connect(_audioCtx.destination);
      o.start(t0 + off); o.stop(t0 + off + 0.2);
    });
  } catch (e) { /* audio non disponibile */ }
}

// ---------- Avvio ----------
function startSession(dayId) {
  const u = me();
  const day = u.days.find(d => d.id === dayId);
  if (!day || !day.exercises.length) { toast('Nessun esercizio in questo giorno'); return; }
  if (!navigator.onLine && 'serviceWorker' in navigator) { /* ok: tutto locale */ }

  SES = {
    dayId,
    dayName: day.name,
    start: Date.now(),
    idx: 0,
    exs: day.exercises.map(ex => {
      const blocks = parseTargetBlocks(ex.progression[S.week - 1] || '3x10');
      const schedaW = firstWeight(dayId, ex.id, S.week) ?? 20;
      return {
        exId: ex.id, name: ex.name,
        blocks,
        setsTotal: blocks.reduce((a, b) => a + (parseNxR(b)?.sets || 3), 0),
        repsFirst: parseNxR(blocks[0])?.reps || 10,
        weight: schedaW,
        done: 0,
      };
    }),
    logged: [],
    prs: [],
  };

  const el = document.getElementById('session');
  el.hidden = false;
  document.body.style.overflow = 'hidden';
  renderSession();
  clearInterval(_sesTick);
  _sesTick = setInterval(renderSessionTimer, 1000);
  buzz(20);
}

// ---------- Render ----------
function renderSession() {
  const ex = SES.exs[SES.idx];
  const rec = recordFor(SES.dayId, ex.exId);
  const bp = plateBreakdown(ex.weight);
  const pl = S.settings.plates && bp
    ? bp.plates.map(p => `<span class="pl" style="width:13px;background:${PLATE_COLORS[p.cls]}" title="${p.kg}"></span>`).join('') + '<span class="pl-bar"></span>'
    : `<span class="pl-note">piastre non mostrate</span>`;

  const setsPills = Array.from({ length: ex.setsTotal }, (_, i) =>
    `<button class="set-pill ${i < ex.done ? 'on' : ''} ${i === ex.done ? 'rec' : ''}" onclick="doSet()" ${i < ex.done ? 'disabled' : ''}>${i < ex.done ? '✓' : i + 1}</button>`).join('');

  document.getElementById('session').innerHTML = `
    <div class="session-head">
      <button class="quit" onclick="quitSession()" aria-label="Esci">${ICO.x}</button>
      <div class="s-info">
        <div class="s-day">${esc(SES.dayName)} · S${S.week}</div>
        <div class="s-timer num" id="ses-timer">00:00</div>
      </div>
      <div class="s-progress num">${SES.idx + 1}<span style="color:var(--faint)">/${SES.exs.length}</span></div>
    </div>
    <div class="ex-dots">${SES.exs.map((e, i) => `<span class="d ${i === SES.idx ? 'cur' : ''} ${e.done >= e.setsTotal ? 'fin' : ''}"></span>`).join('')}</div>

    <div class="session-body">
      <div class="ses-exnum">Esercizio ${SES.idx + 1} di ${SES.exs.length}</div>
      <h2 class="ses-exname">${esc(ex.name)}</h2>
      <div class="ses-target num">${ex.blocks.join(' + ')}${rec != null ? ' · record ' + fmtKg(rec) + ' kg' : ''}</div>

      <div class="load-stepper">
        <button class="stp" onclick="sesStep(-2.5)" aria-label="Meno 2,5 kg"><span class="v">−2,5</span><span class="k">kg</span></button>
        <div class="load-display">
          <div class="val num">${fmtKg(ex.weight)}<small> kg</small></div>
        </div>
        <button class="stp" onclick="sesStep(2.5)" aria-label="Più 2,5 kg"><span class="v">+2,5</span><span class="k">kg</span></button>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="stp fine" onclick="sesStep(-0.5)" aria-label="Meno mezzo kg"><span class="v">−0,5</span></button>
          <button class="stp fine" onclick="sesStep(0.5)" aria-label="Più mezzo kg"><span class="v">+0,5</span></button>
        </div>
      </div>

      <div class="ses-plates">${pl}</div>

      <div class="sets-row">${setsPills}</div>

      <button class="ses-cta" onclick="doSet()">
        ${ICO.check} Serie ${ex.done + 1} di ${ex.setsTotal} — ${fmtKg(ex.weight)} kg
      </button>
      <div class="ses-secondary">
        <button onclick="nextEx(1)" ${SES.idx >= SES.exs.length - 1 ? 'disabled style="opacity:.4"' : ''}>Prossimo esercizio</button>
        <button onclick="finishSession()">Termina</button>
      </div>
    </div>
  `;
  renderSessionTimer();
}

function renderSessionTimer() {
  const el = document.getElementById('ses-timer');
  if (!el || !SES) return;
  const s = Math.floor((Date.now() - SES.start) / 1000);
  el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function sesStep(d) {
  const ex = SES.exs[SES.idx];
  ex.weight = Math.max(0, +(ex.weight + d).toFixed(2));
  buzz(8);
  renderSession();
}

// ---------- Serie ----------
function doSet() {
  const ex = SES.exs[SES.idx];
  if (ex.done >= ex.setsTotal) { nextEx(1); return; }

  // log
  SES.logged.push({ exId: ex.exId, name: ex.name, w: ex.weight, reps: ex.repsFirst });
  ex.done++;

  // PR live
  const rec = recordFor(SES.dayId, ex.exId);
  if (rec != null && ex.weight > rec && !SES.prs.find(p => p.name === ex.name && p.w === ex.weight)) {
    SES.prs.push({ name: ex.name, w: ex.weight, old: rec });
    toast(`<b class="t-gold">RECORD!</b> ${esc(ex.name)}: ${fmtKg(ex.weight)} kg`);
    buzz([30, 40, 30]);
  } else {
    buzz(18);
  }

  // aggiorna carico scheda (preserva i blocchi successivi, se presenti)
  const curW = exWeights(SES.dayId, ex.exId, S.week);
  const newW = [...curW];
  newW[0] = ex.weight;
  setMyLog(SES.dayId, ex.exId, S.week, { weights: newW.map(v => v == null ? '' : v) });

  const finishedEx = ex.done >= ex.setsTotal;
  if (finishedEx) {
    save();
    renderSession();
    setTimeout(() => { if (SES && SES.idx < SES.exs.length - 1) nextEx(1); }, 450);
    startRest();
  } else {
    save();
    renderSession();
    startRest();
  }
}

function nextEx(delta) {
  const ni = SES.idx + delta;
  if (ni < 0 || ni >= SES.exs.length) { if (ni >= SES.exs.length) finishSession(); return; }
  SES.idx = ni;
  stopRest();
  renderSession();
}

// ---------- Recupero ----------
function startRest() {
  stopRest();
  const dur = S.settings.rest;
  _rest = { end: Date.now() + dur * 1000, dur };
  const bar = document.getElementById('restbar') || createRestBar();
  bar.classList.add('open');
  tickRest();
  _rest.iv = setInterval(tickRest, 200);
}
function createRestBar() {
  const div = document.createElement('div');
  div.className = 'restbar';
  div.id = 'restbar';
  div.innerHTML = `
    <div class="rest-inner">
      <div class="rest-ring">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="var(--bg3)" stroke-width="4"/>
          <circle id="rest-arc" cx="26" cy="26" r="22" fill="none" stroke="var(--plate25)" stroke-width="4"
            stroke-linecap="round" stroke-dasharray="138.2" stroke-dashoffset="0"/>
        </svg>
        <span class="rt num" id="rest-short"></span>
      </div>
      <div class="rest-info">
        <div class="rl">Recupero</div>
        <div class="rc num" id="rest-count">--:--</div>
      </div>
      <div class="rest-act">
        <button onclick="addRest(15)">+15s</button>
        <button class="skip" onclick="stopRest()">Salta</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  return div;
}
function tickRest() {
  if (!_rest) return;
  const left = Math.max(0, _rest.end - Date.now());
  const s = Math.ceil(left / 1000);
  const el = document.getElementById('rest-count');
  if (el) {
    el.textContent = '0:' + String(s).padStart(2, '0');
    const short = document.getElementById('rest-short');
    if (short) short.textContent = s > 59 ? Math.ceil(s / 60) + 'm' : s + 's';
    const arc = document.getElementById('rest-arc');
    if (arc) {
      const frac = left / (_rest.dur * 1000);
      arc.style.strokeDashoffset = (138.2 * (1 - Math.min(1, frac))).toFixed(1);
      arc.style.stroke = frac < .2 ? 'var(--plate10)' : 'var(--plate25)';
    }
  }
  if (left <= 0) {
    beep();
    buzz([60, 50, 60]);
    stopRest();
    toast('Recupero <b class="t-green">finito</b> — si riparte');
  }
}
function addRest(sec) {
  if (!_rest) return;
  _rest.end += sec * 1000;
  _rest.dur += sec;
  buzz(8);
}
function stopRest() {
  if (_rest) { clearInterval(_rest.iv); _rest = null; }
  const bar = document.getElementById('restbar');
  if (bar) bar.classList.remove('open');
}

// ---------- Uscita / fine ----------
function quitSession() {
  if (SES && SES.logged.length) {
    if (!confirm('Terminare l\'allenamento e salvare?')) return;
    finishSession();
    return;
  }
  closeSession();
}
function closeSession() {
  clearInterval(_sesTick);
  stopRest();
  SES = null;
  const el = document.getElementById('session');
  el.hidden = true;
  el.innerHTML = '';
  document.body.style.overflow = '';
  const bar = document.getElementById('restbar');
  if (bar) bar.remove();
}

function finishSession() {
  if (!SES.logged.length) { closeSession(); toast('Allenamento vuoto, non salvato'); return; }
  const dur = Math.max(1, Math.round((Date.now() - SES.start) / 60000));
  const vol = SES.logged.reduce((a, s) => a + s.w * s.reps, 0);
  const sets = SES.logged.length;
  const prs = SES.prs;

  addSession({
    id: uid('ses'),
    dayId: SES.dayId,
    dayName: SES.dayName,
    date: todayStr(),
    dur, vol, sets,
    week: S.week,
    setsDetail: SES.logged,
    prs,
  });

  // suggerimento progressione: tutti gli esercizi completati al carico attuale → "aumenta"
  let suggestUp = 0;
  SES.exs.forEach(e => {
    if (e.done >= e.setsTotal) {
      const rec = recordFor(SES.dayId, e.exId);
      if (e.weight >= (rec ?? 0)) suggestUp++;
    }
  });

  const volHero = vol >= 1000
    ? (vol / 1000).toFixed(1).replace('.0', '') + '<small>t</small>'
    : Math.round(vol) + '<small>kg</small>';

  const sumHtml = `
    <div class="sum-hero">
      <div class="big num">${volHero}</div>
      <div class="lbl">volume totale</div>
    </div>
    ${prs.map(p => `
      <div class="pr-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 3 8-9"/><path d="M15 5h6v6"/></svg>
        <b>Record: ${esc(p.name)} — ${fmtKg(p.w)} kg <span style="color:var(--dim);font-weight:500">(era ${fmtKg(p.old)})</span></b>
      </div>`).join('')}
    <div class="sum-stats">
      <div class="sum-stat"><div class="v num">${sets}</div><div class="k">serie</div></div>
      <div class="sum-stat"><div class="v num">${dur}′</div><div class="k">durata</div></div>
      <div class="sum-stat"><div class="v num">${SES.exs.length}</div><div class="k">esercizi</div></div>
    </div>
    ${suggestUp ? `<p style="color:var(--dim);font-size:13px;padding:0 4px">Hai completato tutto su ${suggestUp} eserciz${suggestUp === 1 ? 'io' : 'i'}: prova ad alzare il carico (+2,5 kg) la prossima settimana.</p>` : ''}
    <button class="btn btn-primary" onclick="closeSession();switchTab('scheda',true)">Fatto</button>
  `;

  const el = document.getElementById('session');
  el.innerHTML = `<div class="session-body" style="padding-top:60px">${sumHtml}</div>`;
  clearInterval(_sesTick);
  stopRest();
  buzz([30, 60, 30]);
  save();
}
