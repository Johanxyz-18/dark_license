/**
 * auth.js — Rutas de autenticación
 *
 * POST /api/auth/login    → iniciar sesión (verifica DL en Roblox en cada intento)
 * POST /api/auth/register → registrar cuenta (verifica DL + robloxId único)
 * GET  /api/auth/me       → usuario actual (requiere token)
 */

const express = require('express')
const bcrypt  = require('bcryptjs')
const axios   = require('axios')
const { queryOne, queryAll } = require('../db')
const { requireAuth, signToken } = require('../middleware/auth')

const router = express.Router()

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    createdAt:           row.created_at,
  }
}

function hasDLTag(displayName) {
  return typeof displayName === 'string' && displayName.toLowerCase().includes('dl')
}

async function fetchRobloxInfo(robloxUsername) {
  try {
    const { data: userData } = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      { usernames: [robloxUsername], excludeBannedUsers: false },
      { timeout: 6000 }
    )
    if (!userData.data?.length) return null

    const user = userData.data[0]

    const { data: avatarData } = await axios.get(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=420x420&format=Png&isCircular=false`,
      { timeout: 6000 }
    )

    return {
      robloxId:    String(user.id),
      displayName: user.displayName || user.name,
      avatar:      avatarData.data?.[0]?.imageUrl
                   || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${robloxUsername}`,
    }
  } catch {
    return null
  }
}

async function fetchRobloxById(robloxId) {
  try {
    const { data } = await axios.get(
      `https://users.roblox.com/v1/users/${robloxId}`,
      { timeout: 6000 }
    )
    return { displayName: data.displayName || data.name }
  } catch {
    return null
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y contraseña son requeridos.' })
    }

    const row = await queryOne('SELECT * FROM users WHERE username = $1', [username.trim()])

    if (!row) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
    }

    const valid = bcrypt.compareSync(password, row.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
    }

    // Verificar en Roblox que el nombre sigue teniendo "DL"
    // Solo para usuarios normales (admins no se verifican para no bloquearlos)
    if (row.role !== 'admin' && row.roblox_id) {
      const robloxCurrent = await fetchRobloxById(row.roblox_id)

      if (robloxCurrent) {
        if (!hasDLTag(robloxCurrent.displayName)) {
          await queryOne(
            "UPDATE users SET status = 'inactive', display_name = $1 WHERE id = $2 RETURNING id",
            [robloxCurrent.displayName, row.id]
          )
          await queryOne(
            "INSERT INTO activity_log (type, user_id, message) VALUES ('join', $1, $2)",
            [row.id, `cuenta suspendida: nombre de Roblox cambiado a "${robloxCurrent.displayName}" (no contiene DL)`]
          )
          return res.status(403).json({
            error: `Tu nombre de Roblox fue cambiado a "${robloxCurrent.displayName}" y ya no contiene "DL". Tu cuenta ha sido suspendida. Vuelve a agregar "DL" en tu nombre de Roblox para recuperar el acceso.`,
            reason: 'dl_removed',
          })
        } else if (row.status === 'inactive' && hasDLTag(robloxCurrent.displayName)) {
          await queryOne(
            "UPDATE users SET status = 'active', display_name = $1 WHERE id = $2 RETURNING id",
            [robloxCurrent.displayName, row.id]
          )
          await queryOne(
            "INSERT INTO activity_log (type, user_id, message) VALUES ('join', $1, $2)",
            [row.id, `cuenta reactivada: nombre de Roblox actualizado a "${robloxCurrent.displayName}" (contiene DL)`]
          )
        } else {
          await queryOne(
            'UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id',
            [robloxCurrent.displayName, row.id]
          )
        }
      }
    }

    const updatedRow = await queryOne('SELECT * FROM users WHERE id = $1', [row.id])
    if (updatedRow.status === 'inactive') {
      return res.status(403).json({
        error: 'Tu cuenta está desactivada. Si crees que es un error, contacta al administrador.',
      })
    }

    // Verificar si tenía plazo de gracia para poner DL y ya venció
    if (updatedRow.pending_dl_deadline && updatedRow.role !== 'admin') {
      if (new Date() > new Date(updatedRow.pending_dl_deadline)) {
        // Verificar si ya puso DL
        const robloxCheck = await fetchRobloxById(updatedRow.roblox_id)
        if (robloxCheck && !hasDLTag(robloxCheck.displayName)) {
          await queryOne("UPDATE users SET status = 'inactive' WHERE id = $1 RETURNING id", [updatedRow.id])
          return res.status(403).json({
            error: 'Tu período de gracia de 7 días venció. Agrega "DL" a tu nombre de Roblox y contacta al administrador para reactivar tu cuenta.',
            reason: 'dl_deadline_expired',
          })
        } else {
          // Ya puso DL, limpiar el deadline
          await queryOne("UPDATE users SET pending_dl_deadline = NULL WHERE id = $1 RETURNING id", [updatedRow.id])
        }
      }
    }

    const token = signToken({ id: updatedRow.id, username: updatedRow.username, role: updatedRow.role })
    return res.json({ token, user: formatUser(updatedRow) })
  } catch (err) {
    console.error('[login]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── POST /api/auth/register ───────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { username, password, robloxUsername, phone } = req.body

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

    const roblox = await fetchRobloxInfo(robloxUsername)
    if (!roblox) {
      return res.status(400).json({ error: 'No se encontró el usuario de Roblox. Verifica el username.' })
    }
    if (!hasDLTag(roblox.displayName)) {
      return res.status(403).json({ error: 'Tu nombre de Roblox debe contener "DL" para registrarte.' })
    }

    const robloxTaken = await queryOne('SELECT id FROM users WHERE roblox_id = $1', [roblox.robloxId])
    if (robloxTaken) {
      return res.status(409).json({ error: 'Este usuario de Roblox ya tiene una cuenta registrada.' })
    }

    if (phone) {
      const phoneTaken = await queryOne('SELECT id FROM users WHERE phone = $1', [phone])
      if (phoneTaken) {
        return res.status(409).json({ error: 'Ese número de teléfono ya está registrado.' })
      }
    }

    const passwordHash = bcrypt.hashSync(password, 10)

    const newUser = await queryOne(
      `INSERT INTO users (username, password_hash, system_name, display_name, roblox_username, roblox_id, avatar, role, status, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'user', 'active', $8)
       RETURNING *`,
      [username.trim(), passwordHash, roblox.displayName, roblox.displayName, robloxUsername.trim(), roblox.robloxId, roblox.avatar, phone || null]
    )

    await queryOne(
      "INSERT INTO activity_log (type, user_id, message) VALUES ('join', $1, 'se unió al servidor')",
      [newUser.id]
    )

    const token = signToken({ id: newUser.id, username: newUser.username, role: newUser.role })
    return res.status(201).json({ token, user: formatUser(newUser) })
  } catch (err) {
    console.error('[register]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res) => {
  try {
    const row = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id])
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado.' })
    return res.json({ user: formatUser(row) })
  } catch (err) {
    console.error('[me]', err.message)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
})

module.exports = router
