import 'dotenv/config';
import express from 'express';
import type { Request as ExpressReq, Response as ExpressRes } from 'express';
import { auth0, requestStore, toWebRequest } from './lib/auth0.js';
import { POST as chatHandler } from './app/api/chat/route.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Make the current Web API request available to Auth0 AI tools via AsyncLocalStorage
app.use((req, _res, next) => {
  requestStore.run(toWebRequest(req), next);
});

async function sendWebResponse(webRes: Response, res: ExpressRes) {
  res.status(webRes.status);
  for (const [key, value] of webRes.headers.entries()) {
    res.append(key, value);
  }
  res.end(Buffer.from(await webRes.arrayBuffer()));
}

// Tiny helper page for Token Vault popup mode
app.get('/close', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><script>window.close();</script></head><body><p>You can close this window.</p></body></html>`);
});

// All /auth/* routes handled by @auth0/nextjs-auth0 Web API middleware
app.all('/auth/*', async (req: ExpressReq, res: ExpressRes) => {
  const webRes = await (auth0 as any).middleware(toWebRequest(req));
  await sendWebResponse(webRes, res);
});

// Session info endpoint for the React SPA
app.get('/api/session', async (req: ExpressReq, res: ExpressRes) => {
  const session = await (auth0 as any).getSession(toWebRequest(req));
  res.json(session ? { user: session.user } : null);
});

// Chat API — requires a valid session
app.post('/api/chat', async (req: ExpressReq, res: ExpressRes) => {
  const session = await (auth0 as any).getSession(toWebRequest(req));
  if (!session) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const webRes = await chatHandler(toWebRequest(req) as any);
  await sendWebResponse(webRes, res);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => res.sendFile('index.html', { root: 'dist' }));
  }
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

startServer().catch(console.error);
