import { AsyncLocalStorage } from 'async_hooks';
import type { Request } from 'express';

// Stores the active Express request so Auth0 AI tools can reach the OIDC session
// during async tool execution (outside the normal request/response call stack).
export const requestStore = new AsyncLocalStorage<Request>();

// Returns the Auth0 refresh token from the current request's OIDC session.
// Called by withTokenVault to exchange for a federated Google access token.
export const getRefreshToken = async (): Promise<string | undefined> => {
  const req = requestStore.getStore();
  const oidc = (req as any)?.oidc;
  // express-openid-connect context.js getter returns refresh_token as a plain string.
  return (oidc?.refreshToken as string | undefined) ?? undefined;
};
