/**
 * index.js — Punto de entrada del servidor Express
 *
 * Arranque: node src/index.js
 *           npm run dev   (con nodemon)
 */

require('dotenv').config()

const express = require('express')
const cors    = require('cors')

// Rutas
const authRoutes           = require('./routes/auth')
const usersRoutes          = require('./routes/users')
const eventsRoutes         = require('./routes/events')
const justificationsRoutes = require('./routes/justifications')
const dashboardRoutes      = require('./routes/dashboard')
const robloxRoutes         = require('./routes/roblox')

const app  = express()
const PORT = process.env.PORT || 3000

// ── Middlewares globales ──────────────────────────────────────────────────────

// CORS: en producción (Render) se permite el dominio de Vercel;
// en desarrollo se permite todo.
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev
  'http://localhost:4173',   // Vite preview
  process.env.FRONTEND_URL, // ej: https://tu-app.vercel.app
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Permitir llamadas sin Origin (Postman, curl, mismo servidor)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS bloqueado para: ${origin}`))
    }
  },
  credentials: true,
}))

app.use(express.json())

// ── Rutas ─────────────────────────────────────────────────────────────────────

app.use('/api/auth',           authRoutes)
app.use('/api/users',          usersRoutes)
app.use('/api/events',         eventsRoutes)
app.use('/api/justifications', justificationsRoutes)
app.use('/api/dashboard',      dashboardRoutes)
app.use('/api/roblox',         robloxRoutes)

// Ruta raíz — útil para verificar que el servidor está activo en Render
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DL Backend corriendo',
    version: '1.0.0',
  })
})

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
})

// Manejador de errores global
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message)
  res.status(500).json({ error: 'Error interno del servidor.' })
})

// ── Arranque ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`)
})
