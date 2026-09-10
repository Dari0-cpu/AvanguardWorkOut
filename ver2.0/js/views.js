/* ============================================================
   AVANGUARD 2.0 — VISTE: STORICO / PESO / ALTRO
   ============================================================ */

'use strict';

// ================= STORICO =================
function renderStorico() {
  const u = me();
  const sessions = mySessions();
  const c = document.getElementById('storico-content');

  // progressione per esercizio (tutte le settimane)
  const progHtml = u.days.map(day => day.exercises.map(ex => {
    const hist = Array.from({ length: 6 }, (_, i) => firstWeight(day.id, ex.id, i + 1));
    const valid = hist.filter(h => h != null);
    if (!valid.length) return '';
    const best = Math.max(...valid);
    const bestIdx = hist.indexOf(best);
    const first = valid[0];
    const diff = +(best - first).toFixed(1);
    return `
      <div class="ex-prog-item">
        <div class="top">
          <span class="nm">${esc(ex.name)} <span style="color:var(--faint);font-weight:500;font-size:11.5px">· ${esc(day.name)}</span></span>
          <span class="mx num">${fmtKg(best)}<span style="font-size:10px;color:var(--faint)"> kg</span></span>
        </div>
        <div class="weekvals">
          ${hist.map((h, i) => `<span class="wv ${i === bestIdx ? 'best' : ''}"><span class="wk">S${i + 1}</span>${h != null ? fmtKg(h) : '—'}</span>`).join('')}
        </div>
        ${diff !== 0 ? `<div style="margin-top:8px;font-size:11.5px;font-weight:700;color:${diff > 0 ? 'var(--plate10)' : 'var(--plate25)'}">${diff > 0 ? '▲' : '▼'} ${Math.abs(diff)} kg dalla prima settimana</div>` : ''}
      </div>`;
  }).join('')).join('');

  const sessionsHtml = sessions.length ? sessions.slice(0, 30).map(s => {
    const f = fmtDate(s.date);
    const vol = s.sets.reduce((a, st) => a + (st.w || 0) * (st.reps || 0), 0);
    return `
    <div class="session-item">
      <div class="date"><div class="d">${f.day}</div><div class="m">${f.m}</div></div>
      <div class="info">
        <div class="n">${esc(s.dayName)}${s.prs?.length ? ` <span class="pr-chip">PR ×${s.prs.length}</span>` : ''}</div>
        <div class="m num">${s.sets.length} serie · ${s.dur} min</div>
      </div>
      <div class="vol"><div class="v num">${fmtVol(vol)}</div><div class="k">volume</div></div>
    </div>`;
  }).join('') : `<p style="color:var(--faint);font-size:13px;padding:8px 2px">Nessun allenamento registrato. Premi «Inizia allenamento» dalla scheda.</p>`;

  c.innerHTML = `
    <div class="h2">Sessioni</div>
    ${sessionsHtml}
    ${progHtml ? `<div class="h2" style="margin-top:28px">Progressione carichi</div>${progHtml}` : ''}
    <div class="h2" style="margin-top:28px">Report</div>
    <button class="menu-item" onclick="copyReport()">
      <span class="mi-ic">${ICO.copy}</span>
      <span class="mi-tx"><span class="mi-t">Copia report markdown</span><span class="mi-s">Carichi di tutte le settimane, pronto da incollare</span></span>
    </button>
  `;
}

function copyReport() {
  const u = me();
  let md = `# Report Carichi — ${u.name}\nSettimana corrente: S${S.week}\n\n`;
  u.days.forEach(day => {
    md += `## ${day.name}\n`;
    day.exercises.forEach(ex => {
      md += `- **${ex.name}** (${ex.progression[S.week - 1] || '3x10'}): `;
      const rows = [];
      for (let w = 1; w <= 6; w++) {
        const wts = exWeights(day.id, ex.id, w).map(v => v == null ? '-' : fmtKg(v));
        if (wts.length) rows.push(`S${w}: ${wts.join('+')}kg`);
      }
      md += (rows.length ? rows.join(' → ') : 'nessun carico') + '\n';
    });
    md += '\n';
  });
  navigator.clipboard.writeText(md).then(
    () => toast('Report <b class="t-green">copiato</b> negli appunti'),
    () => openModal(`<h3>Report</h3><textarea class="field" rows="10" readonly style="font-size:12px">${esc(md)}</textarea>`)
  );
}

// ================= PESO =================
function renderPeso() {
  const entries = myWeights();
  const c = document.getElementById('peso-content');
  const last = entries[entries.length - 1];
  const first = entries[0];

  // delta ultimi 30 giorni
  let delta30 = null, since = '';
  if (last) {
    const cutoff = new Date(last.d); cutoff.setDate(cutoff.getDate() - 30);
    const ref = entries.filter(e => new Date(e.d) <= cutoff).pop();
    if (ref && ref.d !== last.d) { delta30 = +(last.kg - ref.kg).toFixed(1); since = `da ${fmtDate(ref.d).full}`; }
    else if (first && first.d !== last.d) { delta30 = +(last.kg - first.kg).toFixed(1); since = `da ${fmtDate(first.d).full}`; }
  }

  const stats = entries.length ? `
    <div class="sum-stats" style="margin:14px 0 0">
      <div class="sum-stat"><div class="v num">${fmtKg(Math.min(...entries.map(e => e.kg)))}</div><div class="k">min</div></div>
      <div class="sum-stat"><div class="v num">${fmtKg(entries.reduce((a, e) => a + e.kg, 0) / entries.length)}</div><div class="k">media</div></div>
      <div class="sum-stat"><div class="v num">${fmtKg(Math.max(...entries.map(e => e.kg)))}</div><div class="k">max</div></div>
      <div class="sum-stat"><div class="v num">${entries.length}</div><div class="k">misure</div></div>
    </div>` : '';

  c.innerHTML = `
    <div class="peso-hero">
      <div class="cur num">${last ? fmtKg(last.kg) : '—'}<small> kg</small></div>
      <div class="row">
        <span class="delta30 num ${delta30 == null ? '' : delta30 > 0 ? 'up' : 'down'}" style="color:${delta30 == null ? 'var(--faint)' : ''}">
          ${delta30 == null ? 'prima misura' : (delta30 > 0 ? '▲' : delta30 < 0 ? '▼' : '=') + ' ' + Math.abs(delta30) + ' kg'}
        </span>
        <span class="since">${since}</span>
      </div>
      <div class="peso-chart">${weightChartSVG(entries)}</div>
    </div>
    ${stats}
    <div class="peso-add">
      <input class="field w num" id="peso-input" type="number" step="0.1" inputmode="decimal" placeholder="0,0" onkeydown="if(event.key==='Enter')savePesoNow()">
      <button class="btn btn-primary" style="margin:0;flex:0 0 auto;padding:12px 22px" onclick="savePesoNow()">Registra</button>
    </div>
    <div class="peso-list">
      ${entries.slice().reverse().slice(0, 20).map(e => `
        <div class="wentry">
          <span class="wd">${fmtDate(e.d).full}</span>
          <span class="wv2 num">${fmtKg(e.kg)} kg</span>
          <button class="wdel" onclick="delPeso('${e.d}')" aria-label="Elimina">${ICO.x}</button>
        </div>`).join('')}
    </div>
  `;
  setTimeout(() => document.getElementById('peso-input')?.focus(), 100);
}

function savePesoNow() {
  const v = parseFloat(document.getElementById('peso-input').value.replace(',', '.'));
  if (isNaN(v) || v <= 0 || v > 400) { toast('Inserisci un peso valido'); return; }
  setMyWeight(todayStr(), v);
  save(); buzz(12); renderPeso();
  toast(`<b class="t-green">${fmtKg(v)} kg</b> registrato`);
}
function delPeso(d) {
  if (!confirm(`Eliminare la misura del ${fmtDate(d).full}?`)) return;
  setMyWeight(d, null);
  renderPeso();
}

// ================= ALTRO =================
function renderAltro() {
  const c = document.getElementById('altro-content');
  const st = S.settings;
  c.innerHTML = `
    <div class="menu-group" style="margin-top:8px">
      <div class="h2">Impostazioni palestra</div>
      <div class="menu-item" onclick="openBarModal()">
        <span class="mi-ic">${ICO.barbell}</span>
        <span class="mi-tx"><span class="mi-t">Peso bilanciere</span><span class="mi-s num">${st.bar} kg — usato per calcolare le piastre</span></span>
        <span class="mi-end">${ICO.dots}</span>
      </div>
      <div class="menu-item" onclick="openRestModal()">
        <span class="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg></span>
        <span class="mi-tx"><span class="mi-t">Recupero predefinito</span><span class="mi-s num">${st.rest} secondi</span></span>
        <span class="mi-end">${ICO.dots}</span>
      </div>
      <div class="menu-item" style="cursor:default">
        <span class="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 3 6-8"/><path d="M14 6h4v4"/></svg></span>
        <span class="mi-tx"><span class="mi-t">Mostra piastre</span><span class="mi-s">Suggerisce quali piastre caricare</span></span>
        <label class="switch"><input type="checkbox" ${st.plates ? 'checked' : ''} onchange="S.settings.plates=this.checked;save();renderScheda()"><span class="track"></span><span class="knob"></span></label>
      </div>
      <div class="menu-item" style="cursor:default">
        <span class="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M8 21h8a2 2 0 0 0 2-2v-9H6v9a2 2 0 0 0 2 2z"/><circle cx="9" cy="13" r="0.5" fill="currentColor"/><circle cx="15" cy="13" r="0.5" fill="currentColor"/></svg></span>
        <span class="mi-tx"><span class="mi-t">Suoni e vibrazione</span><span class="mi-s">Beep a fine recupero</span></span>
        <label class="switch"><input type="checkbox" ${st.sound ? 'checked' : ''} onchange="S.settings.sound=this.checked;S.settings.haptics=this.checked;save()"><span class="track"></span><span class="knob"></span></label>
      </div>
    </div>

    <div class="menu-group">
      <div class="h2">Dati</div>
      <button class="menu-item" onclick="exportJSON();toast('Backup <b class=&quot;t-green&quot;>scaricato</b>')">
        <span class="mi-ic">${ICO.download}</span>
        <span class="mi-tx"><span class="mi-t">Esporta backup</span><span class="mi-s">File JSON con tutto dentro</span></span>
      </button>
      <button class="menu-item" onclick="importBackup()">
        <span class="mi-ic">${ICO.upload}</span>
        <span class="mi-tx"><span class="mi-t">Importa backup</span><span class="mi-s">Ripristina da file JSON</span></span>
      </button>
      <button class="menu-item" onclick="openSyncModal()">
        <span class="mi-ic">${ICO.cloud}</span>
        <span class="mi-tx"><span class="mi-t">Sync cloud</span><span class="mi-s">${S.syncKey ? 'chiave: ' + esc(S.syncKey) : 'facoltativo, funziona solo online'}</span></span>
      </button>
      <button class="menu-item danger" onclick="wipeAll()">
        <span class="mi-ic">${ICO.warn}</span>
        <span class="mi-tx"><span class="mi-t" style="color:var(--plate25)">Cancella tutti i dati</span><span class="mi-s">Non si torna indietro</span></span>
      </button>
    </div>

    <div class="menu-group">
      <div class="h2">App</div>
      <button class="menu-item" id="install-menu" onclick="installApp()" style="display:none">
        <span class="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg></span>
        <span class="mi-tx"><span class="mi-t">Installa l'app</span><span class="mi-s">Icona sul telefono, apertura a schermo intero</span></span>
      </button>
      <div class="menu-item" style="cursor:default">
        <span class="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-8 4 16 3-8h6"/></svg></span>
        <span class="mi-tx"><span class="mi-t">Offline</span><span class="mi-s">Funziona senza rete — i dati vivono sul dispositivo</span></span>
      </div>
      <div class="menu-item" style="cursor:default">
        <span class="mi-ic">${ICO.barbell}</span>
        <span class="mi-tx"><span class="mi-t">Avanguard 2.0</span><span class="mi-s">FERRO edition · i colori seguono le piastre: 25 rossa, 20 blu, 15 gialla, 10 verde</span></span>
      </div>
    </div>
  `;
  if (window._deferredPrompt || isIOS()) document.getElementById('install-menu').style.display = 'flex';
}

function openBarModal() {
  openModal(`
    <h3>Peso bilanciere</h3>
    <p style="color:var(--dim);font-size:12.5px;margin-bottom:10px">Serve a calcolare la scomposizione in piastre. Metti 0 per attrezzi guidati (macchine, cavi).</p>
    <div class="seg-ctrl" id="bar-seg">
      ${[20, 15, 10, 0].map(b => `<button class="${S.settings.bar === b ? 'active' : ''}" onclick="setBar(${b})">${b === 0 ? 'nessuna' : b + ' kg'}</button>`).join('')}
    </div>
  `);
}
function setBar(b) {
  S.settings.bar = b; save();
  document.querySelectorAll('#bar-seg button').forEach(x => x.classList.remove('active'));
  event.target.classList.add('active');
  setTimeout(closeModal, 250);
}
function openRestModal() {
  openModal(`
    <h3>Recupero predefinito</h3>
    <div class="seg-ctrl" id="rest-seg">
      ${[60, 90, 120, 180].map(r => `<button class="${S.settings.rest === r ? 'active' : ''}" onclick="setRest(${r})">${r}s</button>`).join('')}
    </div>
  `);
}
function setRest(r) {
  S.settings.rest = r; save();
  setTimeout(closeModal, 250);
}

function importBackup() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        if (importJSON(r.result)) {
          closeModal();
          renderTopbar();
          me() ? switchTab('scheda', true) : renderOnboarding();
          toast('Backup <b class="t-green">importato</b>');
        } else toast('File non valido');
      } catch (e) { toast('File non valido'); }
    };
    r.readAsText(f);
  };
  inp.click();
}

function wipeAll() {
  if (!confirm('Cancellare TUTTI i dati (profili, schede, carichi, pesi)? L\'operazione è definitiva.')) return;
  if (!confirm('Sicuro sicuro? Esporta un backup prima, se ti interessa.')) return;
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(V1_KEY);
  S = defaultState(); save();
  renderTopbar(); renderOnboarding();
  toast('Tutto cancellato');
}

// ---------- Sync cloud ----------
function openSyncModal() {
  openModal(`
    <h3>Sync cloud</h3>
    <p style="color:var(--dim);font-size:12.5px">Con la stessa chiave su più dispositivi ritrovi i tuoi dati. Funziona solo quando sei online: il resto del tempo l'app vive sul telefono.</p>
    <label class="field-label">Chiave segreta</label>
    <input class="field" id="sync-key" value="${esc(S.syncKey)}" placeholder="es. dario-2026">
    <div class="btn-row">
      <button class="btn btn-ghost" onclick="doCloudPull()">${ICO.download} Scarica</button>
      <button class="btn btn-primary" onclick="doCloudPush()">${ICO.upload} Carica</button>
    </div>
    <p id="sync-msg" style="color:var(--dim);font-size:12px;margin-top:12px;min-height:16px"></p>
  `);
}
async function doCloudPush() {
  const k = document.getElementById('sync-key').value.trim();
  if (!k) { toast('Inserisci una chiave'); return; }
  S.syncKey = k; save();
  const msg = document.getElementById('sync-msg');
  try {
    msg.textContent = 'Carico…';
    await cloudPush();
    msg.innerHTML = '<b style="color:var(--plate10)">Dati caricati ✓</b>';
    toast('Sync <b class="t-green">completata</b>');
  } catch (e) {
    msg.textContent = 'Errore: sei offline o il database non risponde.';
  }
  renderAltro();
}
async function doCloudPull() {
  const k = document.getElementById('sync-key').value.trim();
  if (!k) { toast('Inserisci una chiave'); return; }
  S.syncKey = k;
  const msg = document.getElementById('sync-msg');
  try {
    msg.textContent = 'Scarico…';
    await cloudPull();
    msg.innerHTML = '<b style="color:var(--plate10)">Dati scaricati ✓</b>';
    renderTopbar();
    me() ? switchTab('scheda', true) : renderOnboarding();
    toast('Dati <b class="t-green">scaricati</b>');
  } catch (e) {
    msg.textContent = 'Errore: sei offline o la chiave non esiste ancora.';
  }
}
