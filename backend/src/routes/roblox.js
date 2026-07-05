/**
 * roblox.js — Proxy para la API de Roblox
 *
 * GET /api/roblox?username=StarPlayer99
 *   → { id, username, displayName, avatar }
 *
 * Mejoras sobre el código original:
 *  - Cache en memoria (5 min) para no hammear la API de Roblox
 *  - Reintentos automáticos con backoff si la API falla
 *  - Separación clara de errores (usuario no existe vs error de red)
 *  - Fallback al avatar de dicebear si los thumbnails fallan
 */

const express = require('express')
const axios   = require('axios')

const router = express.Router()

// ── Cache en memoria ──────────────────────────────────────────────────────────
// Clave: username.toLowerCase() → { data, expiresAt }
const cache    = new Map()
const CACHE_MS = 5 * 60 * 1000  // 5 minutos

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null }
  return entry.data
}

function setCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_MS })
}

// ── Retry con backoff exponencial ─────────────────────────────────────────────
async function fetchWithRetry(fn, retries = 2, delayMs = 500) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      // Si es el último intento o el error es un 404 (usuario no existe), no reintentar
      const status = err?.response?.status
      if (i === retries || status === 404 || status === 400) throw err
      await new Promise(r => setTimeout(r, delayMs * (i + 1)))
    }
  }
}

// ── GET /api/roblox?username=... ──────────────────────────────────────────────

router.get('/', async (req, res) => {
  const { username } = req.query

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Debes proporcionar un username.' })
  }

  const key = username.trim().toLowerCase()

  // Devolver desde cache si existe
  const cached = getCached(key)
  if (cached) return res.json(cached)

  try {
    // 1. Resolver username → id + displayName
    const { data: userData } = await fetchWithRetry(() =>
      axios.post(
        'https://users.roblox.com/v1/usernames/users',
        { usernames: [username.trim()], excludeBannedUsers: false },
        { timeout: 7000 }
      )
    )

    if (!userData.data?.length) {
      return res.status(404).json({ error: 'Usuario de Roblox no encontrado.' })
    }

    const user = userData.data[0]

    // 2. Obtener avatar headshot (con fallback silencioso)
    let avatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(user.name)}`

    try {
      const { data: avatarData } = await fetchWithRetry(() =>
        axios.get(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png&isCircular=false`,
          { timeout: 7000 }
        )
      )
      if (avatarData.data?.[0]?.imageUrl) {
        avatar = avatarData.data[0].imageUrl
      }
    } catch {
      // Si falla el thumbnail, usamos el avatar de dicebear — no es error fatal
    }

    const result = {
      id:          user.id,
      username:    user.name,
      displayName: user.displayName || user.name,
      avatar,
    }

    setCache(key, result)
    return res.json(result)

  } catch (error) {
    const status = error?.response?.status

    if (status === 404 || status === 400) {
      return res.status(404).json({ error: 'Usuario de Roblox no encontrado.' })
    }

    // Error de red u otro
    console.error('[roblox]', error.message)
    return res.status(503).json({ error: 'No se pudo conectar con Roblox. Intenta de nuevo en unos segundos.' })
  }
})

module.exports = router
