// Loaded via tsx --require before any other module so env vars are available
// at module-load time for every imported file.
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
