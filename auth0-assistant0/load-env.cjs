// Loaded via tsx --require before any other module so env vars are available
// at module-load time for every imported file (including auth0-ai.ts).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env') });
