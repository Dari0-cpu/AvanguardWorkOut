/* ====================================================================
   AVANGUARD WORKOUT - AI PDF & PHOTO WORKOUT IMPORTER (Vercel Serverless)
   Zero dipendenze npm, native Node fetch, Gemini JSON Schema
   ==================================================================== */

const GEMINI_MODELS = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL.trim()]
    : ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

const MAX_TOTAL_BYTES = 3 * 1024 * 1024; // 3 MB raw totali (~4 MB base64, sotto il limite 4.5 MB Vercel)
const MAX_REQUEST_BYTES = 4.4 * 1024 * 1024;
const MAX_FILES = 5;
const GEMINI_TIMEOUT_MS = 55000;
const MIN_WEEKS = 6;
const MAX_WEEKS = 9;

const RATE_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_MAX_REQ = 12;          // max 12 import AI/min per IP
const RATE_MAX_BUCKETS = 1000;

const VALID_DAY_ICONS = new Set([
    'chest', 'legs', 'back', 'shoulders', 'arms',
    'push', 'pull', 'core', 'fullbody', 'cardio', 'dumbbell',
]);

const rateBuckets = new Map();

function getClientIp(req) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
        return xff.split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) {
        return realIp.trim();
    }
    return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
    const now = Date.now();
    if (rateBuckets.size > RATE_MAX_BUCKETS) {
        for (const [k, entry] of rateBuckets) {
            if (now >= entry.resetAt) rateBuckets.delete(k);
        }
        if (rateBuckets.size > RATE_MAX_BUCKETS) rateBuckets.clear();
    }

    const entry = rateBuckets.get(ip);
    if (!entry || now >= entry.resetAt) {
        rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return { allowed: true, retryAfterSec: 0 };
    }

    entry.count += 1;
    if (entry.count > RATE_MAX_REQ) {
        return {
            allowed: false,
            retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
        };
    }
    return { allowed: true, retryAfterSec: 0 };
}

function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Verifica formato reale dai magic bytes (ignora estensioni/MIME falsificati)
function detectMimeFromMagicBytes(buf) {
    if (!Buffer.isBuffer(buf) || buf.byteLength < 4) return null;

    // PDF: "%PDF-" nei primi 16 byte
    if (buf.subarray(0, 16).toString('latin1').includes('%PDF-')) {
        return 'application/pdf';
    }
    // JPEG: FF D8 FF
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
        return 'image/jpeg';
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buf.byteLength >= 8 &&
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47
    ) {
        return 'image/png';
    }
    // WebP: "RIFF"...."WEBP"
    if (
        buf.byteLength >= 12 &&
        buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buf.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
        return 'image/webp';
    }
    return null;
}

// ---------- PARSER COERENTE CON FRONTEND (app.js) ----------
function normalizeRestLabel(str) {
    return String(str || '')
        .trim()
        .replace(/[’‘]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/\s+/g, '');
}

function parseTargetBlocks(targetText) {
    if (!targetText) return ['3x10'];
    const rawParts = String(targetText).split('+').map(p => p.trim()).filter(Boolean);
    if (rawParts.length === 0) return [String(targetText)];

    const hasNxR = (s) => /\d\s*[x×]\s*(?:\d|max|amrap)/i.test(s);
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
    return blocks.length > 0 ? blocks : [String(targetText)];
}

function parseTargetAndRests(rawTarget) {
    const rawBlocks = parseTargetBlocks(rawTarget || '3x10');
    const cleanBlocks = [];
    const rests = [];

    const parenRegex = /[\(\[]\s*(?:rec\.?\s*\vert{}recupero\s*\vert{}rest\s*\vert{}r\s*)?(\d+(?:[\.,]\d+)?\s*(?:'\vert{}’\vert{}m(?:in)?\vert{}s(?:ec)?\vert{}")(?:\s*\d+\s*(?:"\vert{}s(?:ec)?)?\vert{}\d{2})?\vert{}\d+:\d{2})\s*[\)\]]/i;
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
        rests: rests.some(r => r !== '') ? rests : [],
    };
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

function detectDayIconFallback(name) {
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

// ---------- SYSTEM PROMPT & JSON SCHEMA GEMINI ----------
const SYSTEM_PROMPT = `Sei un preparatore atletico esperto e un parser ultra-preciso per l'app italiana "Avanguard Workout".
Analizza il documento PDF o le foto/screenshot della scheda di allenamento allegati ed estrai TUTTI i giorni e TUTTI gli esercizi nel formato JSON richiesto, rispettando con precisione chirurgica tabelle, progressioni, serie, ripetizioni, recuperi e note tecniche reali del materiale fornito.

REGOLE DI ESTRAZIONE:

1. GIORNI, ORDINE E ICONE:
- Identifica ogni seduta/giorno nell'ordine esatto del documento o delle immagini (es. "Giorno 1 - Petto e Bicipiti", "Seduta A", "Upper A", "Lower", "Push", "Lunedì", ecc.).
- Se un giorno continua su più pagine o tra una foto/screenshot e la successiva, UNISCI gli esercizi sotto lo stesso giorno senza duplicarlo.
- Se sono allegate più immagini, leggile in sequenza come pagine consecutive della stessa scheda.
- Se la scheda contiene una sola lista/tabella di esercizi senza intestazione del giorno, usa "Giorno 1".
- Ignora copertine, dati anagrafici, disclaimer, alimentazione/macro, mobilità o riscaldamento generale non strutturato, nonché elementi estranei nelle foto/screenshot (barre di stato del telefono, orari, chat WhatsApp, sfondi o scrivanie).
- Scegli "icon" ESCLUSIVAMENTE tra:
  chest, legs, back, shoulders, arms, push, pull, core, fullbody, cardio, dumbbell.
  (Preferisci l'icona del gruppo muscolare principale o dello split del giorno; usa "dumbbell" solo se generico).

2. NOMI ESERCIZI:
- Mantieni l'ordine esatto degli esercizi in ogni giorno.
- Rimuovi prefissi di numerazione superflui (es. "1.", "2)", "A1 -") ma CONSERVA tutte le varianti tecniche utili nel nome (es. "Panca inclinata manubri 30°", "Lat machine presa neutra", "Squat con fermo 2s").
- Se due esercizi sono in superset/jumpset/circuito (es. A1 / A2), inseriscili come due esercizi consecutivi distinti e scrivi in "coachNote" es. "Superset con [nome altro esercizio]".

3. PROGRESSIONI SETTIMANALI (S1–S9 e opzionale S0):
- Leggi con estrema attenzione eventuali tabelle o colonne per settimana (S1..S9, Sett 1..9, W1..W9, Week 1..9, Microciclo 1..9).
- Determina la durata reale del programma nel materiale fornito (da 1 a 9 settimane):
  - Se ha fino a 6 settimane (o nessuna variazione settimanale), restituisci 6 elementi in "weeks" (week: 1..6), propagando l'ultima settimana valida fino a 6 se ne indica solo 4 o 5.
  - Se ha 7, 8 o 9 settimane esplicite, restituisci tutte le settimane presenti fino a un massimo di 9 (week: 1..N).
  - Se una cella di settimana è vuota o usa "idem" / "=" / freccia, eredita il valore della settimana precedente.
- Compila "week0" SOLO se compare esplicitamente una settimana 0 / Intro / Calibrazione / Prova / Test; altrimenti imposta week0: { "target": "", "rests": [] }.

4. FORMATO DI "target" (REGOLA CRITICA PER I CAMPI CARICO DELL'APP):
- Usa sempre la "x" minuscola (es. "4x6", "3x8-10", "3x12", "3xMAX", "2x8 + 1xAMRAP").
- MULTI-BLOCCO (crea più caselle kg separate nell'app): quando lo stesso esercizio prevede serie con carichi o rep-range diversi (es. Top Set + Back Off, piramidale, ramp-up), separa i blocchi con " + " assicurandoti che OGNI blocco contenga "NxR".
  Esempi: "2x4 + 2x6", "1x5 + 3x8", "1x6 + 1x8 + 1x10".
- SINGOLO BLOCCO / UNILATERALE / CLUSTER / REST-PAUSE CON UN SOLO CARICO (1 sola casella kg):
  - Unilaterale / per lato (es. 10 per gamba, 10+10, 12dx+12sx, 10/10): scrivi "3x10+10" (MAI "3x10 + 3x10").
  - Rest-pause / myo-reps / cluster con stesso carico (es. 1 serie da 10 + 4 + 4 con 15" di pausa, o 3 serie in rest-pause): scrivi "1x10+4+4" oppure "3x8" e descrivi la tecnica e la micropausa in "coachNote" (es. "Rest-pause 15s" o "Myo-reps 12+4+4+4").
  - Drop-set / stripping con carichi diversi: se sono esplicitamente serie con carichi separati scrivi es. "3x8 + 3x10"; se è una scarica finale sullo stesso esercizio scrivi "3x8" e metti "Drop-set -20% ultima serie" in "coachNote".
- NON mettere MAI recuperi, RPE/RIR, TUT o testo descrittivo dentro "target".

5. RECUPERI PER BLOCCO ("rests"):
- "rests" deve essere allineato 1-a-1 con il numero di blocchi di "target".
  - 1 blocco ("4x6") -> es. ["2'30\\""] oppure [] se non indicato.
  - 2 blocchi ("2x4 + 2x6") -> es. ["3'", "2'"]. Se viene indicato un solo recupero per l'intero esercizio, replicalo per ogni blocco (es. ["2'", "2'"]).
- Normalizza sempre in formato compatto leggibile dal timer:
  - "2 minuti e 30" / "2:30" / "150 sec" -> "2'30\\""
  - "2-3 min" / "90-120s" -> scegli un valore unico pulito del range (es. "2'30\\"" o "2'"), senza scrivere intervalli tipo "2'-3'".
  - "60 sec" / "60\\"" -> "60s"; "90 sec" -> "90s"; "120 sec" -> "2'"; "180 sec" -> "3'".

6. NOTE TECNICHE DEL COACH ("coachNote"):
- Estrai in una singola riga concisa (max 160 caratteri) tutte le indicazioni esecutive utili: TUT/tempo ("TUT 3-1-1-0"), fermi/pause ("fermo 2s al petto"), intensità ("RIR 1-2", "RPE 8", "a cedimento"), tecniche ("Rest-pause 15s", "Drop-set", "Superset con ..."), setup ("presa neutra", "panca 30°").
- NON ripetere serie, ripetizioni o recuperi già presenti in "target" e "rests". Se non ci sono indicazioni tecniche, lascia "".

7. FEDELTÀ ASSOLUTA:
- Non inventare mai giorni, esercizi o numeri assenti dal documento o dalle foto.
- Se il file o le immagini non contengono una scheda di allenamento riconoscibile, restituisci { "days": [] }.`;

const RESPONSE_SCHEMA = {
    type: 'OBJECT',
    properties: {
        days: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    name: { type: 'STRING' },
                    icon: {
                        type: 'STRING',
                        enum: [
                            'chest', 'legs', 'back', 'shoulders', 'arms',
                            'push', 'pull', 'core', 'fullbody', 'cardio', 'dumbbell',
                        ],
                    },
                    exercises: {
                        type: 'ARRAY',
                        items: {
                            type: 'OBJECT',
                            properties: {
                                name: { type: 'STRING' },
                                coachNote: { type: 'STRING' },
                                week0: {
                                    type: 'OBJECT',
                                    properties: {
                                        target: { type: 'STRING' },
                                        rests: {
                                            type: 'ARRAY',
                                            items: { type: 'STRING' },
                                        },
                                    },
                                    required: ['target', 'rests'],
                                },
                                weeks: {
                                    type: 'ARRAY',
                                    items: {
                                        type: 'OBJECT',
                                        properties: {
                                            week: { type: 'INTEGER' },
                                            target: { type: 'STRING' },
                                            rests: {
                                                type: 'ARRAY',
                                                items: { type: 'STRING' },
                                            },
                                        },
                                        required: ['week', 'target', 'rests'],
                                    },
                                },
                            },
                            required: ['name', 'coachNote', 'weeks'],
                        },
                    },
                },
                required: ['name', 'icon', 'exercises'],
            },
        },
    },
    required: ['days'],
};

// ---------- NORMALIZZAZIONE OUTPUT AI -> FORMATO APP ----------
function normalizeAiDays(rawDays) {
    if (!Array.isArray(rawDays)) return { days: [], detectedWeeks: MIN_WEEKS };

    let maxDetectedWeek = MIN_WEEKS;
    for (const rawDay of rawDays) {
        if (!isPlainObject(rawDay) || !Array.isArray(rawDay.exercises)) continue;
        for (const rawEx of rawDay.exercises) {
            if (!isPlainObject(rawEx) || !Array.isArray(rawEx.weeks)) continue;
            rawEx.weeks.forEach((wkObj, idx) => {
                if (!isPlainObject(wkObj)) return;
                const wNum = Number.isInteger(wkObj.week) ? wkObj.week : (idx + 1);
                const rawTarget = String(wkObj.target || '').trim();
                if (rawTarget && wNum >= 1 && wNum <= MAX_WEEKS && wNum > maxDetectedWeek) {
                    maxDetectedWeek = wNum;
                }
            });
        }
    }

    const weekCount = Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, maxDetectedWeek));
    const normalizedDays = [];

    for (let dIdx = 0; dIdx < rawDays.length; dIdx++) {
        const rawDay = rawDays[dIdx];
        if (!isPlainObject(rawDay)) continue;

        const dayName = String(rawDay.name || '').trim() || `Giorno ${dIdx + 1}`;
        const rawIcon = String(rawDay.icon || '').trim().toLowerCase();
        const icon = VALID_DAY_ICONS.has(rawIcon) ? rawIcon : detectDayIconFallback(dayName);

        const rawExercises = Array.isArray(rawDay.exercises) ? rawDay.exercises : [];
        const exercises = [];

        for (const rawEx of rawExercises) {
            if (!isPlainObject(rawEx)) continue;
            const exName = String(rawEx.name || '').trim();
            if (!exName) continue;

            const targets = Array(weekCount).fill(null);
            const restsPerWeek = Array(weekCount).fill(null);

            const rawWeeks = Array.isArray(rawEx.weeks) ? rawEx.weeks : [];
            rawWeeks.forEach((wkObj, idx) => {
                if (!isPlainObject(wkObj)) return;
                const wNum = Number.isInteger(wkObj.week) ? wkObj.week : (idx + 1);
                if (wNum < 1 || wNum > weekCount) return;

                const rawTarget = String(wkObj.target || '').trim();
                if (!rawTarget) return;

                const parsed = parseTargetAndRests(rawTarget);
                targets[wNum - 1] = parsed.cleanTarget;
                restsPerWeek[wNum - 1] = normalizeRestsForTarget(parsed.cleanTarget, wkObj.rests);
            });

            let week0Target = null;
            let week0Rests = null;
            if (isPlainObject(rawEx.week0)) {
                const w0Raw = String(rawEx.week0.target || '').trim();
                if (w0Raw) {
                    const parsed0 = parseTargetAndRests(w0Raw);
                    week0Target = parsed0.cleanTarget;
                    const r0 = normalizeRestsForTarget(parsed0.cleanTarget, rawEx.week0.rests);
                    if (r0.length > 0) week0Rests = r0;
                }
            }

            const firstDefinedIdx = targets.findIndex(t => t !== null);
            const fallbackTarget = firstDefinedIdx !== -1 ? targets[firstDefinedIdx] : (week0Target || '3x10');
            const fallbackRests = firstDefinedIdx !== -1 ? (restsPerWeek[firstDefinedIdx] || []) : (week0Rests || []);

            let lastTarget = fallbackTarget;
            let lastRests = [...fallbackRests];
            for (let i = 0; i < weekCount; i++) {
                if (targets[i] === null) {
                    targets[i] = lastTarget;
                    restsPerWeek[i] = [...lastRests];
                } else {
                    lastTarget = targets[i];
                    lastRests = [...(restsPerWeek[i] || [])];
                }
            }

            const firstRestSig = JSON.stringify(restsPerWeek[0]);
            const restsUniform = restsPerWeek.every(r => JSON.stringify(r) === firstRestSig) && !week0Rests;

            let rests = [];
            let restsByWeek = null;
            if (restsUniform) {
                rests = restsPerWeek[0];
            } else {
                const map = {};
                if (week0Rests && week0Rests.length > 0) map['0'] = week0Rests;
                for (let i = 0; i < weekCount; i++) {
                    if (restsPerWeek[i].length > 0) map[String(i + 1)] = restsPerWeek[i];
                }
                if (Object.keys(map).length > 0) restsByWeek = map;
            }

            const coachNote = String(rawEx.coachNote || '').trim().slice(0, 220);

            exercises.push({
                name: exName.slice(0, 120),
                target: targets[0],
                rests,
                progression: targets,
                restsByWeek,
                week0Target,
                hasWeeklyProg: hasWeeklyVariation(targets, restsPerWeek) || week0Target !== null,
                coachNote: coachNote || null,
            });
        }

        if (exercises.length > 0) {
            normalizedDays.push({
                name: dayName.slice(0, 80),
                icon,
                exercises,
            });
        }
    }

    return { days: normalizedDays, detectedWeeks: weekCount };
}

function extractGeminiErrorMessage(rawText) {
    if (!rawText) return '';
    try {
        const parsed = JSON.parse(rawText);
        const msg = parsed?.error?.message;
        return typeof msg === 'string' ? msg.trim().slice(0, 160) : '';
    } catch (_) {
        return '';
    }
}

// ---------- HANDLER SERVERLESS ----------
async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
    }

    const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
    if (!GEMINI_API_KEY) {
        return res.status(500).json({
            error: 'Chiave GEMINI_API_KEY mancante nelle variabili d\'ambiente di Vercel.',
        });
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfterSec));
        return res.status(429).json({
            error: `Troppe richieste AI. Riprova tra ${rl.retryAfterSec} secondi.`,
        });
    }

    const contentLength = Number(req.headers['content-length']);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
        return res.status(413).json({ error: 'File troppo grandi (limite massimo totale: 3 MB).' });
    }

    let body;
    if (typeof req.body === 'string') {
        if (Buffer.byteLength(req.body, 'utf8') > MAX_REQUEST_BYTES) {
            return res.status(413).json({ error: 'File troppo grandi (limite massimo totale: 3 MB).' });
        }
        try {
            body = JSON.parse(req.body);
        } catch (_) {
            return res.status(400).json({ error: 'Richiesta JSON non valida.' });
        }
    } else if (Buffer.isBuffer(req.body)) {
        if (req.body.byteLength > MAX_REQUEST_BYTES) {
            return res.status(413).json({ error: 'File troppo grandi (limite massimo totale: 3 MB).' });
        }
        try {
            body = JSON.parse(req.body.toString('utf8'));
        } catch (_) {
            return res.status(400).json({ error: 'Richiesta JSON non valida.' });
        }
    } else if (isPlainObject(req.body)) {
        body = req.body;
    } else {
        return res.status(400).json({ error: 'Payload mancante.' });
    }

    // Normalizza input: supporta sia il nuovo formato `files: [...]` sia il vecchio `{ pdfBase64, fileName }`
    let rawFiles = [];
    if (Array.isArray(body.files) && body.files.length > 0) {
        rawFiles = body.files;
    } else if (typeof body.pdfBase64 === 'string' && body.pdfBase64.trim()) {
        rawFiles = [{
            base64: body.pdfBase64,
            fileName: typeof body.fileName === 'string' ? body.fileName : 'scheda.pdf',
        }];
    } else if (typeof body.fileBase64 === 'string' && body.fileBase64.trim()) {
        rawFiles = [{
            base64: body.fileBase64,
            fileName: typeof body.fileName === 'string' ? body.fileName : 'scheda',
        }];
    }

    if (rawFiles.length === 0) {
        return res.status(400).json({ error: 'Nessun PDF o immagine ricevuto.' });
    }
    if (rawFiles.length > MAX_FILES) {
        return res.status(400).json({ error: `Puoi inviare al massimo ${MAX_FILES} immagini alla volta.` });
    }

    const validatedFiles = [];
    let totalBytes = 0;

    for (let i = 0; i < rawFiles.length; i++) {
        const item = rawFiles[i];
        if (!isPlainObject(item) || typeof item.base64 !== 'string' || !item.base64.trim()) {
            return res.status(400).json({ error: 'Uno dei file caricati è vuoto o non valido.' });
        }

        const cleanBase64 = item.base64
            .trim()
            .replace(/^data:[a-z0-9.+/-]+;base64,/i, '')
            .replace(/\s+/g, '');

        if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
            return res.status(400).json({ error: 'Formato base64 del file non valido.' });
        }

        const buf = Buffer.from(cleanBase64, 'base64');
        if (buf.byteLength === 0) {
            return res.status(400).json({ error: 'Uno dei file caricati sembra vuoto.' });
        }

        totalBytes += buf.byteLength;
        if (totalBytes > MAX_TOTAL_BYTES) {
            return res.status(413).json({
                error: 'I file superano il limite massimo di 3 MB totali. Riduci il numero di foto o comprimi il PDF.',
            });
        }

        const detectedMime = detectMimeFromMagicBytes(buf);
        if (!detectedMime) {
            return res.status(400).json({
                error: 'Formato file non supportato. Carica un PDF o un\'immagine JPG, PNG o WebP.',
            });
        }

        const fileName = typeof item.fileName === 'string'
            ? item.fileName.trim().slice(0, 120)
            : (detectedMime === 'application/pdf' ? 'scheda.pdf' : `foto_${i + 1}.jpg`);

        validatedFiles.push({
            mimeType: detectedMime,
            base64: cleanBase64,
            fileName,
        });
    }

    const hasPdf = validatedFiles.some(f => f.mimeType === 'application/pdf');
    const sourcePrompt = hasPdf
        ? `Estrai la scheda di allenamento completa dal PDF "${validatedFiles[0].fileName}".`
        : (validatedFiles.length === 1
            ? `Estrai la scheda di allenamento completa dalla foto/screenshot "${validatedFiles[0].fileName}".`
            : `Estrai la scheda di allenamento completa dalle ${validatedFiles.length} foto/screenshot allegate (in ordine di pagina), unendo eventuali giorni che proseguono da un'immagine all'altra.`);

    const userParts = validatedFiles.map(f => ({
        inlineData: {
            mimeType: f.mimeType,
            data: f.base64,
        },
    }));

    userParts.push({
        text: `${sourcePrompt} Rispetta tutte le regole di sistema: giorni in ordine, icone corrette, distinzione multi-blocco vs unilaterale/rest-pause, progressioni settimanali (S1–S9 ed eventuale S0), recuperi normalizzati per blocco e note tecniche concise.`,
    });

    const geminiPayload = {
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
            {
                role: 'user',
                parts: userParts,
            },
        ],
        generationConfig: {
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            thinkingConfig: {
                thinkingLevel: 'LOW',
            },
        },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
        let aiRes = null;
        let usedModel = GEMINI_MODELS[0];
        let lastErrStatus = 0;
        let lastErrBody = '';

        for (let i = 0; i < GEMINI_MODELS.length; i++) {
            const model = GEMINI_MODELS[i];
            usedModel = model;
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

            aiRes = await fetch(geminiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_API_KEY,
                },
                body: JSON.stringify(geminiPayload),
                signal: controller.signal,
            });

            if (aiRes.ok) break;

            lastErrStatus = aiRes.status;
            lastErrBody = await aiRes.text().catch(() => '');
            console.error(`Errore Gemini API [${model}]:`, lastErrStatus, lastErrBody.slice(0, 500));

            const hasNext = i < GEMINI_MODELS.length - 1;
            if (hasNext && (lastErrStatus === 404 || lastErrStatus === 429 || lastErrStatus === 503)) {
                continue;
            }
            break;
        }

        clearTimeout(timeoutId);

        if (!aiRes || !aiRes.ok) {
            const apiDetail = extractGeminiErrorMessage(lastErrBody);

            if (lastErrStatus === 401 || lastErrStatus === 403) {
                return res.status(500).json({
                    error: 'Chiave GEMINI_API_KEY non valida o priva di permessi su Vercel.',
                });
            }
            if (lastErrStatus === 429) {
                return res.status(429).json({
                    error: 'Quota gratuita Gemini temporaneamente esaurita. Riprova tra un minuto.',
                });
            }
            if (lastErrStatus === 404) {
                return res.status(502).json({
                    error: `Modello AI non disponibile per questa chiave (${usedModel}, HTTP 404).`,
                });
            }
            if (lastErrStatus === 400) {
                return res.status(400).json({
                    error: apiDetail
                        ? `Richiesta rifiutata da Gemini (HTTP 400): ${apiDetail}`
                        : 'File non leggibile o danneggiato. Prova con una foto più nitida o un PDF standard.',
                });
            }
            return res.status(502).json({
                error: `Servizio AI temporaneamente non disponibile (HTTP ${lastErrStatus || 502}). Riprova tra poco.`,
            });
        }

        const aiData = await aiRes.json();
        const candidate = aiData?.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (!candidate || !candidate.content?.parts?.length) {
            return res.status(422).json({
                error: 'L\'AI non è riuscita a leggere contenuti utili da questo file.',
            });
        }

        const textParts = candidate.content.parts
            .filter(p => typeof p.text === 'string' && !p.thought)
            .map(p => p.text)
            .join('\n')
            .trim();

        if (!textParts) {
            return res.status(422).json({
                error: 'Risposta vuota dall\'AI. Verifica che la foto o il PDF siano ben leggibili.',
            });
        }

        let parsedJson;
        try {
            const cleanedJson = textParts
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();
            parsedJson = JSON.parse(cleanedJson);
        } catch (parseErr) {
            console.error('JSON malformato da Gemini:', finishReason, textParts.slice(0, 400));
            return res.status(502).json({
                error: 'Risposta AI incompleta o non valida (scheda forse troppo lunga). Riprova.',
            });
        }

        const { days, detectedWeeks } = normalizeAiDays(parsedJson?.days);
        if (days.length === 0) {
            return res.status(422).json({
                error: 'Nessun giorno o esercizio di allenamento riconosciuto in questo file.',
            });
        }

        const totalExercises = days.reduce((acc, d) => acc + d.exercises.length, 0);
        return res.status(200).json({
            days,
            meta: {
                daysCount: days.length,
                exercisesCount: totalExercises,
                detectedWeeks,
                filesCount: validatedFiles.length,
                model: usedModel,
            },
        });
    } catch (err) {
        clearTimeout(timeoutId);
        if (err && err.name === 'AbortError') {
            return res.status(504).json({
                error: 'Analisi scaduta (timeout). Prova con un file più leggero o meno immagini.',
            });
        }
        console.error('Errore interno parse-pdf:', err);
        const safeHint = String(err?.message || err?.name || 'errore sconosciuto')
            .replace(/AIza[0-9A-Za-z\-_]+/g, '[redacted]')
            .slice(0, 120);
        return res.status(500).json({
            error: `Errore interno durante l'analisi AI (${safeHint}).`,
        });
    }
}

module.exports = handler;
module.exports.config = {
    api: {
        bodyParser: {
            sizeLimit: '4.5mb',
        },
    },
};