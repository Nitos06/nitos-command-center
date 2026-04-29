#!/usr/bin/env node
/**
 * nitaiecompro-mcp — stdio transport (local Claude Code usage).
 * For remote HTTP+SSE deployment, use: node server-http.js
 *
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOLS, callTool } from './tools.js';

const server = new Server(
  { name: 'nitaiecompro-mcp', version: '0.2.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a } = req.params;
  return callTool(name, a);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('nitaiecompro-mcp ready (stdio)');
