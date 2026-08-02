import { config } from 'dotenv';
config({ path: '.env', override: false });

import { auth } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';

// Lazily initialize the JWT validator on the first request rather than at
// module load time. This prevents a startup crash when .env isn't present yet,
// and ensures dotenv has fully run before express-oauth2-jwt-bearer reads the env.
let _handler: ((req: Request, res: Response, next: NextFunction) => void) | undefined;

export function validateToken(req: Request, res: Response, next: NextFunction): void {
  if (!_handler) {
    _handler = auth({
      audience: process.env.RETAILZERO_API_AUDIENCE!,
      issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    });
  }
  _handler(req, res, next);
}
