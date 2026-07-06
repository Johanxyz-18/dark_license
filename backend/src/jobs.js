/**
 * jobs.js — Tareas automáticas del servidor
 *
 * 1. checkClosedEvents()  — cada 5 min: detecta actividades que ya cerraron (30h),
 *    notifica a usuarios que no justificaron y marca la actividad como realizada.
 *
 * 2. monthlyReset()       — cada hora: al inicio de cada mes, crea registros mensuales
 *    con el resumen de asistencias y notifica a todos los usuarios.
 */

const { queryOne, queryAll } = require('./db')

// ── 1. Cierre automático de actividades ──────────────────────────────────────

async function checkClosedEvents() {
  try {
    // Buscar actividades cuyo closes_at ya pasó y no están marcadas como procesadas
    const closedEvents = await queryAll(`
      SELECT * FROM events
      WHERE closes_at <= NOW()
        AND realizada = FALSE
    `)

    for (const ev of closedEvents) {
      // Marcar como realizada
      await queryOne(
        'UPDATE events SET realizada = TRUE WHERE id = $1',
        [ev.id]
      )

      // Obtener todos los usuarios activos
      const users = await queryAll(
        "SELECT id FROM users WHERE status = 'active' AND role != 'admin'"
      )

      // Obtener quiénes sí justificaron
      const justified = await queryAll(
        'SELECT DISTINCT user_id FROM justifications WHERE evento_id = $1',
        [ev.id]
      )
      const justifiedIds = new Set(justified.map(j => j.user_id))

      // Notificar a quienes NO justificaron
      for (const user of users) {
        if (!justifiedIds.has(user.id)) {
          await queryOne(
            `INSERT INTO notifications (user_id, type, title, message)
             VALUES ($1, 'activity_closed', $2, $3)`,
            [
              user.id,
              `Actividad cerrada: ${ev.titulo}`,
              `La actividad "${ev.titulo}" del ${new Date(ev.fecha).toLocaleDateString('es-ES')} ha cerrado y no registraste una justificación de ausencia.`
            ]
          )
        }
      }

      console.log(`[jobs] Actividad cerrada: "${ev.titulo}" — notificados ${users.length - justifiedIds.size} usuarios`)
    }
  } catch (err) {
    console.error('[jobs/checkClosedEvents]', err.message)
  }
}

// ── 2. Reset mensual ─────────────────────────────────────────────────────────

async function monthlyReset() {
  try {
    const now = new Date()
    // Solo ejecutar el día 1 de cada mes, en la primera hora
    if (now.getDate() !== 1 || now.getHours() !== 0) return

    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const yearMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`

    // Verificar que no se haya hecho el reset ya
    const alreadyDone = await queryOne(
      'SELECT id FROM monthly_records WHERE year_month = $1 LIMIT 1',
      [yearMonth]
    )
    if (alreadyDone) return

    console.log(`[jobs] Iniciando reset mensual para ${yearMonth}`)

    // Actividades del mes anterior
    const monthEvents = await queryAll(
      `SELECT id FROM events WHERE TO_CHAR(fecha, 'YYYY-MM') = $1`,
      [yearMonth]
    )
    const totalEvents = monthEvents.length
    const eventIds    = monthEvents.map(e => e.id)

    // Usuarios activos
    const users = await queryAll(
      "SELECT id FROM users WHERE status = 'active'"
    )

    for (const user of users) {
      let justified   = 0
      let unjustified = 0

      if (eventIds.length > 0) {
        // Justificaciones aprobadas del mes
        const justRows = await queryAll(
          `SELECT evento_id, estado FROM justifications
           WHERE user_id = $1
             AND evento_id = ANY($2::int[])`,
          [user.id, eventIds]
        )
        justified   = justRows.filter(j => j.estado === 'aprobada').length
        unjustified = totalEvents - justRows.length // no justificó en nada
      }

      const attended = totalEvents - unjustified - (justified)

      // Guardar registro mensual
      await queryOne(
        `INSERT INTO monthly_records (user_id, year_month, total_events, attended, justified, unjustified)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, year_month) DO NOTHING`,
        [user.id, yearMonth, totalEvents, Math.max(0, attended), justified, unjustified]
      )

      // Notificar al usuario del reset
      await queryOne(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'monthly_reset', $2, $3)`,
        [
          user.id,
          `Resumen de ${prevMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
          `Mes cerrado. Actividades: ${totalEvents} | Justificadas: ${justified} | Faltas sin justificar: ${unjustified}. Los contadores han sido reiniciados.`
        ]
      )
    }

    console.log(`[jobs] Reset mensual completado para ${yearMonth} — ${users.length} usuarios procesados`)
  } catch (err) {
    console.error('[jobs/monthlyReset]', err.message)
  }
}

// ── Arrancar los jobs ─────────────────────────────────────────────────────────

function startJobs() {
  // Verificar actividades cerradas cada 5 minutos
  setInterval(checkClosedEvents, 5 * 60 * 1000)
  // Verificar reset mensual cada hora
  setInterval(monthlyReset, 60 * 60 * 1000)

  // Ejecutar inmediatamente al arrancar
  checkClosedEvents()
  monthlyReset()

  console.log('✅ Jobs automáticos iniciados (cierre actividades: 5min, reset mensual: 1h)')
}

module.exports = { startJobs, checkClosedEvents, monthlyReset }
