import express from 'express';
import type { Request as ExpressReq, Response as ExpressRes } from 'express';
import { auth, requiresAuth } from 'express-openid-connect';
import { requestStore } from './lib/auth0.js';
import { POST as chatHandler } from './app/api/chat/route.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Auth0 OIDC middleware — must run before requestStore so req.oidc is populated first
app.use(auth({
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET!,
  baseURL: process.env.APP_BASE_URL!,
  clientID: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email offline_access',
  },
  routes: {
    login: '/auth/login',
    logout: '/auth/logout',
    callback: '/auth/callback',
    postLogoutRedirect: '/',
  },
}));

// Store the authenticated Express request so Auth0 AI tools can call getRefreshToken()
app.use((req: ExpressReq, _res, next) => {
  requestStore.run(req, next);
});

// Token Vault consent: initiate a connection-scoped authorization code flow
app.get('/auth/connect', requiresAuth(), (req: ExpressReq, res: ExpressRes) => {
  const { connection, returnTo, scopes, ...extraAuthParams } = req.query;
  const scopeList = (Array.isArray(scopes) ? scopes : typeof scopes === 'string' ? [scopes] : [])
    .filter((s): s is string => typeof s === 'string');

  res.oidc.login({
    returnTo: (returnTo as string) || '/',
    authorizationParams: {
      connection: connection as string,
      scope: ['openid', 'profile', 'email', 'offline_access', ...scopeList].join(' '),
      ...Object.fromEntries(
        Object.entries(extraAuthParams)
          .filter(([, v]) => typeof v === 'string')
          .map(([k, v]) => [k, v as string]),
      ),
    } as any,
  });
});

// Helper page for Token Vault popup mode
app.get('/close', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><script>window.close();</script></head><body><p>You can close this window.</p></body></html>`);
});

// Session info for the React SPA
app.get('/api/session', (req: ExpressReq, res: ExpressRes) => {
  res.json(req.oidc.isAuthenticated() ? { user: req.oidc.user } : null);
});

// Convert an Express request to a Web API Request for the Vercel AI SDK handler
function toWebRequest(req: ExpressReq): Request {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
    else if (Array.isArray(value)) value.forEach(v => headers.append(key, v));
  }
  return new Request(url, {
    method: req.method,
    headers,
    body: req.body ? JSON.stringify(req.body) : undefined,
  });
}

// Chat API
app.post('/api/chat', requiresAuth(), async (req: ExpressReq, res: ExpressRes) => {
  const webRes = await chatHandler(toWebRequest(req));
  res.status(webRes.status);
  for (const [key, value] of webRes.headers.entries()) res.append(key, value);
  res.end(Buffer.from(await webRes.arrayBuffer()));
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
