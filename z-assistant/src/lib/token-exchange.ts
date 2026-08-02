import { requestStore } from './auth0.js';

// TODO (Tour 04 - Step 6): Uncomment to retrieve the RetailZero API access token.
//
// Because RETAILZERO_API_AUDIENCE is included in the Auth0 authorization request
// (app.ts Step 3), Auth0 issues an access token for the RetailZero API at login
// time. express-openid-connect stores it in the encrypted session cookie.
// We read it here via AsyncLocalStorage — no extra network call needed.
//
// export function getRetailZeroToken(): string {
//   const req = requestStore.getStore();
//   const token = (req as any)?.oidc?.accessToken?.access_token as string | undefined;
//   if (!token) throw new Error('No RetailZero access token in session — ensure RETAILZERO_API_AUDIENCE is set and the user is logged in');
//   return token;
// }
