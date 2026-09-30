import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.env.SERVE_DIR || '.'), port = Number(process.env.PORT || 4173);
const OLLAMA_PORT = Number(process.env.OLLAMA_PORT || 11434);
const OLLAMA_BASE = `http://localhost:${OLLAMA_PORT}`;
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access' };
const readBody = req => new Promise((resolve, reject) => { let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d)); req.on('error', reject); });
const sendJson = (res, status, payload) => { res.writeHead(status, { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(payload)); };
async function ollamaFetch(path, init) {
  try { return { response: await fetch(`${OLLAMA_BASE}${path}`, init) }; }
  catch (error) { return { failure: `${OLLAMA_BASE} did not respond (${error.message}). Start it with "ollama serve".` }; }
}
const parseJson = text => { try { return JSON.parse(text); } catch { return null; } };
async function forwardOllamaError(res, response) {
  const text = await response.text().catch(() => '');
  const json = parseJson(text);
  const message = typeof json?.error === 'string' ? json.error : json ? JSON.stringify(json) : text;
  sendJson(res, response.status, { error: String(message || '').slice(0, 1000) || `Ollama returned HTTP ${response.status}.` });
}
async function pipeOllamaStream(res, body) {
  const reader = body.getReader();
  let clientGone = false;
  res.on('close', () => { clientGone = true; reader.cancel().catch(() => {}); });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || clientGone) break;
      if (!res.write(value)) await Promise.race([once(res, 'drain'), once(res, 'close')]).catch(() => {});
    }
  } catch (error) {
    if (!clientGone && !res.writableEnded) { try { res.write(`${JSON.stringify({ error: `Ollama stopped streaming: ${error.message}` })}\n`); } catch {} }
  } finally {
    await reader.cancel().catch(() => {});
    res.end();
  }
}
createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/api/ollama/models') {
      if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
      if (req.method !== 'GET') { res.writeHead(405, CORS); res.end('Method Not Allowed'); return; }
      const upstream = await ollamaFetch('/api/tags', { signal: AbortSignal.timeout(15_000) });
      if (upstream.failure) { sendJson(res, 502, { error: upstream.failure }); return; }
      const r = upstream.response;
      if (!r.ok) { await forwardOllamaError(res, r); return; }
      const data = await r.json();
      const models = (data.models ?? []).map(m => ({ id: m.model ?? m.name, name: m.name ?? m.model }));
      res.writeHead(200, { ...CORS, 'Content-Type':'application/json' });
      res.end(JSON.stringify({ models }));
      return;
    }
    if (pathname === '/api/ollama/chat') {
      if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
      if (req.method !== 'POST') { res.writeHead(405, CORS); res.end('Method Not Allowed'); return; }
      const body = await readBody(req);
      const upstream = await ollamaFetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (upstream.failure) { sendJson(res, 502, { error: upstream.failure }); return; }
      const r = upstream.response;
      if (!r.ok) { await forwardOllamaError(res, r); return; }
      res.writeHead(200, { ...CORS, 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
      await pipeOllamaStream(res, r.body);
      return;
    }
    let file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer' }); res.end(body);
  } catch (error) {
    if (res.headersSent) { try { res.end(); } catch {} return; }
    if (error?.code === 'ENOENT') { res.writeHead(404, { 'Content-Type':'text/plain' }); res.end('Not found'); return; }
    sendJson(res, 500, { error: `Local server error: ${error?.message ?? 'unknown failure'}` });
  }
}).listen(port, '0.0.0.0', () => console.log(`Code Studio: http://localhost:${port}`));
