import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import express from 'express';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { createRequire } from 'module';
import type * as ExpressOIDC from 'express-openid-connect';
const { auth, requiresAuth } = createRequire(import.meta.url)(
  'express-openid-connect',
) as typeof ExpressOIDC;
import { streamText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { setAIContext } from '@auth0/ai-vercel';
import { nanoid } from 'nanoid';
import { requestStore, getRefreshToken } from './lib/auth0.js';
import { gmailSearchTool, gmailComposeTool } from './tools/gmail.js';

// auth0-ai.ts (loaded above via the gmail import chain) already called config() during
// its own module-body execution, so these are effectively no-ops at this point.
// They're kept here so app.ts remains self-contained if the import graph ever changes.
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

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
      // offline_access: refresh token for Token Vault exchange.
      // audience + create:me:connected_accounts: required so the refresh token can later be
      // exchanged for a My Account API access token to initiate the Connected Accounts flow.
      scope: 'openid profile email offline_access create:me:connected_accounts',
      audience: `https://${process.env.AUTH0_DOMAIN}/me/`,
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

// In-memory store for in-flight Connected Accounts PKCE transactions (keyed by state, 10-min TTL).
const connectTransactions = new Map<string, {
  codeVerifier: string;
  authSession: string;
  accessToken: string; // My Account API access token cached to avoid a second refresh-token use
  returnTo: string;
  expiresAt: number;
}>();
setInterval(() => {
  const now = Date.now();
  for (const [k, tx] of connectTransactions) {
    if (tx.expiresAt < now) connectTransactions.delete(k);
  }
}, 5 * 60 * 1000).unref();

// ─── Token Vault Connected Accounts: initiate ─────────────────────────────────
// Calls Auth0's My Account API to create a connected-account ticket, then
// redirects the popup to Auth0 → Google. On completion Auth0 stores the Google
// tokens in Token Vault so later federated-token-exchange calls succeed.
app.get('/auth/connect', requiresAuth(), async (req: ExpressRequest, res: ExpressResponse) => {
  const { connection, returnTo, scopes } = req.query;

  const scopeList = (
    Array.isArray(scopes) ? scopes : typeof scopes === 'string' ? [scopes] : []
  ).filter((s): s is string => typeof s === 'string' && s !== 'openid');

  // Exchange the user's Auth0 refresh token for a My Account API access token.
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    res.status(401).send('No refresh token found in session.');
    return;
  }

  const tokenRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      refresh_token: refreshToken,
      audience: `https://${process.env.AUTH0_DOMAIN}/me/`,
      scope: 'create:me:connected_accounts',
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error('My Account API token exchange failed:', body);
    res.status(500).send(`Failed to obtain My Account API access token: ${body}`);
    return;
  }

  const { access_token } = await tokenRes.json() as { access_token: string };

  // PKCE parameters for the connected-account flow.
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');

  const connectCallbackUri = `${process.env.APP_BASE_URL}/auth/connect/callback`;
  console.log('[connect] redirect_uri:', connectCallbackUri);

  const connectRes = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/connect`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        connection: connection as string,
        redirect_uri: connectCallbackUri,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        scopes: scopeList,
      }),
    },
  );

  if (!connectRes.ok) {
    console.error('Connected-accounts initiation failed:', await connectRes.text());
    res.status(500).send('Failed to initiate connected account.');
    return;
  }

  const { connect_uri, connect_params, auth_session } = await connectRes.json() as {
    connect_uri: string;
    connect_params: { ticket: string };
    auth_session: string;
  };

  connectTransactions.set(state, {
    codeVerifier,
    authSession: auth_session,
    accessToken: access_token,
    returnTo: (returnTo as string) || '/',
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  res.redirect(`${connect_uri}?ticket=${encodeURIComponent(connect_params.ticket)}`);
});

// ─── Token Vault Connected Accounts: callback ─────────────────────────────────
// Auth0 calls back here with connect_code after the user grants Google access.
// We complete the flow so Auth0 stores the Google tokens in Token Vault.
// NOTE: /auth/connect/callback must be added to Auth0's Allowed Callback URLs.
app.get('/auth/connect/callback', requiresAuth(), async (req: ExpressRequest, res: ExpressResponse) => {
  const { connect_code, state } = req.query;

  if (!connect_code || !state) {
    res.status(400).send('Missing connect_code or state.');
    return;
  }

  const transaction = connectTransactions.get(state as string);
  connectTransactions.delete(state as string);

  if (!transaction || transaction.expiresAt < Date.now()) {
    res.status(400).send('Invalid or expired state.');
    return;
  }

  const completeCallbackUri = `${process.env.APP_BASE_URL}/auth/connect/callback`;
  console.log('[complete] redirect_uri:', completeCallbackUri);
  console.log('[complete] connect_code:', connect_code);
  console.log('[complete] auth_session:', transaction.authSession);

  const completeRes = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${transaction.accessToken}`,
      },
      body: JSON.stringify({
        auth_session: transaction.authSession,
        connect_code: connect_code as string,
        redirect_uri: completeCallbackUri,
        code_verifier: transaction.codeVerifier,
      }),
    },
  );

  if (!completeRes.ok) {
    console.error('Connected-accounts completion failed:', await completeRes.text());
    res.status(500).send('Failed to complete connected account setup.');
    return;
  }

  // Google tokens are now in Token Vault. Redirect to /close to trigger popup auto-retry.
  res.redirect(transaction.returnTo);
});

// Helper page closed by popup-mode Token Vault flows.
// Signals the opener that auth completed, then closes itself.
app.get('/close', (_req, res) => {
  res.send(
    '<!DOCTYPE html><html><head><script>' +
    'if(window.opener){window.opener.postMessage("auth_complete",window.location.origin);}' +
    'window.close();' +
    '</script></head><body></body></html>',
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
  const threadID = sessionId ?? nanoid();
  console.log(`[chat] request — messages: ${messages.length}, threadID: ${threadID}`);

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
    setAIContext({ threadID });

    console.log('[chat] calling streamText...');
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages,
      tools: { gmailSearch: gmailSearchTool, gmailCompose: gmailComposeTool },
      stopWhen: stepCountIs(5),
      onError: ({ error }) => {
        console.error('[chat] streamText onError:', error);
        send('error', { message: (error as any)?.message ?? 'Model error.' });
      },
      onFinish: ({ finishReason, usage }) => {
        console.log(`[chat] stream finished — finishReason: ${finishReason}, tokens: ${JSON.stringify(usage)}`);
      },
    });

    for await (const part of result.fullStream) {
      const p = part as any;
      switch (p.type) {
        // Text chunks — Vercel AI SDK may use 'text-delta' (v4/v5) or 'text' (v6)
        case 'text-delta':
          send('text', { delta: p.text ?? p.textDelta ?? '' });
          break;
        case 'text':
          send('text', { delta: p.text ?? '' });
          break;

        // Inform the UI which tool is running
        case 'tool-call':
          console.log(`[chat] tool-call: ${p.toolName}`);
          send('tool_call', { toolName: p.toolName });
          break;
        case 'tool-result':
          console.log(`[chat] tool-result: ${p.toolName}`);
          send('tool_result', { toolName: p.toolName });
          break;

        // Token Vault error: user hasn't authorized the Google connection yet
        case 'tool-error': {
          console.error(`[chat] tool-error: ${p.toolName}`, p.error);
          const err = p.error;
          if (isTokenVaultError(err)) {
            send('auth_required', buildAuthPayload(err));
            return; // finally will close the response
          }
          break;
        }

        case 'error':
          console.error('[chat] stream error part:', p.error);
          send('error', { message: (p.error as any)?.message ?? 'Stream error.' });
          break;

        case 'finish':
          console.log(`[chat] finish event — reason: ${p.finishReason}`);
          send('done', { finishReason: p.finishReason });
          break;

        default:
          break;
      }
    }

    console.log('[chat] fullStream iteration complete');
  } catch (err: unknown) {
    const e = err as any;
    console.error('[chat] caught error:', e);
    if (isTokenVaultError(e)) {
      send('auth_required', buildAuthPayload(e));
    } else {
      send('error', { message: e?.message ?? 'An unexpected error occurred.' });
    }
  } finally {
    console.log('[chat] closing response');
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
