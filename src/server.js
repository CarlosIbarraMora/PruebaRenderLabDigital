import express from 'express';
import cors from 'cors';
import { getSupabase } from './config/supabase.js';

const app = express();
const supabase = getSupabase();

app.use(cors());
app.use(express.json());

const TABLE = 'GAME';
// CHECK
app.get('/', (_req, res) => {
    res.json({ ok: true, message: 'API up' });
});

// GET all
app.get('/api/games', async (_req, res) => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('game_id, title, description, game_url, created_at, topic, status, topic_id')
        .order('game_id', { ascending: true });

    if (error) return res.status(500).json({ ok: false, message: error.message });
    res.json({ ok: true, data });
});

// GET by id
app.get('/api/games/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const { data, error } = await supabase
        .from(TABLE)
    .select('game_id, title, description, game_url, created_at, topic, status, topic_id')
    .eq('game_id', id)
    .maybeSingle();

    if (error) return res.status(500).json({ ok: false, message: error.message });
    if (!data) return res.status(404).json({ ok: false, message: 'Game not found' });
    res.json({ ok: true, data });
});

// CREATE
app.post('/api/games', async (req, res) => {
    const REQUIRED = ['title','description','game_url','topic','status','topic_id'];
    const miss = REQUIRED.filter(k => req.body?.[k] === undefined);
    if (miss.length) return res.status(400).json({ ok: false, message: `Missing fields: ${miss.join(', ')}` });

    const payload = {
        title: req.body.title,
        description: req.body.description,
        game_url: req.body.game_url,
        topic: req.body.topic,
        status: req.body.status,
        topic_id: req.body.topic_id
    };

    const { data, error } = await supabase
        .from(TABLE)
        .insert([payload])
        .select('game_id, title, description, game_url, created_at, topic, status, topic_id')
        .single();

    if (error) return res.status(500).json({ ok: false, message: error.message });
    res.status(201).json({ ok: true, data });
});

// PATCH
app.patch('/api/games/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const ALLOWED = ['title','description','game_url','topic','status','topic_id'];
    const payload = Object.fromEntries(
    Object.entries(req.body || {}).filter(([k,v]) => ALLOWED.includes(k) && v !== undefined)
    );
    if (Object.keys(payload).length === 0) {
    return res.status(400).json({ ok: false, message: 'No valid fields to update' });
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update(payload)
        .eq('game_id', id)
        .select('game_id, title, description, game_url, created_at, topic, status, topic_id')
        .maybeSingle();

    if (error) return res.status(500).json({ ok: false, message: error.message });
    if (!data) return res.status(404).json({ ok: false, message: 'Game not found' });
    res.json({ ok: true, data });
});

//DELETE
app.delete('/api/games/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const { data: exists, error: e1 } = await supabase
        .from(TABLE)
        .select('game_id')
        .eq('game_id', id)
        .maybeSingle();

    if (e1) return res.status(500).json({ ok: false, message: e1.message });
    if (!exists) return res.status(404).json({ ok: false, message: 'Game not found' });

    const { error } = await supabase.from(TABLE).delete().eq('game_id', id);
    if (error) return res.status(500).json({ ok: false, message: error.message });

    res.json({ ok: true, deleted: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
