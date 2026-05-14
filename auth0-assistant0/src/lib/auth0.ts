import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { AsyncLocalStorage } from 'async_hooks';
import type { IncomingMessage } from 'http';

export const auth0 = new Auth0Client({
  enableConnectAccountEndpoint: true,
});

// Stores the Web API Request for the current Express request so Auth0 AI tools can read the session
export const requestStore = new AsyncLocalStorage<Request>();

export function toWebRequest(
  req: IncomingMessage & { originalUrl?: string; protocol?: string; body?: unknown }
): Request {
  const protocol = (req as any).protocol ?? 'http';
  const host = req.headers.host ?? 'localhost';
  const path = (req as any).originalUrl ?? req.url ?? '/';
  const url = `${protocol}://${host}${path}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
    else if (Array.isArray(value)) value.forEach(v => headers.append(key, v));
  }

  const method = req.method ?? 'GET';
  const body =
    ['POST', 'PUT', 'PATCH'].includes(method) && (req as any).body
      ? JSON.stringify((req as any).body)
      : undefined;

  return new Request(url, { method, headers, body });
}

export const getRefreshToken = async (): Promise<string | undefined> => {
  const request = requestStore.getStore();
  if (!request) return undefined;
  const session = await auth0.getSession(request as any);
  return session?.tokenSet?.refreshToken;
};
