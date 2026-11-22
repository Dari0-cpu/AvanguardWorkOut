module.exports = async (req, res) => {
    const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!SUPABASE_URL || !SERVICE_KEY) {
        return res.status(500).json({ error: 'Variabili Supabase mancanti su Vercel' });
    }

    const syncKey = String(req.headers['x-sync-key'] || '').trim();
    if (syncKey.length < 4 || syncKey.length > 128) {
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
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            if (!body || typeof body.state !== 'object') {
                return res.status(400).json({ error: 'Payload state mancante' });
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

        return res.status(405).json({ error: 'Metodo non consentito' });
    } catch (err) {
        return res.status(500).json({ error: 'Errore interno sync' });
    }
};