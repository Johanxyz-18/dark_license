/**
 * db.js — Pool de conexión a PostgreSQL (Supabase / Render PostgreSQL).
 *
 * Usa la variable de entorno DATABASE_URL en producción.
 * Localmente puedes usar una instancia de Postgres o la misma URL de Supabase.
 */

require('dotenv').config()
const { Pool } = require('pg')

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida. Configura el .env')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  // Forzar IPv4 para evitar ENETUNREACH en Render
  family: 4,
})

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message)
})

// Helper: ejecuta una query y devuelve las filas
async function query(text, params) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Helper: devuelve la primera fila o null
async function queryOne(text, params) {
  const result = await query(text, params)
  return result.rows[0] || null
}

// Helper: devuelve todas las filas
async function queryAll(text, params) {
  const result = await query(text, params)
  return result.rows
}

module.exports = { pool, query, queryOne, queryAll }
