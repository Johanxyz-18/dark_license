/**
 * auth.js — Middleware de autenticación JWT.
 *
 * Uso en rutas:
 *   router.get('/ruta', requireAuth, handler)                  // cualquier usuario logueado
 *   router.get('/ruta', requireAuth, requireAdmin, handler)    // solo admin
 *   router.get('/ruta', requireAuth, requireMod, handler)      // admin o moderador
 */

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET no está definido. Configura el .env')
  process.exit(1)
}

// Verifica el token y adjunta el usuario a req.user
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Token requerido.' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload  // { id, username, role }
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' })
  }
}

// Solo puede pasar si el usuario tiene rol 'admin'
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol admin.' })
  }
  next()
}

// Solo puede pasar si el usuario tiene rol 'admin' o 'moderator'
function requireMod(req, res, next) {
  if (!['admin', 'moderator'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol moderador o admin.' })
  }
  next()
}

// Genera un token JWT con 7 días de expiración
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

module.exports = { requireAuth, requireAdmin, requireMod, signToken }
