/**
 * Cloudflare Pages Function — AI 3D generation proxy
 * Supports: Tripo3D (free monthly credits) and Meshy.ai (paid)
 *
 * POST /api/meshy  { provider, action, apiKey, ...params }
 * GET  /api/meshy?provider=...&action=poll&apiKey=...&id=...
 */

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS },
    });
}

// ── Tripo3D ──────────────────────────────────────────────────
async function tripoCreate(apiKey, body) {
    const r = await fetch('https://platform.tripo3d.ai/v2/openapi/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok || d.code !== 0) return { error: d.message || d.msg || `Tripo3D error ${r.status}` };
    return { taskId: d.data.task_id };
}

async function tripoPoll(apiKey, taskId) {
    const r = await fetch(`https://platform.tripo3d.ai/v2/openapi/task/${taskId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const d = await r.json();
    if (!r.ok || d.code !== 0) return { error: d.message || `Tripo3D poll error ${r.status}` };
    const t = d.data;
    return {
        status:   t.status,           // queued | running | success | failed
        progress: t.progress || 0,
        glbUrl:   t.output?.model || null,
        error:    t.status === 'failed' ? (t.task_error?.message || 'Generation failed') : null,
    };
}

// ── Meshy ────────────────────────────────────────────────────
async function meshyCreate(apiKey, action, params) {
    let url, body;
    if (action === 'text-to-3d') {
        url = 'https://api.meshy.ai/openapi/v2/text-to-3d';
        body = { mode: 'preview', prompt: params.prompt, art_style: 'realistic', should_remesh: true, topology: 'triangle' };
    } else {
        url = 'https://api.meshy.ai/openapi/v1/image-to-3d';
        body = { image_url: params.image_url, enable_pbr: true };
    }
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) return { error: d.message || `Meshy error ${r.status}` };
    return { taskId: d.result };
}

async function meshyPoll(apiKey, taskId, action) {
    const base = action === 'text-to-3d'
        ? `https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`
        : `https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`;
    const r = await fetch(base, { headers: { 'Authorization': `Bearer ${apiKey}` } });
    const d = await r.json();
    if (!r.ok) return { error: d.message || `Meshy poll error ${r.status}` };
    const succeeded = d.status === 'SUCCEEDED';
    return {
        status:   succeeded ? 'success' : d.status === 'FAILED' ? 'failed' : 'running',
        progress: d.progress || 0,
        glbUrl:   d.model_urls?.glb || null,
        error:    d.status === 'FAILED' ? (d.task_error?.message || 'Generation failed') : null,
    };
}

// ── Main handler ─────────────────────────────────────────────
export async function onRequest(context) {
    const { request } = context;
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    try {
        if (request.method === 'POST') {
            const { provider = 'tripo3d', action, apiKey, ...params } = await request.json();
            if (!apiKey) return json({ error: 'No API key provided' }, 400);

            if (provider === 'tripo3d') {
                let body;
                if (action === 'text-to-3d') {
                    body = { type: 'text_to_model', model_version: 'v2.5-20250123', prompt: params.prompt };
                } else {
                    body = { type: 'image_to_model', file: { type: 'jpg', url: params.image_url } };
                }
                return json(await tripoCreate(apiKey, body));
            }

            if (provider === 'meshy') {
                return json(await meshyCreate(apiKey, action, params));
            }

            return json({ error: 'Unknown provider' }, 400);
        }

        if (request.method === 'GET') {
            const u = new URL(request.url);
            const provider = u.searchParams.get('provider') || 'tripo3d';
            const apiKey   = u.searchParams.get('apiKey');
            const taskId   = u.searchParams.get('id');
            const action   = u.searchParams.get('action') || 'text-to-3d'; // for meshy
            if (!apiKey || !taskId) return json({ error: 'Missing apiKey or id' }, 400);

            if (provider === 'tripo3d') return json(await tripoPoll(apiKey, taskId));
            if (provider === 'meshy')   return json(await meshyPoll(apiKey, taskId, action));
            return json({ error: 'Unknown provider' }, 400);
        }

        return json({ error: 'Method not allowed' }, 405);
    } catch (e) {
        return json({ error: e.message }, 500);
    }
}
