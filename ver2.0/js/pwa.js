/* ============================================================
   AVANGUARD 2.0 — PWA: service worker, installazione, iOS
   ============================================================ */

'use strict';

// ---------- Registrazione SW ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('SW non registrato (funziona comunque come pagina):', err);
    });
  });
}

// ---------- Installazione ----------
window._deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window._deferredPrompt = e;
  showInstallTip();
});

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function showInstallTip() {
  if (localStorage.getItem('avanguard_tip_dismissed')) return;
  const tip = document.getElementById('install-tip');
  if (!tip) return;
  tip.innerHTML = `
    <span class="it-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg></span>
    <span class="it-tx"><b>Avanguard sul telefono</b>Si usa offline, si apre a schermo intero.</span>
    <button class="it-btn" onclick="installApp()">Installa</button>
    <button class="it-x" onclick="dismissInstallTip()" aria-label="Chiudi"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  `;
  tip.hidden = false;
}

function dismissInstallTip() {
  const tip = document.getElementById('install-tip');
  if (tip) tip.hidden = true;
  localStorage.setItem('avanguard_tip_dismissed', '1');
}

async function installApp() {
  dismissInstallTip();
  if (window._deferredPrompt) {
    window._deferredPrompt.prompt();
    const { outcome } = await window._deferredPrompt.userChoice;
    window._deferredPrompt = null;
    if (outcome === 'accepted') toast('App <b class="t-green">installata</b>');
  } else if (isIOS()) {
    openModal(`
      <h3>Installa su iPhone</h3>
      <ol style="color:var(--dim);font-size:14px;line-height:2;padding-left:20px">
        <li>Tocca <b style="color:var(--ink)">Condividi</b> <span style="color:var(--faint)">(il quadrato con la freccia)</span></li>
        <li>Scorri e tocca <b style="color:var(--ink)">Aggiungi a Home</b></li>
        <li>Conferma: <b style="color:var(--ink)">Aggiungi</b></li>
      </ol>
      <button class="btn btn-primary" onclick="closeModal()">Ho capito</button>
    `);
  } else {
    toast('Trova «Installa app» nel menu del browser');
  }
}

// banner: mostra dopo 25s se installabile e non ancora installata
setTimeout(() => {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (!standalone && (window._deferredPrompt || isIOS())) showInstallTip();
}, 25000);
