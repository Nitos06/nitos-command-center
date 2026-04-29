import express from 'express';

const app = express();
app.use(express.json());

const DATAFORSEO_BASIC = 'bml0YWllY29tam9iN0BnbWFpbC5jb206M2I2NmMyOGY4MTcxNjNhNQ==';
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || 'mcp_dataforseo_nitai_2026';
const PORT = process.env.PORT || 3000;
const UPSTREAM = 'https://mcp.dataforseo.com/mcp';

function checkAuth(req, res) {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${MCP_AUTH_TOKEN}`) return true;
  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

// SSE proxy endpoint
app.all('/sse', async (req, res) => {
  if (!checkAuth(req, res)) return;

  const body = req.method === 'POST' ? JSON.stringify(req.body) : undefined;

  const upstreamRes = await fetch(UPSTREAM, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Basic ${DATAFORSEO_BASIC}`,
    },
    body,
  });

  // Forward all headers
  for (const [key, val] of upstreamRes.headers.entries()) {
    if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
      res.setHeader(key, val);
    }
  }
  res.status(upstreamRes.status);

  // Stream the body
  const reader = upstreamRes.body.getReader();
  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) { res.end(); return; }
    res.write(value);
    await pump();
  };
  await pump();
});

// Messages endpoint (for SSE session posts)
app.post('/messages', async (req, res) => {
  if (!checkAuth(req, res)) return;

  const upstreamRes = await fetch(`${UPSTREAM}?${new URLSearchParams(req.query)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Basic ${DATAFORSEO_BASIC}`,
    },
    body: JSON.stringify(req.body),
  });

  res.status(upstreamRes.status).json(await upstreamRes.json());
});

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`DataForSEO MCP proxy on port ${PORT}`));
