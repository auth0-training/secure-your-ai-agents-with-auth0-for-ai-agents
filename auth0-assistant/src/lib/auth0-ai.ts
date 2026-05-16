import 'dotenv/config';
import { Auth0AI, getAccessTokenFromTokenVault } from '@auth0/ai-vercel';
import { getRefreshToken } from './auth0.js';

const auth0AI = new Auth0AI({
  auth0: {
    domain: process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  },
});

// Wraps a tool so it automatically obtains a Google token scoped for reading Gmail.
// Throws TokenVaultInterrupt if the user hasn't authorized the Google connection yet.
export const withGmailRead = auth0AI.withTokenVault({
  connection: 'google-oauth2',
  scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  refreshToken: getRefreshToken,
});

// Wraps a tool so it automatically obtains a Google token scoped for sending Gmail.
export const withGmailWrite = auth0AI.withTokenVault({
  connection: 'google-oauth2',
  scopes: ['https://mail.google.com/'],
  refreshToken: getRefreshToken,
});

// Returns the Google access token that withTokenVault stored in AsyncLocalStorage
// for the current tool execution. Call this inside a wrapped tool's execute function.
export const getAccessToken = getAccessTokenFromTokenVault;
