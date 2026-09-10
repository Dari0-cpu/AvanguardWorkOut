/* ============================================================
   AVANGUARD 2.0 — GRAFICI SVG (dipendenze zero, 100% offline)
   ============================================================ */

'use strict';

/* ---------- Grafico peso corporeo ---------- */
function weightChartSVG(entries) {
  if (!entries || entries.length === 0) return `<div style="padding:24px;text-align:center;color:var(--faint);font-size:13px">Nessun peso registrato</div>`;
  const W = 340, H = 150, P = { t: 14, r: 14, b: 22, l: 34 };
  const vals = entries.map(e => e.kg);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (max - min < 2) { min -= 1; max += 1; } else { const pad = (max - min) * 0.12; min -= pad; max += pad; }
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const x = (i) => P.l + (entries.length === 1 ? iw / 2 : (i / (entries.length - 1)) * iw);
  const y = (v) => P.t + ih - ((v - min) / (max - min)) * ih;

  let path = '';
  entries.forEach((e, i) => { path += (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(e.kg).toFixed(1) + ' '; });
  const area = path + `L${x(entries.length - 1).toFixed(1)} ${(P.t + ih).toFixed(1)} L${x(0).toFixed(1)} ${(P.t + ih).toFixed(1)} Z`;

  let grid = '';
  for (let i = 0; i <= 3; i++) {
    const v = min + ((max - min) * i) / 3;
    const yy = y(v).toFixed(1);
    grid += `<line x1="${P.l}" y1="${yy}" x2="${W - P.r}" y2="${yy}" stroke="#232629" stroke-width="1" ${i === 0 ? '' : 'stroke-dasharray="3 5"'}/>`;
    grid += `<text x="${P.l - 6}" y="${+yy + 3.5}" text-anchor="end" font-size="9" font-weight="600" fill="#63666D">${v.toFixed(1)}</text>`;
  }

  let xlabels = '';
  const stepX = Math.max(1, Math.ceil(entries.length / 6));
  entries.forEach((e, i) => {
    if (i % stepX === 0 || i === entries.length - 1) {
      const f = fmtDate(e.d);
      xlabels += `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9" font-weight="600" fill="#63666D">${f.day} ${f.m}</text>`;
    }
  });

  let dots = '';
  entries.forEach((e, i) => {
    const last = i === entries.length - 1;
    dots += `<circle cx="${x(i).toFixed(1)}" cy="${y(e.kg).toFixed(1)}" r="${last ? 4.5 : 3}" fill="${last ? '#E63B2E' : '#0E0F12'}" stroke="${last ? '#E63B2E' : '#9A9DA5'}" stroke-width="2"/>`;
  });
  const lastE = entries[entries.length - 1];
  const lastLbl = `<text x="${Math.min(x(entries.length - 1), W - P.r - 4).toFixed(1)}" y="${(y(lastE.kg) - 10).toFixed(1)}" text-anchor="end" font-size="11" font-weight="700" fill="#EDEEE8">${lastE.kg.toFixed(1)} kg</text>`;

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Andamento peso corporeo">
    ${grid}${xlabels}
    <path d="${area}" fill="rgba(230,59,46,.07)"/>
    <path d="${path}" fill="none" stroke="#E63B2E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}${lastLbl}
  </svg>`;
}

/* ---------- Bilanciere SVG con piastre ---------- */
function barbellSVG(load, height = 72) {
  const W = 320, H = 84, cy = H / 2 - 8;
  const fallback = (msg) => `<svg viewBox="0 0 ${W} ${H}" height="${height}" style="width:100%"><text x="${W / 2}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#63666D">${esc(msg)}</text></svg>`;
  const bp = plateBreakdown(load);
  if (!bp) return fallback('carico non componibile con piastre');

  const plates = bp.plates;
  const barLen = 96;
  const pw = (kg) => 7 + kg * 0.55; // larghezza piastra proporzionale al kg
  const platesW = plates.reduce((a, p) => a + pw(p.kg) + 2.5, 0);
  const startX = (W - (barLen + platesW * 2)) / 2;
  if (startX < 4) return fallback(plates.map(p => p.kg).join(' · ') + ' kg per lato');

  const barH = 5;
  let sides = '';
  [1, -1].forEach(side => {
    let px = side === 1 ? startX + barLen : startX + barLen + platesW * 2;
    plates.forEach(p => {
      const w = pw(p.kg);
      const h = 18 + p.kg * 1.7;
      let rx;
      if (side === 1) { rx = px; px += w + 2.5; }
      else { px -= w + 2.5; rx = px; }
      sides += `<rect x="${rx.toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2.5" fill="${PLATE_COLORS[p.cls]}"/>`;
    });
    const colX = side === 1 ? startX + barLen - 6 : startX + barLen + platesW * 2 + 2;
    sides += `<rect x="${colX.toFixed(1)}" y="${cy - 9}" width="4" height="18" rx="1.5" fill="#9A9DA5"/>`;
  });

  const barX1 = startX, barX2 = startX + barLen + platesW * 2;
  let bar = `<rect x="${barX1}" y="${cy - barH / 2}" width="${(barX2 - barX1).toFixed(1)}" height="${barH}" rx="2.5" fill="#EDEEE8"/>`;
  for (let i = 1; i <= 5; i++) {
    const kx = barX1 + barLen / 2 - 10 + i * 4;
    bar += `<rect x="${kx.toFixed(1)}" y="${cy - barH / 2 + 1}" width="1.5" height="${barH - 2}" fill="#0E0F12" opacity=".3"/>`;
  }

  const perSide = bp.perSide > 0 ? ` · ${(bp.perSide % 1 === 0 ? bp.perSide.toFixed(0) : bp.perSide.toFixed(2))} kg/lato` : '';
  const label = `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#9A9DA5">${plates.length ? 'per lato: ' + plates.map(p => p.kg).join(' · ') + perSide : 'solo bilanciere'}</text>`;

  return `<svg viewBox="0 0 ${W} ${H}" height="${height}" style="width:100%" role="img" aria-label="Bilanciere ${load} kg">${bar}${sides}${label}</svg>`;
}

/* ---------- Mini riga piastre (per card esercizio) ---------- */
function platesMini(load) {
  if (!S.settings.plates) return '';
  const bp = plateBreakdown(load);
  if (!bp) return '';
  let chips = '';
  bp.plates.forEach(p => {
    const h = p.kg >= 20 ? 17 : p.kg >= 10 ? 14 : 11;   // altezza proporzionale
    const w = p.kg >= 20 ? 15 : p.kg >= 10 ? 12 : 9;
    chips += `<span class="pl" style="background:${PLATE_COLORS[p.cls]};height:${h}px;width:${w}px" title="${p.kg} kg"></span>`;
  });
  const bar = bp.plates.length ? `<span class="pl-bar"></span>` : '';
  return `<div class="plates-line">${chips}${bar}</div>`;
}
