## Claude Code Design — Ollama Fork of [wieslawsoltes/ClaudeCodeDesign](https://github.com/wieslawsoltes/ClaudeCodeDesign)

**A space to think. A place to build.**

This is a fork of [Claude Code Design](https://github.com/wieslawsoltes/ClaudeCodeDesign) adapted for use with **Ollama** — run local models through the same workspace interface without an Anthropic API key.

Built with plain HTML, CSS, JavaScript modules, and a real WebGPU particle renderer. No frontend framework, CDN, or runtime package dependency.

**This is not the official Claude Code product. It is not affiliated with or endorsed by Anthropic.**

## What's changed in this fork

- **Ollama support** — connect to a local Ollama instance via the built-in proxy (`/api/ollama/models`, `/api/ollama/chat`)
- **No API key required** — select "Local Ollama" in the connect dialog and start chatting
- **CORS proxy** — `scripts/serve.mjs` proxies Ollama requests, eliminating browser CORS issues
- **NDJSON streaming** — handles Ollama's streaming format alongside Anthropic SSE
- **Thinking mode toggle** — the **Think** button in the composer turns Ollama reasoning on/off per request (`think: true|false`); the reasoning trace streams into a collapsible block above the answer

## Run locally

Node.js 20 or newer is required. There are no npm dependencies to install.

```sh
npm start
# Open http://localhost:4173
```

Make sure Ollama is running:

```sh
ollama serve
ollama pull llama3.2
```

## Connect to Ollama

1. Open **Connect API**
2. Select **Local Ollama**
3. Click **Connect & test**
4. Choose a model in **Model settings**

The app proxies requests through `localhost:4173/api/ollama/*` to `localhost:11434`, so no CORS configuration is needed on the Ollama side.

## Connect an Anthropic API key (optional)

The original Anthropic connection is still supported. Open **Connect API**, enter your key, and choose **Connect & test**. Keys stay in page memory and are forgotten on reload.

A custom **Anthropic-compatible proxy origin** is also supported. It must implement `GET /v1/models`, `POST /v1/messages`, Anthropic SSE/tool semantics, and CORS.

## The experience

| Workspace | Working capabilities |
| --- | --- |
| Conversations | Live streaming responses, stop/cancel, selected-file context, model discovery, response limits, Build/Plan/Review/Explain modes |
| Coding partner | Structured list/read/search/propose tools; selected-file access only; a visible activity log |
| Changes | Per-file proposals, line diffs, explicit approve/reject, stale-base conflict checks, guarded undo |
| Editor | File creation, editing, renaming, deletion, syntax highlighting, line numbers, local persistence |
| Preview | Interactive plain HTML/CSS/JavaScript in a sandboxed iframe |
| Projects | Local files/folders, read-only public GitHub import, source ZIP export, JSON backup/restore |
| Organization | Searchable sessions, pin/archive/rename/delete, built-in prompt library, command palette |

## Tests

```sh
npm run check
npm test
npm run build
python -m pip install playwright==1.57.0
python -m playwright install chromium
python tests/browser.py
```

## Deliberate boundaries

This is a browser coding workspace, not full Claude Code CLI parity. It has no shell, npm execution, local OS agent, private GitHub authentication, git writes, background cloud agents, multiplayer collaboration, or deployment of generated projects.

Ollama models support basic chat but not Anthropic-style tool use. The app sends system prompts and file context as plain text.

## License

MIT for the original implementation. Product names belong to their respective owners.
