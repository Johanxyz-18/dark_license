/**
 * invitations.js — Sistema de invitaciones
 *
 * POST /api/invitations          → crear invitación (admin)
 * GET  /api/invitations          → listar invitaciones del admin
 * DELETE /api/invitations/:id    → eliminar invitación (admin)
 * GET  /api/invitations/:code    → verificar código (público, para el formulario)
 */

const express = require('express')
const { queryOne, queryAll } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Genera un código tipo DL-XXXXXX
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'DL-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── POST /api/invitations ─────────────────────────────────────────────────────

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role = 'user', systemName } = req.body

    if (!['admin', 'moderator', 'user'].includes(role)) {
      return res.status(400).json({ error: "role debe ser 'admin', 'moderator' o 'user'." })
    }

    // Generar código único
    let code, exists
    do {
      code = generateCode()
      exists = await queryOne('SELECT id FROM invitations WHERE code = $1', [code])
    } while (exists)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

    const inv = await queryOne(
      `INSERT INTO invitations (code, role, system_name, created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [code, role, systemName?.trim() || null, req.user.id, expiresAt.toISOString()]
    )

    return res.status(201).json({ invitation: formatInv(inv) })
  } catch (err) {
    console.error('[invitations POST]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── GET /api/invitations ──────────────────────────────────────────────────────

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await queryAll(`
      SELECT i.*, u.display_name as used_by_name
      FROM invitations i
      LEFT JOIN users u ON i.used_by = u.id
      WHERE i.created_by = $1
      ORDER BY i.created_at DESC
    `, [req.user.id])

    return res.json({ invitations: rows.map(r => ({
      ...formatInv(r),
      usedByName: r.used_by_name || null,
    })) })
  } catch (err) {
    console.error('[invitations GET]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── DELETE /api/invitations/:id ───────────────────────────────────────────────

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await queryOne(
      'DELETE FROM invitations WHERE id = $1 AND created_by = $2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (!deleted) return res.status(404).json({ error: 'Invitación no encontrada.' })
    return res.json({ success: true })
  } catch (err) {
    console.error('[invitations DELETE]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── GET /api/invitations/:code — verificar código (público) ──────────────────

router.get('/:code', async (req, res) => {
  try {
    const inv = await queryOne(
      'SELECT * FROM invitations WHERE code = $1',
      [req.params.code.toUpperCase()]
    )

    if (!inv)              return res.status(404).json({ error: 'Código de invitación inválido.' })
    if (inv.used_by)       return res.status(409).json({ error: 'Este código ya fue usado.' })
    if (new Date() > new Date(inv.expires_at)) {
      return res.status(410).json({ error: 'Este código de invitación ha expirado.' })
    }

    return res.json({
      valid: true,
      role:       inv.role,
      systemName: inv.system_name,
      expiresAt:  inv.expires_at,
    })
  } catch (err) {
    console.error('[invitations GET :code]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

function formatInv(row) {
  return {
    id:         row.id,
    code:       row.code,
    role:       row.role,
    systemName: row.system_name,
    usedBy:     row.used_by,
    usedAt:     row.used_at,
    expiresAt:  row.expires_at,
    createdAt:  row.created_at,
    expired:    new Date() > new Date(row.expires_at),
    used:       !!row.used_by,
  }
}

module.exports = router
