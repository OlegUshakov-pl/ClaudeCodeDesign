import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.env.SERVE_DIR || '.'), port = Number(process.env.PORT || 4173);
const OLLAMA_PORT = Number(process.env.OLLAMA_PORT || 11434);
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json' };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access' };
createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/api/ollama/models') {
      if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
      if (req.method !== 'GET') { res.writeHead(405, CORS); res.end('Method Not Allowed'); return; }
      const r = await fetch(`http://localhost:${OLLAMA_PORT}/api/tags`);
      if (!r.ok) { res.writeHead(r.status, { ...CORS, 'Content-Type':'text/plain' }); res.end('Ollama error'); return; }
      const data = await r.json();
      const models = (data.models ?? []).map(m => ({ id: m.model ?? m.name, name: m.name ?? m.model }));
      res.writeHead(200, { ...CORS, 'Content-Type':'application/json' });
      res.end(JSON.stringify({ models }));
      return;
    }
    if (pathname === '/api/ollama/chat') {
      if (req.method === 'OPTIONS') { res.writeHead(204, CORS); res.end(); return; }
      if (req.method !== 'POST') { res.writeHead(405, CORS); res.end('Method Not Allowed'); return; }
      const body = await new Promise((resolve, reject) => { let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d)); req.on('error', reject); });
      const r = await fetch(`http://localhost:${OLLAMA_PORT}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!r.ok) { res.writeHead(r.status, { ...CORS, 'Content-Type':'text/plain' }); res.end('Ollama error'); return; }
      res.writeHead(200, { ...CORS, 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' });
      const reader = r.body.getReader();
      while (true) { const { done, value } = await reader.read(); if (done) break; res.write(value); }
      res.end();
      return;
    }
    let file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file); res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer' }); res.end(body);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain' }); res.end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`Code Studio: http://localhost:${port}`));
