/**
 * justifications.js — Gestión de justificaciones de ausencia
 *
 * GET   /api/justifications       → listar (admin ve todas, usuario solo las suyas)
 * POST  /api/justifications       → crear (usuario logueado)
 * PATCH /api/justifications/:id   → cambiar estado (admin: aprobada/rechazada)
 */

const express = require('express')
const { queryOne, queryAll } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Devuelve la justificación con datos del usuario incluidos
function formatJust(row) {
  if (!row) return null
  return {
    id:           row.id,
    userId:       row.user_id,
    username:     row.username,
    systemName:   row.system_name || row.display_name,
    displayName:  row.display_name,
    robloxId:     row.roblox_id,
    phone:        row.phone,
    avatar:       row.avatar,
    eventoId:     row.evento_id,
    eventoNombre: row.evento_nombre,
    motivo:       row.motivo,
    fecha:        row.fecha,
    descripcion:  row.descripcion,
    estado:       row.estado,
    archivo:      row.archivo,
    createdAt:    row.created_at,
  }
}

// ── GET /api/justifications ───────────────────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator'

    let sql = `
      SELECT j.*, u.username, u.system_name, u.display_name, u.roblox_id, u.phone, u.avatar
      FROM justifications j
      JOIN users u ON j.user_id = u.id
    `
    const params = []

    if (!isAdmin) {
      sql += ' WHERE j.user_id = $1'
      params.push(req.user.id)
    }

    sql += ' ORDER BY j.created_at DESC'

    const rows = await queryAll(sql, params)
    return res.json({ justifications: rows.map(formatJust) })
  } catch (err) {
    console.error('[justifications GET]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── POST /api/justifications ──────────────────────────────────────────────────

router.post('/', requireAuth, async (req, res) => {
  try {
    const { motivo, fecha, descripcion, eventoId, eventoNombre } = req.body

    if (!motivo || !fecha) {
      return res.status(400).json({ error: 'motivo y fecha son requeridos.' })
    }

    if (eventoId) {
      const ev = await queryOne('SELECT id FROM events WHERE id = $1', [eventoId])
      if (!ev) return res.status(400).json({ error: 'El evento indicado no existe.' })
    }

    const just = await queryOne(
      `INSERT INTO justifications (user_id, evento_id, evento_nombre, motivo, fecha, descripcion, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
       RETURNING *`,
      [req.user.id, eventoId || null, eventoNombre || null, motivo.trim(), fecha, descripcion || null]
    )

    await queryOne(
      "INSERT INTO activity_log (type, user_id, message) VALUES ('justification', $1, 'envió una justificación')",
      [req.user.id]
    )

    const row = await queryOne(
      `SELECT j.*, u.username, u.system_name, u.display_name, u.roblox_id, u.phone, u.avatar
       FROM justifications j JOIN users u ON j.user_id = u.id
       WHERE j.id = $1`,
      [just.id]
    )

    return res.status(201).json({ justification: formatJust(row) })
  } catch (err) {
    console.error('[justifications POST]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── PATCH /api/justifications/:id ────────────────────────────────────────────

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id }     = req.params
    const { estado } = req.body

    if (!['aprobada', 'rechazada', 'pendiente'].includes(estado)) {
      return res.status(400).json({ error: "estado debe ser 'aprobada', 'rechazada' o 'pendiente'." })
    }

    const updated = await queryOne(
      'UPDATE justifications SET estado = $1 WHERE id = $2 RETURNING id',
      [estado, id]
    )
    if (!updated) return res.status(404).json({ error: 'Justificación no encontrada.' })

    const action = estado === 'aprobada' ? 'aprobó' : 'rechazó'
    await queryOne(
      "INSERT INTO activity_log (type, user_id, message) VALUES ('approve', $1, $2)",
      [req.user.id, `${action} una justificación`]
    )

    // Notificar al usuario cuando se rechaza
    const justRow = await queryOne('SELECT user_id FROM justifications WHERE id = $1', [id])
    if (justRow) {
      if (estado === 'rechazada') {
        // Contar cuántas rechazadas tiene este usuario
        const rejCount = await queryOne(
          "SELECT COUNT(*) as c FROM justifications WHERE user_id = $1 AND estado = 'rechazada'",
          [justRow.user_id]
        )
        const total = parseInt(rejCount.c)

        // Notificación base de rechazo
        await queryOne(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES ($1, 'warning', $2, $3)`,
          [
            justRow.user_id,
            'Justificación rechazada',
            'Una de tus justificaciones fue rechazada por el administrador. Por favor sé más detallado en futuras justificaciones.',
          ]
        )

        // Aviso extra al llegar a 3 rechazadas
        if (total === 3) {
          await queryOne(
            `INSERT INTO notifications (user_id, type, title, message)
             VALUES ($1, 'warning', $2, $3)`,
            [
              justRow.user_id,
              '⚠ Atención: 3 justificaciones rechazadas',
              'Tienes 3 justificaciones rechazadas. El administrador ha sido notificado. Te recomendamos tomarte más en serio la asistencia y redactar justificaciones más detalladas.',
            ]
          )
        }
      } else if (estado === 'aprobada') {
        // Notificación de aprobación
        const approvedCount = await queryOne(
          "SELECT COUNT(*) as c FROM justifications WHERE user_id = $1 AND estado = 'aprobada'",
          [justRow.user_id]
        )
        const totalApproved = parseInt(approvedCount.c)

        await queryOne(
          `INSERT INTO notifications (user_id, type, title, message)
           VALUES ($1, 'warning', $2, $3)`,
          [
            justRow.user_id,
            '✓ Justificación aprobada',
            'Tu justificación fue aprobada por el administrador.',
          ]
        )

        // Mensaje especial al llegar a 6 aprobadas
        if (totalApproved === 6) {
          await queryOne(
            `INSERT INTO notifications (user_id, type, title, message)
             VALUES ($1, 'warning', $2, $3)`,
            [
              justRow.user_id,
              '🏆 ¡6 justificaciones aprobadas!',
              '¡Felicitaciones! Has acumulado 6 justificaciones aprobadas. Eres un miembro responsable del servidor.',
            ]
          )
        }
      }
    }

    const row = await queryOne(
      `SELECT j.*, u.username, u.system_name, u.display_name, u.roblox_id, u.phone, u.avatar
       FROM justifications j JOIN users u ON j.user_id = u.id
       WHERE j.id = $1`,
      [id]
    )

    return res.json({ justification: formatJust(row) })
  } catch (err) {
    console.error('[justifications PATCH]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

module.exports = router
