/**
 * users.js — Rutas de usuarios
 *
 * GET    /api/users              → listar usuarios (admin/mod)
 * POST   /api/users              → crear usuario (admin) — sin verificar DL, con system_name
 * GET    /api/users/birthdays    → lista de cumpleaños
 * PATCH  /api/users/me           → actualizar perfil propio
 * PATCH  /api/users/:id/status   → activar/desactivar (admin)
 * DELETE /api/users/:id          → eliminar usuario (admin)
 */

const express = require('express')
const bcrypt  = require('bcryptjs')
const axios   = require('axios')
const { queryOne, queryAll } = require('../db')
const { requireAuth, requireAdmin, requireMod } = require('../middleware/auth')

const router = express.Router()

const ROBLOX_NAME_COOLDOWN_DAYS = 7

function formatUser(row) {
  if (!row) return null
  return {
    id:                  row.id,
    username:            row.username,
    systemName:          row.system_name || row.display_name,
    displayName:         row.display_name,
    robloxUsername:      row.roblox_username,
    robloxId:            row.roblox_id,
    avatar:              row.avatar,
    role:                row.role,
    status:              row.status,
    birthday:            row.birthday,
    phone:               row.phone,
    pendingDlDeadline:   row.pending_dl_deadline,
    robloxNameChangedAt: row.roblox_name_changed_at,
    createdAt:           row.created_at,
    justCount:           parseInt(row.just_count || 0),
  }
}

// ── GET /api/users ────────────────────────────────────────────────────────────

router.get('/', requireAuth, requireMod, async (req, res) => {
  try {
    const { search = '', role = '', status = '' } = req.query

    let sql = `
      SELECT u.*,
        COUNT(j.id) AS just_count
      FROM users u
      LEFT JOIN justifications j ON j.user_id = u.id
      WHERE 1=1
    `
    const params = []
    let i = 1

    if (search) {
      sql += ` AND (u.username ILIKE $${i} OR u.display_name ILIKE $${i+1} OR u.roblox_username ILIKE $${i+2} OR u.system_name ILIKE $${i+3})`
      const like = `%${search}%`
      params.push(like, like, like, like)
      i += 4
    }
    if (role)   { sql += ` AND u.role = $${i++}`;   params.push(role)   }
    if (status) { sql += ` AND u.status = $${i++}`; params.push(status) }

    sql += ' GROUP BY u.id ORDER BY u.created_at DESC'

    const rows = await queryAll(sql, params)
    return res.json({ users: rows.map(formatUser) })
  } catch (err) {
    console.error('[users GET]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── POST /api/users — Crear usuario (admin) ───────────────────────────────────
// El admin puede crear un usuario con nombre de sistema propio.
// No requiere DL en el nombre de Roblox, pero inicia un período de gracia de 7 días.

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, password, systemName, robloxUsername, birthday, phone, role = 'user' } = req.body

    if (!username || !password || !robloxUsername) {
      return res.status(400).json({ error: 'username, password y robloxUsername son requeridos.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
    }

    const usernameTaken = await queryOne('SELECT id FROM users WHERE username = $1', [username.trim()])
    if (usernameTaken) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' })
    }

    if (phone) {
      const phoneTaken = await queryOne('SELECT id FROM users WHERE phone = $1', [phone])
      if (phoneTaken) return res.status(409).json({ error: 'Ese número de teléfono ya está registrado.' })
    }

    // Buscar info de Roblox (sin requerir DL)
    let displayName = robloxUsername.trim()
    let avatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${robloxUsername}`
    let robloxId = null

    try {
      const { data: userData } = await axios.post(
        'https://users.roblox.com/v1/usernames/users',
        { usernames: [robloxUsername.trim()], excludeBannedUsers: false },
        { timeout: 6000 }
      )
      if (userData.data?.length) {
        const u = userData.data[0]
        displayName = u.displayName || u.name
        robloxId = String(u.id)
        try {
          const { data: avData } = await axios.get(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${u.id}&size=420x420&format=Png&isCircular=false`,
            { timeout: 5000 }
          )
          if (avData.data?.[0]?.imageUrl) avatar = avData.data[0].imageUrl
        } catch {}
      }
    } catch {}

    // Si no tiene DL, poner deadline de 7 días
    const hasDL = displayName.toLowerCase().includes('dl')
    const pendingDeadline = hasDL ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const passwordHash = bcrypt.hashSync(password, 10)
    const finalSystemName = systemName?.trim() || displayName

    const newUser = await queryOne(
      `INSERT INTO users (username, password_hash, system_name, display_name, roblox_username, roblox_id, avatar, role, status, birthday, phone, pending_dl_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11)
       RETURNING *`,
      [username.trim(), passwordHash, finalSystemName, displayName, robloxUsername.trim(), robloxId, avatar, role, birthday || null, phone || null, pendingDeadline]
    )

    await queryOne(
      "INSERT INTO activity_log (type, user_id, message) VALUES ('join', $1, $2)",
      [newUser.id, `fue añadido por el administrador`]
    )

    return res.status(201).json({ user: formatUser(newUser) })
  } catch (err) {
    console.error('[users POST]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── GET /api/users/birthdays ──────────────────────────────────────────────────

router.get('/birthdays', requireAuth, async (req, res) => {
  try {
    const rows = await queryAll(`
      SELECT * FROM users
      WHERE birthday IS NOT NULL AND status = 'active'
      ORDER BY TO_CHAR(birthday, 'MM-DD')
    `)

    const birthdays = rows.map(row => ({
      id:             row.id,
      userId:         row.id,
      systemName:     row.system_name || row.display_name,
      displayName:    row.display_name,
      robloxUsername: row.roblox_username,
      avatar:         row.avatar,
      birthday:       row.birthday,
    }))

    return res.json({ birthdays })
  } catch (err) {
    console.error('[birthdays]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── PATCH /api/users/me ───────────────────────────────────────────────────────

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { systemName, displayName, birthday, robloxUsername, oldPassword, newPassword } = req.body

    const row = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado.' })

    const setClauses = []
    const params     = []
    let i = 1

    if (systemName !== undefined) {
      setClauses.push(`system_name = $${i++}`)
      params.push(systemName.trim())
    }
    if (displayName !== undefined) {
      setClauses.push(`display_name = $${i++}`)
      params.push(displayName.trim())
    }
    if (birthday !== undefined) {
      setClauses.push(`birthday = $${i++}`)
      params.push(birthday || null)
    }

    // Actualizar robloxUsername — cooldown de 7 días
    if (robloxUsername !== undefined && robloxUsername.trim() !== row.roblox_username) {
      if (row.roblox_name_changed_at) {
        const daysSince = (Date.now() - new Date(row.roblox_name_changed_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince < ROBLOX_NAME_COOLDOWN_DAYS) {
          const daysLeft = Math.ceil(ROBLOX_NAME_COOLDOWN_DAYS - daysSince)
          return res.status(429).json({
            error: `Debes esperar ${daysLeft} día${daysLeft !== 1 ? 's' : ''} más para cambiar tu nombre de Roblox.`
          })
        }
      }

      try {
        const { data: userData } = await axios.post(
          'https://users.roblox.com/v1/usernames/users',
          { usernames: [robloxUsername], excludeBannedUsers: false },
          { timeout: 5000 }
        )
        if (!userData.data?.length) {
          return res.status(400).json({ error: 'Usuario de Roblox no encontrado.' })
        }
        const rUser = userData.data[0]
        const { data: avatarData } = await axios.get(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${rUser.id}&size=420x420&format=Png&isCircular=false`,
          { timeout: 5000 }
        )
        setClauses.push(`roblox_username = $${i++}`)
        params.push(robloxUsername.trim())
        setClauses.push(`roblox_id = $${i++}`)
        params.push(String(rUser.id))
        setClauses.push(`display_name = $${i++}`)
        params.push(rUser.displayName || rUser.name)
        setClauses.push(`avatar = $${i++}`)
        params.push(avatarData.data?.[0]?.imageUrl || row.avatar)
        setClauses.push(`roblox_name_changed_at = $${i++}`)
        params.push(new Date().toISOString())
      } catch {
        return res.status(400).json({ error: 'Error al verificar el usuario de Roblox.' })
      }
    }

    if (newPassword) {
      if (!oldPassword) return res.status(400).json({ error: 'La contraseña actual es requerida.' })
      if (!bcrypt.compareSync(oldPassword, row.password_hash)) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta.' })
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' })
      }
      setClauses.push(`password_hash = $${i++}`)
      params.push(bcrypt.hashSync(newPassword, 10))
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos para actualizar.' })
    }

    params.push(req.user.id)
    const updated = await queryOne(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    )
    return res.json({ user: formatUser(updated) })
  } catch (err) {
    console.error('[users/me PATCH]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── PATCH /api/users/:id/status ───────────────────────────────────────────────

router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body
    const { id }     = req.params

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: "status debe ser 'active' o 'inactive'." })
    }
    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio estado.' })
    }

    const updated = await queryOne(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    )
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado.' })
    return res.json({ user: formatUser(updated) })
  } catch (err) {
    console.error('[users/:id/status]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' })
    }
    const deleted = await queryOne('DELETE FROM users WHERE id = $1 RETURNING id', [id])
    if (!deleted) return res.status(404).json({ error: 'Usuario no encontrado.' })
    return res.json({ success: true })
  } catch (err) {
    console.error('[users DELETE]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

module.exports = router
