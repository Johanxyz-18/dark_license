/**
 * notifications.js — Notificaciones internas de usuarios
 *
 * GET   /api/notifications         → mis notificaciones (usuario)
 * PATCH /api/notifications/read    → marcar todas como leídas
 * PATCH /api/notifications/:id/read → marcar una como leída
 */

const express = require('express')
const { queryOne, queryAll } = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// ── GET /api/notifications ────────────────────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    )
    const unread = rows.filter(r => !r.read).length
    return res.json({ notifications: rows, unread })
  } catch (err) {
    console.error('[notifications GET]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── PATCH /api/notifications/read — marcar todas como leídas ─────────────────

router.patch('/read', requireAuth, async (req, res) => {
  try {
    await queryOne(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1',
      [req.user.id]
    )
    return res.json({ success: true })
  } catch (err) {
    console.error('[notifications read]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────

router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    await queryOne(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    return res.json({ success: true })
  } catch (err) {
    console.error('[notifications/:id/read]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

module.exports = router
