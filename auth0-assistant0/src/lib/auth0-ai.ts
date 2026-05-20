import { config } from 'dotenv';
// TODO: Add Auth0AI imports here

// Load env vars at the top of the module body — before new Auth0AI() reads process.env.
// .env.local is created by the devcontainer postCreateCommand and filled in by the Auth0
// lab extension. .env is the fallback for plain local development.
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

// TODO: Export getAccessToken here

// TODO: Initialize Auth0AI client and export withGmailRead, withGmailWrite here
