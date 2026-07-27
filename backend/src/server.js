const { validateEnv } = require('./config/env');
const connect = require('../config/db');
const app = require('./app');

// Validate environment
validateEnv();

// Connect to database
connect();

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
