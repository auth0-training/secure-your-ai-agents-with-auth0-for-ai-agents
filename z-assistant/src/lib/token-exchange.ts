import { requestStore } from './auth0.js';

// TODO (Tour 04 - Step 7): Uncomment to implement the token exchange helper.
//
// getRetailZeroToken() reads the logged-in user's OIDC ID token from the
// express-openid-connect session, then POSTs to Auth0's token endpoint using
// the Custom Token Exchange grant type. Auth0 runs the Custom Token Exchange
// Action and mints a short-lived access token scoped to the RetailZero API.
// That token is returned and added as an Authorization header on every API call.
//
// export async function getRetailZeroToken(): Promise<string> {
//   const req = requestStore.getStore();
//   const idToken = (req as any)?.oidc?.idToken as string | undefined;
//   if (!idToken) throw new Error('No authenticated session — cannot exchange token');
//
//   const res = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body: new URLSearchParams({
//       grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
//       client_id: process.env.AUTH0_CLIENT_ID!,
//       client_secret: process.env.AUTH0_CLIENT_SECRET!,
//       subject_token: idToken,
//       subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
//       audience: process.env.RETAILZERO_API_AUDIENCE!,
//     }).toString(),
//   });
//
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(`Token exchange failed: ${(err as any).error_description ?? res.statusText}`);
//   }
//
//   const { access_token } = await res.json();
//   return access_token as string;
// }
