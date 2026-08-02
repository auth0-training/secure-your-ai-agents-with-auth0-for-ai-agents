import { config } from 'dotenv';
config({ path: '.env', override: false });

import { auth } from 'express-oauth2-jwt-bearer';

// Validates Auth0 JWT Bearer tokens on incoming requests.
// AUTH0_DOMAIN and RETAILZERO_API_AUDIENCE are read from the environment.
export const validateToken = auth({
  audience: process.env.RETAILZERO_API_AUDIENCE!,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
});
