/**
 * polls.js — Sistema de votaciones para convivencias
 *
 * GET    /api/polls              → listar todas las votaciones
 * POST   /api/polls              → crear votación (admin)
 * GET    /api/polls/:id          → detalle de una votación
 * DELETE /api/polls/:id          → eliminar (admin)
 * POST   /api/polls/:id/vote     → votar (usuario)
 * DELETE /api/polls/:id/vote     → quitar voto propio
 * POST   /api/polls/:id/close    → cerrar votación manualmente (admin)
 */

const express = require('express')
const { queryOne, queryAll } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

function formatPoll(row, votes = [], myVote = null) {
  const siCount = votes.filter(v => v.respuesta === 'si').length
  const noCount = votes.filter(v => v.respuesta === 'no').length
  return {
    id:          row.id,
    titulo:      row.titulo,
    descripcion: row.descripcion,
    fecha:       row.fecha,
    closesAt:    row.closes_at,
    closed:      row.closed === true || row.closed === 1,
    createdBy:   row.created_by,
    createdAt:   row.created_at,
    totalVotes:  votes.length,
    siCount,
    noCount,
    myVote,      // 'si' | 'no' | null
    votes,       // solo para admins
  }
}

// ── GET /api/polls ────────────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  try {
    const polls = await queryAll('SELECT * FROM polls ORDER BY created_at DESC')
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator'

    const result = await Promise.all(polls.map(async (p) => {
      const votes = await queryAll('SELECT * FROM poll_votes WHERE poll_id = $1', [p.id])
      const myVoteRow = votes.find(v => v.user_id === req.user.id)
      const myVote = myVoteRow ? myVoteRow.respuesta : null
      const pollData = formatPoll(p, votes, myVote)
      // Usuarios no ven los votos individuales, solo conteos
      if (!isAdmin) delete pollData.votes
      return pollData
    }))

    return res.json({ polls: result })
  } catch (err) {
    console.error('[polls GET]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── POST /api/polls — crear votación (admin) ──────────────────

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { titulo, descripcion, fecha, closesAt } = req.body

    if (!titulo || !fecha) {
      return res.status(400).json({ error: 'titulo y fecha son requeridos.' })
    }

    // Si no se especifica cierre, default 48h desde ahora
    const closes = closesAt || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const poll = await queryOne(
      `INSERT INTO polls (titulo, descripcion, fecha, closes_at, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [titulo.trim(), descripcion || null, fecha, closes, req.user.id]
    )

    // Notificar a todos los usuarios activos
    const users = await queryAll(
      "SELECT id FROM users WHERE status = 'active' AND id != $1",
      [req.user.id]
    )
    for (const u of users) {
      await queryOne(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'warning', $2, $3)`,
        [
          u.id,
          `📊 Nueva votación: ${titulo}`,
          `Se ha abierto una votación para la convivencia del ${new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}. ¡Entra y vota si asistirás!`,
        ]
      )
    }

    return res.status(201).json({ poll: formatPoll(poll, [], null) })
  } catch (err) {
    console.error('[polls POST]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── GET /api/polls/:id ────────────────────────────────────────

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const poll = await queryOne('SELECT * FROM polls WHERE id = $1', [req.params.id])
    if (!poll) return res.status(404).json({ error: 'Votación no encontrada.' })

    const votes = await queryAll(
      `SELECT pv.*, u.system_name, u.display_name, u.avatar, u.username
       FROM poll_votes pv
       JOIN users u ON pv.user_id = u.id
       WHERE pv.poll_id = $1`,
      [poll.id]
    )
    const myVoteRow = votes.find(v => v.user_id === req.user.id)
    const myVote = myVoteRow ? myVoteRow.respuesta : null

    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator'
    const pollData = formatPoll(poll, votes, myVote)
    if (!isAdmin) delete pollData.votes

    return res.json({ poll: pollData })
  } catch (err) {
    console.error('[polls GET :id]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── POST /api/polls/:id/vote — votar ─────────────────────────

router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const { respuesta } = req.body
    if (!['si', 'no'].includes(respuesta)) {
      return res.status(400).json({ error: "respuesta debe ser 'si' o 'no'." })
    }

    const poll = await queryOne('SELECT * FROM polls WHERE id = $1', [req.params.id])
    if (!poll) return res.status(404).json({ error: 'Votación no encontrada.' })
    if (poll.closed) return res.status(400).json({ error: 'Esta votación ya está cerrada.' })
    if (new Date() > new Date(poll.closes_at)) {
      return res.status(400).json({ error: 'El plazo de votación ha expirado.' })
    }

    // Upsert — si ya votó, actualiza
    const existing = await queryOne(
      'SELECT id FROM poll_votes WHERE poll_id = $1 AND user_id = $2',
      [poll.id, req.user.id]
    )

    if (existing) {
      await queryOne(
        'UPDATE poll_votes SET respuesta = $1 WHERE poll_id = $2 AND user_id = $3',
        [respuesta, poll.id, req.user.id]
      )
    } else {
      await queryOne(
        'INSERT INTO poll_votes (poll_id, user_id, respuesta) VALUES ($1, $2, $3)',
        [poll.id, req.user.id, respuesta]
      )
    }

    return res.json({ success: true, respuesta })
  } catch (err) {
    console.error('[polls vote]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── DELETE /api/polls/:id/vote — quitar voto ─────────────────

router.delete('/:id/vote', requireAuth, async (req, res) => {
  try {
    const poll = await queryOne('SELECT * FROM polls WHERE id = $1', [req.params.id])
    if (!poll) return res.status(404).json({ error: 'Votación no encontrada.' })
    if (poll.closed) return res.status(400).json({ error: 'Esta votación ya está cerrada.' })

    await queryOne(
      'DELETE FROM poll_votes WHERE poll_id = $1 AND user_id = $2',
      [poll.id, req.user.id]
    )
    return res.json({ success: true })
  } catch (err) {
    console.error('[polls vote DELETE]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── POST /api/polls/:id/close — cerrar manualmente (admin) ───

router.post('/:id/close', requireAuth, requireAdmin, async (req, res) => {
  try {
    const poll = await queryOne(
      'UPDATE polls SET closed = TRUE WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    if (!poll) return res.status(404).json({ error: 'Votación no encontrada.' })

    // Notificar a usuarios que no votaron
    const allUsers = await queryAll(
      "SELECT id FROM users WHERE status = 'active' AND role != 'admin'"
    )
    const voted = await queryAll(
      'SELECT user_id FROM poll_votes WHERE poll_id = $1',
      [poll.id]
    )
    const votedIds = new Set(voted.map(v => v.user_id))

    for (const u of allUsers) {
      if (!votedIds.has(u.id)) {
        await queryOne(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES ($1, 'warning', $2, $3)`,
          [
            u.id,
            '⚠ No votaste en la convivencia',
            `La votación "${poll.titulo}" ya cerró y no registraste tu voto. En futuras convivencias asegúrate de votar a tiempo.`,
          ]
        )
      }
    }

    return res.json({ success: true })
  } catch (err) {
    console.error('[polls close]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── DELETE /api/polls/:id ─────────────────────────────────────

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await queryOne(
      'DELETE FROM polls WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (!deleted) return res.status(404).json({ error: 'Votación no encontrada.' })
    return res.json({ success: true })
  } catch (err) {
    console.error('[polls DELETE]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

module.exports = router
