import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
import { AuthorizationPendingInterrupt, AuthorizationPollingInterrupt, AccessDeniedInterrupt } from '@auth0/ai/interrupts';
import { nanoid } from 'nanoid';
import { requestStore } from './lib/auth0.js';
// TODO (Tour 03): Import RetailZero tools here

// auth0-ai.ts runs config() during module-body execution; these are kept for
// self-contained behaviour if the import graph changes.
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
      scope: 'openid profile email',
    },
    routes: {
      login: '/auth/login',
      logout: '/auth/logout',
      callback: '/auth/callback',
      postLogoutRedirect: '/',
    },
  }),
);

// Store each request in AsyncLocalStorage so tools can reach the OIDC session
// during async tool execution.
app.use((req: ExpressRequest, _res: ExpressResponse, next) => {
  requestStore.run(req, next);
});

// ─── Session endpoint ─────────────────────────────────────────────────────────
app.get('/api/session', (req: ExpressRequest, res: ExpressResponse) => {
  res.json(req.oidc.isAuthenticated() ? { user: req.oidc.user } : null);
});

// ─── Chat endpoint ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Z-Assistant, an AI-powered customer service agent for RetailZero, a leading e-commerce platform.
You help customer service representatives quickly look up orders, browse the product catalog, process refunds, and access customer information.

Available capabilities:
- Search orders by customer name, email, or order ID
- Browse the product catalog by category or availability
- Get detailed information about a specific order
- Process refunds for eligible delivered orders
- Access full customer profiles including contact and payment details

Always be professional and concise. Confirm critical details with the user before taking irreversible actions like refunds.
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
    // Thread ID scopes CIBA credential caching across tool calls in the same conversation.
    setAIContext({ threadID });

    console.log('[chat] calling streamText...');
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages,
      tools: {}, // TODO (Tour 03): Add RetailZero tools here
      stopWhen: stepCountIs(5),
      onError: ({ error }) => {
        console.error('[chat] streamText onError:', error);
        send('error', { message: (error as any)?.message ?? 'Model error.' });
      },
      onFinish: ({ finishReason, usage }) => {
        console.log(`[chat] finished — finishReason: ${finishReason}, tokens: ${JSON.stringify(usage)}`);
      },
    });

    for await (const part of result.fullStream) {
      const p = part as any;
      switch (p.type) {
        case 'text-delta':
          send('text', { delta: p.text ?? p.textDelta ?? '' });
          break;
        case 'text':
          send('text', { delta: p.text ?? '' });
          break;

        case 'tool-call':
          console.log(`[chat] tool-call: ${p.toolName}`);
          send('tool_call', { toolName: p.toolName });
          break;
        case 'tool-result':
          console.log(`[chat] tool-result: ${p.toolName}`);
          send('tool_result', { toolName: p.toolName });
          break;

        case 'tool-error': {
          console.error(`[chat] tool-error: ${p.toolName}`, p.error);
          const err = p.error;
          // CIBA pending — the user must approve on their registered device
          if (err instanceof AuthorizationPendingInterrupt || err instanceof AuthorizationPollingInterrupt) {
            send('ciba_pending', {
              message: 'An approval request has been sent to your device. Once you approve it, select Retry to continue.',
            });
            return;
          }
          // CIBA denied or expired
          if (err instanceof AccessDeniedInterrupt) {
            send('ciba_denied', { message: 'Authorization was denied. The operation was not approved.' });
            return;
          }
          send('error', { message: (err as any)?.message ?? 'Tool execution failed.' });
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
    if (e instanceof AuthorizationPendingInterrupt || e instanceof AuthorizationPollingInterrupt) {
      send('ciba_pending', {
        message: 'An approval request has been sent to your device. Once you approve it, select Retry to continue.',
      });
    } else if (e instanceof AccessDeniedInterrupt) {
      send('ciba_denied', { message: 'Authorization was denied.' });
    } else {
      send('error', { message: e?.message ?? 'An unexpected error occurred.' });
    }
  } finally {
    console.log('[chat] closing response');
    if (!res.writableEnded) res.end();
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Z-Assistant running at http://localhost:${PORT}`);
});
