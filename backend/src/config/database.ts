import knex, { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432');
const database = process.env.DB_NAME || 'order_engine';
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'password';

const dbConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 10
  }
};

export const db = knex(dbConfig);

// Test database connection and list tables
db.raw('SELECT current_database(), current_user')
  .then(result => console.log('Connected to database:', result.rows[0]))
  .catch(err => console.error('Database connection failed:', err));

db.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
  .then(result => console.log('Existing tables:', result.rows.map((r: { tablename: string }) => r.tablename)))
  .catch(err => console.error('Failed to list tables:', err));