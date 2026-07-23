import { AsyncLocalStorage } from 'async_hooks';
import type { Request } from 'express';

// Stores the active Express request so Auth0 AI tools can reach the OIDC session
// during async tool execution (outside the normal request/response call stack).
export const requestStore = new AsyncLocalStorage<Request>();

// Returns the Auth0 user ID (sub) from the current request's OIDC session.
// Used by CIBA wrappers to identify which user should receive the approval request.
export const getUserID = (): string => {
  const req = requestStore.getStore();
  return (req as any)?.oidc?.user?.sub ?? '';
};
