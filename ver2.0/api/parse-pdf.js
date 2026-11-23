/* ====================================================================
   AVANGUARD WORKOUT - AI PDF WORKOUT IMPORTER (Vercel Serverless)
   Zero dipendenze npm, native Node fetch, Gemini 2.5 Flash JSON Schema
   ==================================================================== */

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_PDF_BYTES = 3 * 1024 * 1024; // 3 MB raw (~4 MB in base64, sotto il limite 4.5 MB di Vercel)
const MAX_REQUEST_BYTES = 4.4 * 1024 * 1024;
const GEMINI_TIMEOUT_MS = 55000;

const RATE_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_MAX_REQ = 12;          // max 12 import PDF/min per IP
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
    return blocks.length > 0 ? blocks : [String(targetText)];
}

function parseTargetAndRests(rawTarget) {
    const rawBlocks = parseTargetBlocks(rawTarget || '3x10');
    const cleanBlocks = [];
    const rests = [];

    const parenRegex = /[\(\[]\s*(?:rec\.?\s*\vert{}recupero\s*\vert{}r\s*)?(\d+(?:[\.,]\d+)?\s*(?:'\vert{}’\vert{}m(?:in)?\vert{}s(?:ec)?\vert{}")(?:\s*\d+\s*(?:"\vert{}s(?:ec)?)?\vert{}\d{2})?\vert{}\d+:\d{2})\s*[\)\]]/i;
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

function hasWeeklyVariation(targets6, rests6) {
    const baseT = String(targets6[0] || '').trim();
    const baseR = JSON.stringify(rests6[0] || []);
    for (let i = 1; i < 6; i++) {
        if (String(targets6[i] || '').trim() !== baseT) return true;
        if (JSON.stringify(rests6[i] || []) !== baseR) return true;
    }
    return false;
}

// ---------- SYSTEM PROMPT & JSON SCHEMA GEMINI ----------
const SYSTEM_PROMPT = `Sei un esperto preparatore atletico e data-parser per l'app italiana "Avanguard Workout".
Il tuo compito è leggere il PDF di una scheda di allenamento in palestra ed estrarre TUTTI i giorni e TUTTI gli esercizi in JSON strutturato, con massima fedeltà ai numeri reali scritti nel documento.

REGOLE RIGOROSE:
1. GIORNI E ICONE:
   - Rileva ogni seduta/giorno di allenamento (es. "Giorno 1 - Petto e Bicipiti", "Giorno A", "Push", "Lower", "Lunedì", ecc.) mantenendo un titolo chiaro in italiano.
   - Assegna a ciascun giorno la chiave "icon" più coerente scegliendo ESCLUSIVAMENTE tra:
     chest, legs, back, shoulders, arms, push, pull, core, fullbody, cardio, dumbbell.
   - Ignora pagine puramente introduttive, disclaimer legali, alimentazione o testi che non contengono esercizi.

2. PROGRESSIONI SETTIMANALI (S1–S6 e opzionale S0):
   - Presta ESTREMA attenzione alle tabelle o colonne dove serie, ripetizioni, blocchi o recuperi cambiano tra settimane (Settimana 1..6, S1..S6, W1..W6, Week 1..6).
   - Popola sempre l'array "weeks" con 6 elementi ordinati da week=1 a week=6.
   - Se la scheda NON cambia tra settimane, ripeti lo stesso target e gli stessi recuperi su tutte e 6 le settimane.
   - Se la scheda ha solo 4 o 5 settimane (es. S1–S4), compila fedelmente quelle presenti e propaga l'ultima settimana valida fino a S6.
   - Se nel PDF esiste esplicitamente una "Settimana 0" / "S0" / "Settimana di prova" / "Intro" / "Calibrazione", compilala in "week0"; altrimenti lascia "week0.target" vuoto ("").

3. DISTINZIONE CRITICA MULTI-BLOCCO vs UNILATERALE/ALTERNATO:
   - MULTI-BLOCCO (più input carico separati): quando lo stesso esercizio ha blocchi con carichi o rep-range diversi (es. top set + back off, piramidale, ramp-up), separali con " + " assicurandoti che OGNI blocco abbia formato "NxR".
     Esempi: "2x4 + 1x6", "1x5 + 3x8", "2x6 + 2x10".
   - UNILATERALE / ALTERNATO / SINGOLO CARICO (1 solo input carico): quando le ripetizioni sono per lato (es. 10 per gamba, 10+10, 12/12, 8dx+8sx) o drop/cluster con un solo carico di riferimento, scrivilo SENZA una seconda "x":
     Esempio: "3x10+10" (NON "3x10 + 3x10"), "3x12+12".
   - NON mettere recuperi, note RPE o tempo dentro la stringa "target" (lascia "target" pulito, es. "4x6" oppure "2x4 + 2x6").

4. RECUPERI PER BLOCCO ("rests"):
   - Per ogni settimana, "rests" è un array di stringhe allineato 1-a-1 con i blocchi di "target".
   - Se "target" ha 1 blocco ("4x6"), "rests" ha 1 elemento (es. ["2'30\\""]) oppure [] se non indicato nel PDF.
   - Se "target" ha 2 blocchi ("2x4 + 2x6"), "rests" ha 2 elementi (es. ["3'", "2'"]). Se il PDF indica un solo recupero per tutto l'esercizio, replicalo per ciascun blocco (es. ["2'", "2'"]).
   - Formatta i recuperi in modo pulito e compatto: es. "3'", "2'30\\"", "1'30\\"", "90s", "60s".

5. NOTE TECNICHE DEL COACH ("coachNote"):
   - Inserisci in "coachNote" eventuali indicazioni tecniche brevi e utili del coach presenti nella riga/tabella: tempo/TUT (es. "3-1-1-0"), fermi/pause (es. "fermo 2s al petto"), RPE/RIR (es. "RPE 8", "RIR 1-2"), tecniche (es. "rest-pause", "myo-reps", "presa neutra").
   - Se non ci sono note tecniche per quell'esercizio, lascia "".

6. FEDELTÀ:
   - Non inventare esercizi o giorni non presenti nel PDF.
   - Se il documento non contiene alcuna scheda di allenamento riconoscibile, restituisci "days": [].`;

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
    if (!Array.isArray(rawDays)) return [];

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

            const targets6 = Array(6).fill(null);
            const rests6 = Array(6).fill(null);

            const rawWeeks = Array.isArray(rawEx.weeks) ? rawEx.weeks : [];
            rawWeeks.forEach((wkObj, idx) => {
                if (!isPlainObject(wkObj)) return;
                const wNum = Number.isInteger(wkObj.week) ? wkObj.week : (idx + 1);
                if (wNum < 1 || wNum > 6) return;

                const rawTarget = String(wkObj.target || '').trim();
                if (!rawTarget) return;

                const parsed = parseTargetAndRests(rawTarget);
                targets6[wNum - 1] = parsed.cleanTarget;
                rests6[wNum - 1] = normalizeRestsForTarget(parsed.cleanTarget, wkObj.rests);
            });

            // Week 0 opzionale
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

            // Riempi eventuali buchi S1..S6 propagando l'ultima settimana valida
            const firstDefinedIdx = targets6.findIndex(t => t !== null);
            const fallbackTarget = firstDefinedIdx !== -1 ? targets6[firstDefinedIdx] : (week0Target || '3x10');
            const fallbackRests = firstDefinedIdx !== -1 ? rests6[firstDefinedIdx] : (week0Rests || []);

            let lastTarget = fallbackTarget;
            let lastRests = [...fallbackRests];
            for (let i = 0; i < 6; i++) {
                if (targets6[i] === null) {
                    targets6[i] = lastTarget;
                    rests6[i] = [...lastRests];
                } else {
                    lastTarget = targets6[i];
                    lastRests = [...rests6[i]];
                }
            }

            const firstRestSig = JSON.stringify(rests6[0]);
            const restsUniform = rests6.every(r => JSON.stringify(r) === firstRestSig) && !week0Rests;

            let rests = [];
            let restsByWeek = null;
            if (restsUniform) {
                rests = rests6[0];
            } else {
                const map = {};
                if (week0Rests && week0Rests.length > 0) map['0'] = week0Rests;
                for (let i = 0; i < 6; i++) {
                    if (rests6[i].length > 0) map[String(i + 1)] = rests6[i];
                }
                if (Object.keys(map).length > 0) restsByWeek = map;
            }

            const coachNote = String(rawEx.coachNote || '').trim().slice(0, 220);

            exercises.push({
                name: exName.slice(0, 120),
                target: targets6[0],
                rests,
                progression: targets6,
                restsByWeek,
                week0Target,
                hasWeeklyProg: hasWeeklyVariation(targets6, rests6) || week0Target !== null,
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

    return normalizedDays;
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
        return res.status(413).json({ error: 'File troppo grande (limite massimo: 3 MB).' });
    }

    let body;
    if (typeof req.body === 'string') {
        if (Buffer.byteLength(req.body, 'utf8') > MAX_REQUEST_BYTES) {
            return res.status(413).json({ error: 'File troppo grande (limite massimo: 3 MB).' });
        }
        try {
            body = JSON.parse(req.body);
        } catch (_) {
            return res.status(400).json({ error: 'Richiesta JSON non valida.' });
        }
    } else if (Buffer.isBuffer(req.body)) {
        if (req.body.byteLength > MAX_REQUEST_BYTES) {
            return res.status(413).json({ error: 'File troppo grande (limite massimo: 3 MB).' });
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

    const rawBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64.trim() : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName.trim().slice(0, 120) : 'scheda.pdf';

    if (!rawBase64) {
        return res.status(400).json({ error: 'Nessun file PDF ricevuto.' });
    }

    // Rimuove eventuale prefisso data URL (data:application/pdf;base64,...)
    const cleanBase64 = rawBase64.replace(/^data:application\/pdf;base64,/i, '').replace(/\s+/g, '');

    if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
        return res.status(400).json({ error: 'Formato base64 del PDF non valido.' });
    }

    const pdfBuffer = Buffer.from(cleanBase64, 'base64');
    if (pdfBuffer.byteLength === 0) {
        return res.status(400).json({ error: 'Il file PDF sembra vuoto.' });
    }
    if (pdfBuffer.byteLength > MAX_PDF_BYTES) {
        return res.status(413).json({ error: 'Il PDF supera il limite massimo di 3 MB. Prova a comprimerlo.' });
    }

    // Verifica magic bytes "%PDF-" per evitare file rinominati o corrotti
    const headerAscii = pdfBuffer.subarray(0, 16).toString('latin1');
    if (!headerAscii.includes('%PDF-')) {
        return res.status(400).json({ error: 'Il file caricato non è un PDF valido.' });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const geminiPayload = {
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'application/pdf',
                            data: cleanBase64,
                        },
                    },
                    {
                        text: `Analizza la scheda di allenamento nel PDF "${fileName}" ed estrai tutti i giorni, gli esercizi, le progressioni settimanali (S1–S6 ed eventuale S0), i recuperi per blocco e le note tecniche del coach.`,
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            thinkingConfig: {
                thinkingBudget: 1024,
            },
        },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
        const aiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY,
            },
            body: JSON.stringify(geminiPayload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!aiRes.ok) {
            const errBody = await aiRes.text().catch(() => '');
            console.error('Errore Gemini API:', aiRes.status, errBody.slice(0, 500));

            if (aiRes.status === 401 || aiRes.status === 403) {
                return res.status(500).json({
                    error: 'Chiave GEMINI_API_KEY non valida o priva di permessi su Vercel.',
                });
            }
            if (aiRes.status === 429) {
                return res.status(429).json({
                    error: 'Quota Gemini temporaneamente esaurita. Riprova tra un minuto.',
                });
            }
            if (aiRes.status === 400) {
                return res.status(400).json({
                    error: 'PDF non leggibile o protetto da password. Prova a riesportarlo come PDF standard.',
                });
            }
            return res.status(502).json({
                error: 'Servizio AI temporaneamente non disponibile. Riprova tra poco.',
            });
        }

        const aiData = await aiRes.json();
        const candidate = aiData?.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (!candidate || !candidate.content?.parts?.length) {
            return res.status(422).json({
                error: 'L\'AI non è riuscita a leggere contenuti utili da questo PDF.',
            });
        }

        // Con thinking attivo, filtriamo eventuali part di pensiero e prendiamo il testo JSON finale
        const textParts = candidate.content.parts
            .filter(p => typeof p.text === 'string' && !p.thought)
            .map(p => p.text)
            .join('\n')
            .trim();

        if (!textParts) {
            return res.status(422).json({
                error: 'Risposta vuota dall\'AI. Verifica che il PDF non sia una scansione illeggibile.',
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
                error: 'Risposta AI incompleta o non valida (PDF forse troppo lungo). Riprova.',
            });
        }

        const days = normalizeAiDays(parsedJson?.days);
        if (days.length === 0) {
            return res.status(422).json({
                error: 'Nessun giorno o esercizio di allenamento riconosciuto in questo PDF.',
            });
        }

        const totalExercises = days.reduce((acc, d) => acc + d.exercises.length, 0);
        return res.status(200).json({
            days,
            meta: {
                daysCount: days.length,
                exercisesCount: totalExercises,
                model: GEMINI_MODEL,
            },
        });
    } catch (err) {
        clearTimeout(timeoutId);
        if (err && err.name === 'AbortError') {
            return res.status(504).json({
                error: 'Analisi PDF scaduta (timeout). Prova con un PDF più leggero o con meno pagine.',
            });
        }
        console.error('Errore interno parse-pdf:', err);
        return res.status(500).json({
            error: 'Errore interno durante l\'analisi del PDF.',
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