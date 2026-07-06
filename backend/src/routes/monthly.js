/**
 * monthly.js — Historial mensual de asistencias (solo admin)
 *
 * GET /api/monthly          → todos los registros del mes actual y anteriores
 * GET /api/monthly/:yearMonth → resumen de un mes específico (YYYY-MM)
 */

const express = require('express')
const { queryAll } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.use(requireAuth, requireAdmin)

// GET /api/monthly — todos los meses con sus registros
router.get('/', async (req, res) => {
  try {
    const rows = await queryAll(`
      SELECT
        mr.*,
        u.system_name,
        u.display_name,
        u.roblox_username,
        u.avatar,
        u.username
      FROM monthly_records mr
      JOIN users u ON mr.user_id = u.id
      ORDER BY mr.year_month DESC, u.system_name ASC
    `)

    // Agrupar por mes
    const byMonth = {}
    for (const row of rows) {
      if (!byMonth[row.year_month]) byMonth[row.year_month] = []
      byMonth[row.year_month].push({
        userId:       row.user_id,
        systemName:   row.system_name || row.display_name,
        robloxUsername: row.roblox_username,
        avatar:       row.avatar,
        username:     row.username,
        totalEvents:  row.total_events,
        attended:     row.attended,
        justified:    row.justified,
        unjustified:  row.unjustified,
      })
    }

    return res.json({ months: byMonth })
  } catch (err) {
    console.error('[monthly GET]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// GET /api/monthly/:yearMonth — un mes específico
router.get('/:yearMonth', async (req, res) => {
  try {
    const rows = await queryAll(`
      SELECT
        mr.*,
        u.system_name,
        u.display_name,
        u.roblox_username,
        u.avatar,
        u.username
      FROM monthly_records mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.year_month = $1
      ORDER BY mr.unjustified DESC, u.system_name ASC
    `, [req.params.yearMonth])

    const records = rows.map(row => ({
      userId:        row.user_id,
      systemName:    row.system_name || row.display_name,
      robloxUsername: row.roblox_username,
      avatar:        row.avatar,
      username:      row.username,
      totalEvents:   row.total_events,
      attended:      row.attended,
      justified:     row.justified,
      unjustified:   row.unjustified,
    }))

    return res.json({ yearMonth: req.params.yearMonth, records })
  } catch (err) {
    console.error('[monthly GET :month]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

module.exports = router
