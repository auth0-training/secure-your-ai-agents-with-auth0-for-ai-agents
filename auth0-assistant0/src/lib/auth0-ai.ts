import { config } from 'dotenv';
import { Auth0AI, getAccessTokenFromTokenVault } from '@auth0/ai-vercel';
import { getRefreshToken } from './auth0.js';

// Load env vars at the top of the module body — before new Auth0AI() reads process.env.
// .env.local is created by the devcontainer postCreateCommand and filled in by the Auth0
// lab extension. .env is the fallback for plain local development.
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

// Auth0AI reads AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET from process.env.
const auth0AI = new Auth0AI();

export const withGmailRead = auth0AI.withTokenVault({
  connection: 'google-oauth2',
  scopes: ['openid', 'https://www.googleapis.com/auth/gmail.readonly'],
  refreshToken: getRefreshToken,
});

export const withGmailWrite = auth0AI.withTokenVault({
  connection: 'google-oauth2',
  scopes: ['openid', 'https://www.googleapis.com/auth/gmail.compose'],
  refreshToken: getRefreshToken,
});

// Returns the Google access token that withTokenVault stored in AsyncLocalStorage
// for the current tool execution. Call this inside a wrapped tool's execute function.
export const getAccessToken = getAccessTokenFromTokenVault;
