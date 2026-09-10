# Avanguard Workout 2.0 — FERRO edition

La tua scheda palestra, ma come una vera app: **offline**, **installabile sul telefono**, con un'interfaccia completamente ridisegnata.

---

## 🚀 Come pubblicarla su GitHub (2 minuti)

1. Vai sul tuo repo `Dari0-cpu/AvanguardWorkOut`
2. **Add file → Upload files** (o crea la cartella da terminale)
3. Carica **tutto il contenuto di questa cartella** dentro una nuova cartella `ver2.0`
   *(su GitHub: crea il file `ver2.0/.gitkeep` prima, oppure carica i file trascinandoli dentro la cartella appena creata)*
4. Commit → done

L'app sarà raggiungibile qui:

```
https://dari0-cpu.github.io/AvanguardWorkOut/ver2.0/
```

GitHub Pages è già attivo sul tuo repo (la v1 funziona), quindi **non serve configurare nient'altro**: la v2.0 appare da sola accanto alla v1.

> ⚠️ Se Pages non fosse attivo: *Settings → Pages → Source: Deploy from a branch → branch `main`, folder `/ (root)` → Save.*

---

## 📲 Come installarla sul telefono (PWA)

**Android** — apri il link in Chrome:
- compare il banner **«Avanguard sul telefono»** → premi *Installa*
- oppure menu ⋮ → *Installa app*

**iPhone** — apri il link in Safari:
- pulsante **Condividi** (quadrato con freccia) → **Aggiungi a Home** → *Aggiungi*
- (c'è anche una guida guidata dentro l'app, in Altro → Installa l'app)

Da quel momento si apre a schermo intero come un'app normale e **funziona anche in aereo**, senza rete.

---

## 🧠 Da dove arrivano i tuoi dati

- **Stesso browser della v1?** I dati della vecchia app vengono **importati automaticamente** alla prima apertura (stesso dominio = stesso archivio locale).
- **Altro dispositivo / altro browser?** Due strade:
  1. *Altro → Dati → Sync cloud*: inserisci la tua solita chiave segreta e premi **Scarica** (usa lo stesso database Supabase della v1)
  2. *Altro → Dati → Esporta/Importa backup* (file JSON)

I dati vivono nel **localStorage del telefono**: l'app non richiede mai la rete, il cloud è opzionale.

---

## 🏋️ Cosa c'è dentro

| Vista | Cosa fa |
|---|---|
| **Scheda** | Si apre direttamente qui. Giorni, esercizi, target, carichi per settimana (1–6), delta vs settimana scorsa, piastre da caricare |
| **Storico** | Sessioni registrate, progressione carichi per esercizio, record, report markdown copia-incolla |
| **Peso** | Peso corporeo nel tempo: grafico, min/media/max, registrazione al volo |
| **Altro** | Profili, peso bilanciere, recupero, backup, sync cloud, installazione |

**Extra rispetto alla v1:**

- 🎬 **Modalità allenamento** — «Inizia allenamento» ti guida esercizio per esercizio, serie per serie, con **timer di recupero** automatico (beep + vibrazione)
- 🏆 **Record personali (PR)** — riconosciuti in automatico, con festeggiamento dedicato
- 🧮 **Scomposizione piastre** — ti dice esattamente quali piastre montare per lato (25 rossa, 20 blu, 15 gialla, 10 verde, 5 bianca) — il codice colori ufficiale IWF
- 💪 **1RM stimato** (formula di Epley) nel dettaglio di ogni esercizio
- 📶 **Zero dipendenze esterne** — niente CDN, niente Tailwind, niente Chart.js: font, icone e grafici sono dentro l'app (offline al 100%)
- 🔌 **Sync cloud opzionale** — compatibile con la chiave e il database della v1

---

## 🎨 Il linguaggio visivo

Il design si chiama **FERRO**: grafite scura + colori delle piastre olimpioniche. I colori non sono decorazione, sono **semantica**:

- 🔴 rosso piastra da 25 — azioni, attenzione
- 🔵 blu piastra da 20 — installazione, info
- 🟡 giallo piastra da 15 — record personali
- 🟢 verde piastra da 10 — progressi, completati

Tipografia: **Archivo Black** per i numeri (i carichi sono i protagonisti), **Barlow Semi Condensed** per tutto il resto.

---

## 📁 Struttura file

```
ver2.0/
├── index.html            # shell dell'app
├── manifest.webmanifest  # definizione PWA
├── sw.js                 # service worker (cache offline)
├── favicon.svg
├── css/styles.css        # design system FERRO
├── js/
│   ├── data.js           # storage, migrazione v1, piastre, sync
│   ├── charts.js         # grafici SVG (peso, bilanciere)
│   ├── ui.js             # scheda, sheet esercizio, profili
│   ├── views.js          # storico, peso, altro
│   ├── session.js        # player allenamento + timer
│   └── pwa.js            # installazione, offline
├── fonts/                # Archivo Black + Barlow (self-hosted)
└── icons/                # icone PWA (bilanciere IWF)
```

Buon ferro. 🏋️
