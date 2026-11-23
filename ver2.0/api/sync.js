/* ====================================================================
   AVANGUARD WORKOUT - SECURE SYNC API (Vercel Serverless, zero deps)
   Payload cap 512 KB, validazione schema, rate-limit leggero in memoria
   ==================================================================== */

const MAX_BODY_BYTES = 512 * 1024; // 512 KB
const RATE_WINDOW_MS = 60 * 1000;  // 1 minuto
const RATE_MAX_REQ = 60;           // max 60 req/min per IP
const RATE_MAX_BUCKETS = 2000;

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

function validateStateSchema(state) {
    if (!isPlainObject(state)) {
        return 'Oggetto state non valido';
    }
    if (!Array.isArray(state.users)) {
        return 'Schema state non valido: users deve essere un array';
    }
    if (state.users.length > 50) {
        return 'Troppi profili utente nello stato';
    }
    for (const user of state.users) {
        if (!isPlainObject(user) || typeof user.id !== 'string' || !user.id.trim()) {
            return 'Profilo utente non valido';
        }
        if (user.days !== undefined && !Array.isArray(user.days)) {
            return 'Campo days utente non valido';
        }
    }
    if (state.logs !== undefined && !isPlainObject(state.logs)) {
        return 'Campo logs non valido';
    }
    if (state.carried !== undefined && !isPlainObject(state.carried)) {
        return 'Campo carried non valido';
    }
    if (state.bodyWeight !== undefined && !isPlainObject(state.bodyWeight)) {
        return 'Campo bodyWeight non valido';
    }
    if (state.bodyWeightGoal !== undefined && !isPlainObject(state.bodyWeightGoal)) {
        return 'Campo bodyWeightGoal non valido';
    }
    if (state.updatedAt !== undefined && (typeof state.updatedAt !== 'number' || !Number.isFinite(state.updatedAt) || state.updatedAt < 0)) {
        return 'Campo updatedAt non valido';
    }
    if (state.week !== undefined && (typeof state.week !== 'number' || !Number.isFinite(state.week) || state.week < 0 || state.week > 12)) {
        return 'Campo week non valido';
    }
    return null;
}

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!SUPABASE_URL || !SERVICE_KEY) {
        return res.status(500).json({ error: 'Variabili Supabase mancanti su Vercel' });
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retryAfterSec));
        return res.status(429).json({ error: 'Troppe richieste. Riprova tra poco.' });
    }

    const syncKey = String(req.headers['x-sync-key'] || '').trim();
    if (syncKey.length < 4 || syncKey.length > 128 || /[\x00-\x1f\x7f]/.test(syncKey)) {
        return res.status(400).json({ error: 'Chiave sync non valida' });
    }

    const headers = {
        apikey: SERVICE_KEY,
        'Content-Type': 'application/json',
    };
    // Le nuove sb_secret_ non sono JWT: Bearer serve solo per chiavi legacy
    if (!SERVICE_KEY.startsWith('sb_secret_')) {
        headers.Authorization = `Bearer ${SERVICE_KEY}`;
    }

    try {
        if (req.method === 'GET') {
            const url = `${SUPABASE_URL}/rest/v1/gym_sync?id=eq.${encodeURIComponent(syncKey)}&select=state`;
            const r = await fetch(url, { headers });
            if (!r.ok) return res.status(r.status).json({ error: 'Errore lettura DB' });
            const rows = await r.json();
            return res.status(200).json({ state: rows[0]?.state || null });
        }

        if (req.method === 'POST') {
            const contentLength = Number(req.headers['content-length']);
            if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
                return res.status(413).json({ error: 'Payload troppo grande (max 512 KB)' });
            }

            let body;
            let byteLength = 0;

            if (typeof req.body === 'string') {
                byteLength = Buffer.byteLength(req.body, 'utf8');
                if (byteLength > MAX_BODY_BYTES) {
                    return res.status(413).json({ error: 'Payload troppo grande (max 512 KB)' });
                }
                try {
                    body = JSON.parse(req.body);
                } catch (_) {
                    return res.status(400).json({ error: 'JSON non valido' });
                }
            } else if (Buffer.isBuffer(req.body)) {
                byteLength = req.body.byteLength;
                if (byteLength > MAX_BODY_BYTES) {
                    return res.status(413).json({ error: 'Payload troppo grande (max 512 KB)' });
                }
                try {
                    body = JSON.parse(req.body.toString('utf8'));
                } catch (_) {
                    return res.status(400).json({ error: 'JSON non valido' });
                }
            } else if (isPlainObject(req.body)) {
                body = req.body;
                try {
                    byteLength = Buffer.byteLength(JSON.stringify(body), 'utf8');
                } catch (_) {
                    return res.status(400).json({ error: 'Payload non serializzabile' });
                }
                if (byteLength > MAX_BODY_BYTES) {
                    return res.status(413).json({ error: 'Payload troppo grande (max 512 KB)' });
                }
            } else {
                return res.status(400).json({ error: 'Payload state mancante' });
            }

            if (!isPlainObject(body) || !isPlainObject(body.state)) {
                return res.status(400).json({ error: 'Payload state mancante' });
            }

            const schemaErr = validateStateSchema(body.state);
            if (schemaErr) {
                return res.status(400).json({ error: schemaErr });
            }

            const url = `${SUPABASE_URL}/rest/v1/gym_sync?on_conflict=id`;
            const r = await fetch(url, {
                method: 'POST',
                headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
                body: JSON.stringify({ id: syncKey, state: body.state }),
            });
            if (!r.ok) return res.status(r.status).json({ error: 'Errore salvataggio DB' });
            return res.status(200).json({ ok: true });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Errore interno sync' });
    }
};