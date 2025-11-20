import knex, { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

console.log('process.env.DB_HOST:', process.env.DB_HOST);
console.log('process.env.DB_PORT:', process.env.DB_PORT);
console.log('process.env.DB_NAME:', process.env.DB_NAME);
console.log('process.env.DB_USER:', process.env.DB_USER);

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
    password
  },
  pool: {
    min: 2,
    max: 10
  }
};

export const db = knex(dbConfig);