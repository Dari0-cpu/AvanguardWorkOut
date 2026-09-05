# 🏋️‍♂️ Avanguard WorkOut

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg?style=for-the-badge)](https://dari0-cpu.github.io/AvanguardWorkOut/index.html)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

**Avanguard WorkOut** è un'applicazione web moderna e intuitiva progettata per chi si allena seriamente. Ti permette di gestire le tue schede di allenamento, tracciare i carichi, monitorare il peso corporeo e condividere i dati tra più dispositivi. 

Tutto è collegato a un database cloud **Supabase** per garantire che i tuoi massimali e le tue progressioni non vadano mai persi.

---

## ✨ Caratteristiche Principali

- 👥 **Gestione Multi-Utente:** Crea e gestisci diversi profili all'interno della stessa app. Ideale se ti alleni con un partner e volete usare un solo dispositivo.
- ☁️ **Cloud Sync & Storage:** Usa una chiave segreta per sincronizzare istantaneamente i tuoi dati su qualsiasi dispositivo (PC, tablet, smartphone) tramite Supabase. 
- ⚡ **Aggiunta Rapida (Smart Input):** Niente più menu infiniti. Inserisci gli esercizi al volo! Il sistema interpreta automaticamente le tue note (es. `3x10 + 3x15` o `3x10+10` per le drop-set).
- 📈 **Trend dei Carichi & Peso Corporeo:** Tieni d'occhio l'andamento dei tuoi progressi nelle ultime 6 settimane attraverso grafici dinamici.
- 🎨 **Interfaccia Personalizzabile:** Scegli tra diversi temi visivi ("Stile App") per adattare l'interfaccia ai tuoi gusti.
- 📱 **Mobile Ready:** Design completamente responsivo, pensato per essere usato comodamente sotto il rack o sulla panca.

## 🚀 Live Demo

Puoi provare l'applicazione direttamente online senza dover scaricare o installare nulla.
👉 **[Apri Avanguard WorkOut](https://dari0-cpu.github.io/AvanguardWorkOut/index.html)**

---

## 🛠️ Tecnologie Utilizzate

- **Frontend:** HTML5, CSS3, JavaScript Vanilla
- **Backend / Database:** [Supabase](https://supabase.com/) (PostgreSQL) per la sincronizzazione cloud
- **Hosting:** GitHub Pages
- **Data Viz:** Integrazione su canvas per i grafici di progressione

## ⚙️ Come funziona il Cloud Sync?

Non serve creare un account complesso. Il sistema utilizza un approccio rapido e frictionless:
1. Apri la sezione **Cloud Sync**.
2. Inserisci una **chiave segreta** (una parola d'ordine a tua scelta).
3. Inserisci la stessa chiave sugli altri tuoi dispositivi.
4. *Boom!* I profili, le schede e i carichi vengono sincronizzati al volo dal database Supabase.

*(Nota: se non configuri Supabase o il Cloud Sync, l'app continuerà a funzionare perfettamente in modalità **locale**, salvando i dati nel tuo browser).*

## 💡 Tip: Come usare l'Aggiunta Rapida

La funzione di *Aggiunta Rapida* è pensata per farti risparmiare tempo mentre ti alleni. Inserisci una riga per ogni esercizio seguendo questa sintassi:
- Usa il trattino `-` per separare il nome dall'obiettivo.
- Usa il `+` per unire set diversi o tecniche di intensità.

**Esempi pratici:**
- `Panca Piana - 4x8` ➔ Crea 4 serie da 8 rep.
- `Squat - 3x10 + 3x15` ➔ Crea 3 serie da 10 rep e 3 serie da 15 rep.
- `Curl Bicipiti - 3x10+10` ➔ Perfetto per i drop set (un solo input con reps alternate).

---

## 👨‍💻 Autore

Sviluppato da **[Dari0-cpu](https://github.com/Dari0-cpu)**.
