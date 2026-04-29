#!/usr/bin/env node
/**
 * nitaiecompro-mcp — HTTP + SSE transport for remote deployment.
 *
 * Endpoints:
 *   GET  /sse       — open SSE connection (MCP clients connect here)
 *   POST /messages  — send MCP messages (clients post here, sessionId in query)
 *   GET  /health    — liveness check
 *
 * Env vars:
 *   SUPABASE_URL              — required
 *   SUPABASE_SERVICE_ROLE_KEY — required
 *   MCP_SECRET                — optional bearer token; if set, all requests must include it
 *   PORT                      — HTTP port (default 3100)
 */

import { createServer } from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOLS, callTool } from './tools.js';

const PORT = process.env.PORT ?? 3100;
const SECRET = process.env.MCP_SECRET ?? null;

// session map: sessionId → SSEServerTransport
const sessions = new Map();

function createMCPServer() {
  const srv = new Server(
    { name: 'nitaiecompro-mcp', version: '0.2.0' },
    { capabilities: { tools: {} } }
  );
  srv.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  srv.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: a } = req.params;
    return callTool(name, a);
  });
  return srv;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isAuthed(req) {
  if (!SECRET) return true;
  const auth = req.headers['authorization'] ?? '';
  return auth === `Bearer ${SECRET}`;
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const httpServer = createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!isAuthed(req)) {
    json(res, 401, { error: 'Unauthorized — set Authorization: Bearer <MCP_SECRET>' });
    return;
  }

  const url = new URL(req.url, `http://localhost`);

  // ── Health ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, { status: 'ok', sessions: sessions.size, version: '0.2.0' });
    return;
  }

  // ── SSE connection ───────────────────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/sse') {
    const transport = new SSEServerTransport('/messages', res);
    const mcpServer = createMCPServer();

    sessions.set(transport.sessionId, transport);
    console.log(`[sse] client connected — session ${transport.sessionId} (${sessions.size} total)`);

    res.on('close', () => {
      sessions.delete(transport.sessionId);
      console.log(`[sse] client disconnected — session ${transport.sessionId} (${sessions.size} remaining)`);
    });

    await mcpServer.connect(transport);
    return;
  }

  // ── Incoming MCP messages ────────────────────────────────────────────────────
  if (req.method === 'POST' && url.pathname === '/messages') {
    const sessionId = url.searchParams.get('sessionId');
    const transport = sessions.get(sessionId);

    if (!transport) {
      json(res, 404, { error: `Session not found: ${sessionId}` });
      return;
    }

    await transport.handlePostMessage(req, res);
    return;
  }

  json(res, 404, { error: 'Not found', endpoints: ['/sse', '/messages', '/health'] });
});

httpServer.listen(PORT, () => {
  console.log(`nitaiecompro-mcp HTTP+SSE listening on :${PORT}`);
  console.log(`  SSE endpoint : http://localhost:${PORT}/sse`);
  console.log(`  Health check : http://localhost:${PORT}/health`);
  if (SECRET) console.log(`  Auth         : Bearer token required`);
  else console.log(`  Auth         : OPEN (set MCP_SECRET to secure)`);
});
