import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { auth, requiresAuth } from 'express-openid-connect';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { setAIContext } from '@auth0/ai-vercel';
import { nanoid } from 'nanoid';
import { requestStore } from './lib/auth0.js';
import { gmailSearchTool, gmailComposeTool } from './tools/gmail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Auth0 OIDC middleware ────────────────────────────────────────────────────
app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET!,
    baseURL: process.env.APP_BASE_URL!,
    clientID: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    authorizationParams: {
      response_type: 'code',
      // offline_access is required so Auth0 returns a refresh token for Token Vault exchange
      scope: 'openid profile email offline_access',
    },
    routes: {
      login: '/auth/login',
      logout: '/auth/logout',
      callback: '/auth/callback',
      postLogoutRedirect: '/',
    },
  }),
);

// Store each request in AsyncLocalStorage so tools can read the OIDC session
// during async execution (the request object isn't otherwise available there).
app.use((req: ExpressRequest, _res: ExpressResponse, next) => {
  requestStore.run(req, next);
});

// ─── Token Vault consent route ────────────────────────────────────────────────
// Starts a connection-scoped authorization code flow so the user can grant
// the app access to their Google account through Auth0.
app.get('/auth/connect', requiresAuth(), (req: ExpressRequest, res: ExpressResponse) => {
  const { connection, returnTo, scopes, ...extra } = req.query;

  const scopeList = (
    Array.isArray(scopes) ? scopes : typeof scopes === 'string' ? [scopes] : []
  ).filter((s): s is string => typeof s === 'string');

  const finalScope = ['openid', 'profile', 'email', 'offline_access', ...scopeList].join(' ');

  (res as any).oidc.login({
    returnTo: (returnTo as string) || '/',
    authorizationParams: {
      connection: connection as string,
      scope: finalScope,
      access_type: 'offline',
      prompt: 'consent',
      ...Object.fromEntries(
        Object.entries(extra)
          .filter(([, v]) => typeof v === 'string')
          .map(([k, v]) => [k, v as string]),
      ),
    },
  });
});

// Helper page closed by popup-mode Token Vault flows
app.get('/close', (_req, res) => {
  res.send(
    '<!DOCTYPE html><html><head><script>window.close();</script></head><body></body></html>',
  );
});

// ─── Session endpoint ─────────────────────────────────────────────────────────
app.get('/api/session', (req: ExpressRequest, res: ExpressResponse) => {
  res.json(req.oidc.isAuthenticated() ? { user: req.oidc.user } : null);
});

// ─── Chat endpoint ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a helpful personal assistant with access to the user's Gmail.
Use the gmailSearch tool to find and read emails, and gmailCompose to send emails on their behalf.
Today's date: ${new Date().toISOString().split('T')[0]}.`;

app.post('/api/chat', requiresAuth(), async (req: ExpressRequest, res: ExpressResponse) => {
  const { messages, sessionId } = req.body as { messages: any[]; sessionId?: string };

  // Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event: string, data: unknown) => {
    if (!res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  try {
    // Thread ID scopes Token Vault credential caching across tool calls
    setAIContext({ threadID: sessionId ?? nanoid() });

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages,
      tools: { gmailSearch: gmailSearchTool, gmailCompose: gmailComposeTool },
      maxSteps: 5,
    });

    for await (const part of result.fullStream) {
      const p = part as any;
      switch (p.type) {
        // Text chunks — Vercel AI SDK may use 'text-delta' (v4/v5) or 'text' (v6)
        case 'text-delta':
          send('text', { delta: p.textDelta ?? '' });
          break;
        case 'text':
          send('text', { delta: p.text ?? '' });
          break;

        // Inform the UI which tool is running
        case 'tool-call':
          send('tool_call', { toolName: p.toolName });
          break;
        case 'tool-result':
          send('tool_result', { toolName: p.toolName });
          break;

        // Token Vault error: user hasn't authorized the Google connection yet
        case 'tool-error': {
          const err = p.error;
          if (isTokenVaultError(err)) {
            send('auth_required', buildAuthPayload(err));
            return; // finally will close the response
          }
          break;
        }

        case 'finish':
          send('done', { finishReason: p.finishReason });
          break;
      }
    }
  } catch (err: unknown) {
    const e = err as any;
    if (isTokenVaultError(e)) {
      send('auth_required', buildAuthPayload(e));
    } else {
      console.error('Chat error:', e);
      send('error', { message: e?.message ?? 'An unexpected error occurred.' });
    }
  } finally {
    if (!res.writableEnded) res.end();
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTokenVaultError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  return (
    e['code'] === 'TOKEN_VAULT_ERROR' ||
    (e['constructor'] as any)?.['code'] === 'TOKEN_VAULT_ERROR' ||
    e['name'] === 'TokenVaultInterrupt'
  );
}

function buildAuthPayload(err: any) {
  return {
    connection: err.connection ?? 'google-oauth2',
    scopes: err.requiredScopes ?? err.scopes ?? [],
    authorizationParams: err.authorizationParams ?? {},
  };
}

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Auth0 Assistant running at http://localhost:${PORT}`);
});
