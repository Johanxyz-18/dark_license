/**
 * dashboard.js — Datos para el dashboard del admin
 *
 * GET /api/dashboard/stats               → contadores generales
 * GET /api/dashboard/activity-chart      → actividad por mes
 * GET /api/dashboard/justification-status → estados (pie chart)
 * GET /api/dashboard/recent              → actividad reciente
 */

const express = require('express')
const { queryOne, queryAll } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.use(requireAuth, requireAdmin)

// ── GET /api/dashboard/stats ──────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const totalUsers  = await queryOne('SELECT COUNT(*) as c FROM users')
    const activeUsers = await queryOne("SELECT COUNT(*) as c FROM users WHERE status = 'active'")
    const pendingJust = await queryOne("SELECT COUNT(*) as c FROM justifications WHERE estado = 'pendiente'")

    const currentMonth = new Date().toISOString().slice(5, 7)
    const birthdays    = await queryOne(
      "SELECT COUNT(*) as c FROM users WHERE birthday IS NOT NULL AND TO_CHAR(birthday, 'MM') = $1",
      [currentMonth]
    )

    return res.json({
      stats: {
        totalUsers:           parseInt(totalUsers.c),
        activeUsers:          parseInt(activeUsers.c),
        pendingJustifications: parseInt(pendingJust.c),
        birthdaysThisMonth:   parseInt(birthdays.c),
      }
    })
  } catch (err) {
    console.error('[dashboard/stats]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── GET /api/dashboard/activity-chart ─────────────────────────────────────────

router.get('/activity-chart', async (req, res) => {
  try {
    const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

    const usersByMonth = await queryAll(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month ORDER BY month
    `)

    const justByMonth = await queryAll(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
      FROM justifications
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month ORDER BY month
    `)

    const months = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const userMap = Object.fromEntries(usersByMonth.map(r => [r.month, parseInt(r.count)]))
    const justMap = Object.fromEntries(justByMonth.map(r => [r.month, parseInt(r.count)]))

    const activityData = months.map(m => ({
      name:            MONTH_NAMES[parseInt(m.slice(5, 7)) - 1],
      usuarios:        userMap[m]  || 0,
      justificaciones: justMap[m] || 0,
    }))

    return res.json({ activityData })
  } catch (err) {
    console.error('[dashboard/activity-chart]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── GET /api/dashboard/justification-status ────────────────────────────────────

router.get('/justification-status', async (req, res) => {
  try {
    const rows = await queryAll('SELECT estado, COUNT(*) as value FROM justifications GROUP BY estado')

    const colorMap = { aprobada: '#22c55e', pendiente: '#f59e0b', rechazada: '#ef4444' }
    const nameMap  = { aprobada: 'Aprobadas', pendiente: 'Pendientes', rechazada: 'Rechazadas' }

    const justStatusData = rows.map(r => ({
      name:  nameMap[r.estado]  || r.estado,
      value: parseInt(r.value),
      color: colorMap[r.estado] || '#6b7280',
    }))

    return res.json({ justStatusData })
  } catch (err) {
    console.error('[dashboard/justification-status]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── GET /api/dashboard/recent ─────────────────────────────────────────────────

router.get('/recent', async (req, res) => {
  try {
    const rows = await queryAll(`
      SELECT l.*, u.display_name as user_name, u.avatar
      FROM activity_log l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `)

    function timeAgo(isoDate) {
      const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000)
      if (diff < 60)      return 'Hace un momento'
      if (diff < 3600)    return `${Math.floor(diff / 60)} min`
      if (diff < 86400)   return `${Math.floor(diff / 3600)} h`
      if (diff < 2592000) return `${Math.floor(diff / 86400)} días`
      return new Date(isoDate).toLocaleDateString('es-ES')
    }

    const recentActivity = rows.map(r => ({
      id:      r.id,
      type:    r.type,
      user:    r.user_name || 'Sistema',
      avatar:  r.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${r.user_name}`,
      message: r.message,
      time:    timeAgo(r.created_at),
    }))

    return res.json({ recentActivity })
  } catch (err) {
    console.error('[dashboard/recent]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

module.exports = router
