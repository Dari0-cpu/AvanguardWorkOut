# 🏋️‍♂️ Avanguard WorkOut

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg?style=for-the-badge)](https://dari0-cpu.github.io/AvanguardWorkOut/index.html)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

**Avanguard WorkOut** è un'applicazione web moderna (PWA) progettata per chi si allena seriamente. Permette di gestire le schede di allenamento, tracciare i carichi settimana per settimana, monitorare il peso corporeo e sincronizzare i dati su più dispositivi in tempo reale.

## 📱 Screenshots

<p align="center">
  <img src="./1.jpeg" width="22%" alt="Schermata Principale Allenamento">
  <img src="./2.jpeg" width="22%" alt="Grafico Peso Corporeo">
  <img src="./3.jpeg" width="22%" alt="Cloud Sync Supabase">
  <img src="./4.jpeg" width="22%" alt="Personalizzazione Tema">
</p>

## ✨ Caratteristiche Principali

- 📝 **Tracciamento Avanzato dei Carichi:** Gestisci le tue schede con progressioni su 6 settimane. L'app ti suggerisce automaticamente quando è il momento di aumentare il carico[cite: 18].
- 📈 **Monitoraggio Peso Corporeo:** Tieni d'occhio i tuoi progressi fisici attraverso un grafico interattivo che mostra il trend del tuo peso nelle ultime 6 settimane[cite: 16].
- ☁️ **Cloud Sync Istantaneo:** Sincronizza i tuoi dati "al volo" su tutti i tuoi dispositivi (PC, tablet, smartphone) semplicemente inserendo una chiave segreta personalizzata[cite: 19].
- 🎨 **Altamente Personalizzabile:** Scegli tra la modalità chiara o scura e seleziona il tuo colore preferito (accent color) tra 8 varianti disponibili per adattare l'app al tuo stile[cite: 17].
- 👥 **Profili Multipli:** Supporta la gestione di più utenti sullo stesso dispositivo[cite: 18].
- 📄 **Esportazione PDF & Markdown:** Genera report visivi eleganti dei tuoi progressi da condividere con il tuo coach o sui social, oppure esportali in formato testuale.
- 📶 **Funzionamento Offline (PWA):** L'app può essere installata sulla home del telefono e continua a funzionare perfettamente anche in palestra quando non c'è campo, salvando i dati in locale per poi sincronizzarli successivamente.

## 🛠️ Tecnologie Utilizzate

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Styling:** Tailwind CSS (tramite CDN) per un design pulito e responsive
- **Backend / Database:** Supabase (PostgreSQL) per il Cloud Sync
- **Grafici:** Chart.js per la visualizzazione dei trend
- **Esportazione:** html2pdf.js per la generazione dei report
- **Architettura:** Progressive Web App (PWA) con Service Worker personalizzato

## ⚙️ Come funziona il Cloud Sync?

Non serve registrare nessun account o usare password complesse. Il sistema utilizza un approccio rapido:
1. Apri la sezione **Cloud Sync** dall'icona a forma di nuvola in alto a destra.
2. Inserisci una **chiave segreta** (es. `mio-nome-2026`)[cite: 19].
3. Inserisci la stessa chiave sugli altri tuoi dispositivi.
4. I profili, le schede e i carichi verranno sincronizzati immediatamente dal database.

*(Nota: se preferisci non usare il Cloud Sync, l'app funziona perfettamente in modalità locale, salvando tutti i progressi direttamente nella memoria del tuo browser).*

## 💡 Aggiunta Rapida (Smart Input)

Per farti risparmiare tempo mentre ti alleni, puoi incollare intere liste di esercizi in una volta sola.
Usa il trattino `-` per separare il nome dall'obiettivo e il `+` per unire set o indicare tecniche di intensità.

**Esempi:**
- `Panca Piana - 4x8` ➔ Crea 4 serie da 8 rep.
- `Squat - 3x10 + 3x15` ➔ Crea 3 serie da 10 rep e 3 serie da 15 rep.
- `Curl Bicipiti - 3x10+10` ➔ Drop set (reps alternate in un singolo input).

---

## 👨‍💻 Autore

Sviluppato da **[Dari0-cpu](https://github.com/Dari0-cpu)**.
