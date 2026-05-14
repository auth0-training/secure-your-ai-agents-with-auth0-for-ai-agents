import { AsyncLocalStorage } from 'async_hooks';
import type { Request as ExpressRequest } from 'express';

// Stores the current Express request so Auth0 AI tools can read the session during tool calls
export const requestStore = new AsyncLocalStorage<ExpressRequest>();

export const getRefreshToken = async (): Promise<string | undefined> => {
  const req = requestStore.getStore();
  return (req as any)?.oidc?.refreshToken ?? undefined;
};
