const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};