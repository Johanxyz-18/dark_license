-- ============================================================
--  DARK LICENSE — Datos de ejemplo (seed)
--  Archivo: 2_seed.sql
--  Ejecutar SEGUNDO en Supabase → SQL Editor
--
--  IMPORTANTE: Los hashes de contraseña ya están generados
--  con bcrypt (10 rondas):
--    admin123  → $2b$10$... (hash abajo)
--    123456    → $2b$10$... (hash abajo)
--
--  Para cambiar contraseñas genera nuevos hashes con:
--    node -e "const b=require('bcryptjs'); console.log(b.hashSync('TU_PASS',10))"
-- ============================================================

-- Limpiar datos existentes (orden inverso por foreign keys)
TRUNCATE activity_log, justifications, events, users RESTART IDENTITY CASCADE;

-- ── Usuarios ─────────────────────────────────────────────────
INSERT INTO users (username, password_hash, display_name, roblox_username, roblox_id, avatar, role, status, birthday) VALUES
(
  'admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'DL_AdminMaster',
  'DL_AdminMaster',
  '1234567890',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=admin',
  'admin',
  'active',
  '1998-03-15'
),
(
  'usuario1',
  '$2b$10$TKh8H1.PfYhAL5NVQRN.OuYJcDNqEEHnRvtpGlvKHH0n5.b5Ye25G', -- 123456
  'DL_StarPlayer',
  'DL_StarPlayer',
  '9876543210',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=star',
  'user',
  'active',
  '2000-07-04'
),
(
  'gamer_x',
  '$2b$10$TKh8H1.PfYhAL5NVQRN.OuYJcDNqEEHnRvtpGlvKHH0n5.b5Ye25G', -- 123456
  'DL_GamerX',
  'DL_GamerX',
  '1122334455',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=gamer',
  'user',
  'active',
  '2001-12-25'
),
(
  'luna_rx',
  '$2b$10$TKh8H1.PfYhAL5NVQRN.OuYJcDNqEEHnRvtpGlvKHH0n5.b5Ye25G', -- 123456
  'DL_LunaRX',
  'DL_LunaRX',
  '5566778899',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=luna',
  'user',
  'inactive',
  '2000-07-04'
),
(
  'pro_builder',
  '$2b$10$TKh8H1.PfYhAL5NVQRN.OuYJcDNqEEHnRvtpGlvKHH0n5.b5Ye25G', -- 123456
  'DL_ProBuilder',
  'DL_ProBuilder',
  '9988776655',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=builder',
  'moderator',
  'active',
  '1999-11-08'
);

-- ── Eventos ───────────────────────────────────────────────────
INSERT INTO events (titulo, descripcion, fecha, participantes, realizada, created_by) VALUES
(
  'Reunión semanal del equipo',
  'Reunión obligatoria de todos los miembros.',
  '2025-07-10',
  'Todos los miembros',
  TRUE,
  1
),
(
  'Torneo interno Roblox',
  'Competencia interna entre miembros del servidor.',
  '2025-07-20',
  'Todos',
  FALSE,
  1
),
(
  'Entrenamiento de moderadores',
  'Sesión de entrenamiento para moderadores nuevos.',
  '2025-08-05',
  'Moderadores y admins',
  FALSE,
  1
);

-- ── Justificaciones ───────────────────────────────────────────
INSERT INTO justifications (user_id, evento_id, evento_nombre, motivo, fecha, descripcion, estado) VALUES
(2, 1, 'Reunión semanal del equipo', 'Cita médica',        '2025-07-10', 'Tengo una cita médica programada con el especialista.',  'aprobada'),
(2, NULL, NULL,                      'Viaje familiar',     '2025-02-20', 'Viaje familiar previamente planificado.',                'pendiente'),
(3, NULL, NULL,                      'Examen universitario','2025-01-22','Examen parcial, es obligatorio asistir.',                'rechazada'),
(4, NULL, NULL,                      'Trabajo extra',      '2025-03-05', 'Turno extra en mi trabajo que no puedo rechazar.',       'pendiente'),
(5, NULL, NULL,                      'Problema técnico',   '2025-01-30', 'Mi equipo tuvo una falla eléctrica.',                   'aprobada');

-- ── Log de actividad ──────────────────────────────────────────
INSERT INTO activity_log (type, user_id, message) VALUES
('join',          2, 'se unió al servidor'),
('justification', 3, 'envió una justificación'),
('approve',       1, 'aprobó una justificación'),
('join',          5, 'actualizó su perfil');
