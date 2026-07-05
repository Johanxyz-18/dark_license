/**
 * events.js — CRUD de actividades/eventos
 *
 * GET    /api/events        → listar todos los eventos
 * POST   /api/events        → crear evento (admin)
 * PATCH  /api/events/:id    → actualizar (admin)
 * DELETE /api/events/:id    → eliminar (admin)
 */

const express = require('express')
const { queryOne, queryAll } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

function formatEvent(row) {
  if (!row) return null
  return {
    id:            row.id,
    titulo:        row.titulo,
    descripcion:   row.descripcion,
    fecha:         row.fecha,
    participantes: row.participantes,
    realizada:     row.realizada === true || row.realizada === 1,
    createdBy:     row.created_by,
    createdAt:     row.created_at,
  }
}

// ── GET /api/events ───────────────────────────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM events ORDER BY fecha DESC')
    return res.json({ events: rows.map(formatEvent) })
  } catch (err) {
    console.error('[events GET]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── POST /api/events ──────────────────────────────────────────────────────────

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { titulo, descripcion, fecha, participantes } = req.body

    if (!titulo || !fecha) {
      return res.status(400).json({ error: 'titulo y fecha son requeridos.' })
    }

    const event = await queryOne(
      `INSERT INTO events (titulo, descripcion, fecha, participantes, realizada, created_by)
       VALUES ($1, $2, $3, $4, FALSE, $5)
       RETURNING *`,
      [titulo.trim(), descripcion || null, fecha, participantes || null, req.user.id]
    )

    await queryOne(
      "INSERT INTO activity_log (type, user_id, message) VALUES ('event', $1, $2)",
      [req.user.id, `creó la actividad "${titulo}"`]
    )

    return res.status(201).json({ event: formatEvent(event) })
  } catch (err) {
    console.error('[events POST]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── PATCH /api/events/:id ─────────────────────────────────────────────────────

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, descripcion, fecha, participantes, realizada } = req.body

    const setClauses = []
    const params     = []
    let i = 1

    if (titulo        !== undefined) { setClauses.push(`titulo = $${i++}`);        params.push(titulo.trim()) }
    if (descripcion   !== undefined) { setClauses.push(`descripcion = $${i++}`);   params.push(descripcion) }
    if (fecha         !== undefined) { setClauses.push(`fecha = $${i++}`);         params.push(fecha) }
    if (participantes !== undefined) { setClauses.push(`participantes = $${i++}`); params.push(participantes) }
    if (realizada     !== undefined) { setClauses.push(`realizada = $${i++}`);     params.push(!!realizada) }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar.' })
    }

    params.push(id)
    const updated = await queryOne(
      `UPDATE events SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    )
    if (!updated) return res.status(404).json({ error: 'Evento no encontrado.' })

    return res.json({ event: formatEvent(updated) })
  } catch (err) {
    console.error('[events PATCH]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── DELETE /api/events/:id ────────────────────────────────────────────────────

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await queryOne(
      'DELETE FROM events WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (!deleted) return res.status(404).json({ error: 'Evento no encontrado.' })
    return res.json({ success: true })
  } catch (err) {
    console.error('[events DELETE]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

module.exports = router
