-- ================================================================
--  DARK LICENSE — Setup completo de base de datos para Supabase
--  Ejecuta este archivo en: Supabase → SQL Editor → Run
--
--  Este script es IDEMPOTENTE: puedes correrlo múltiples veces
--  sin errores. Borra y recrea todo desde cero.
-- ================================================================


-- ── 1. LIMPIAR tablas existentes ─────────────────────────────────────────────

DROP TABLE IF EXISTS activity_log    CASCADE;
DROP TABLE IF EXISTS justifications  CASCADE;
DROP TABLE IF EXISTS events          CASCADE;
DROP TABLE IF EXISTS users           CASCADE;


-- ── 2. TABLA: users ──────────────────────────────────────────────────────────
-- Columnas usadas por el backend:
--   id, username, password_hash, system_name, display_name,
--   roblox_username, roblox_id, avatar, role, status,
--   birthday, phone, pending_dl_deadline, roblox_name_changed_at, created_at

CREATE TABLE users (
  id                     SERIAL       PRIMARY KEY,
  username               TEXT         UNIQUE NOT NULL,
  password_hash          TEXT         NOT NULL,
  system_name            TEXT,                        -- nombre en el sistema (puesto por admin o usuario)
  display_name           TEXT         NOT NULL,       -- displayName de Roblox
  roblox_username        TEXT,
  roblox_id              TEXT,
  avatar                 TEXT,
  role                   TEXT         NOT NULL DEFAULT 'user'
                                      CHECK (role IN ('admin', 'moderator', 'user')),
  status                 TEXT         NOT NULL DEFAULT 'active'
                                      CHECK (status IN ('active', 'inactive')),
  birthday               DATE,
  phone                  TEXT         UNIQUE,         -- teléfono único por usuario
  pending_dl_deadline    TIMESTAMPTZ,                 -- plazo para agregar DL al nombre (7 días gracia)
  roblox_name_changed_at TIMESTAMPTZ,                 -- última vez que cambió su username de Roblox
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ── 3. TABLA: events ─────────────────────────────────────────────────────────
-- Columnas usadas por el backend:
--   id, titulo, descripcion, fecha, participantes, realizada, created_by, created_at

CREATE TABLE events (
  id            SERIAL       PRIMARY KEY,
  titulo        TEXT         NOT NULL,
  descripcion   TEXT,
  fecha         DATE         NOT NULL,
  participantes TEXT,
  realizada     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ── 4. TABLA: justifications ─────────────────────────────────────────────────
-- Columnas usadas por el backend:
--   id, user_id, evento_id, evento_nombre, motivo, fecha,
--   descripcion, estado, archivo, created_at

CREATE TABLE justifications (
  id            SERIAL       PRIMARY KEY,
  user_id       INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evento_id     INTEGER      REFERENCES events(id) ON DELETE SET NULL,
  evento_nombre TEXT,
  motivo        TEXT         NOT NULL,
  fecha         DATE         NOT NULL,
  descripcion   TEXT,
  estado        TEXT         NOT NULL DEFAULT 'pendiente'
                             CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  archivo       TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ── 5. TABLA: activity_log ───────────────────────────────────────────────────
-- Columnas usadas por el backend:
--   id, type, user_id, message, created_at

CREATE TABLE activity_log (
  id         SERIAL       PRIMARY KEY,
  type       TEXT         NOT NULL
                          CHECK (type IN ('join', 'justification', 'approve', 'birthday', 'event')),
  user_id    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  message    TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ── 6. ÍNDICES para mejor rendimiento ────────────────────────────────────────

CREATE INDEX idx_users_username         ON users(username);
CREATE INDEX idx_users_role             ON users(role);
CREATE INDEX idx_users_status           ON users(status);
CREATE INDEX idx_users_birthday         ON users(birthday);
CREATE INDEX idx_events_fecha           ON events(fecha);
CREATE INDEX idx_events_created_by      ON events(created_by);
CREATE INDEX idx_justifications_user    ON justifications(user_id);
CREATE INDEX idx_justifications_evento  ON justifications(evento_id);
CREATE INDEX idx_justifications_estado  ON justifications(estado);
CREATE INDEX idx_activity_log_user      ON activity_log(user_id);
CREATE INDEX idx_activity_log_created   ON activity_log(created_at DESC);


-- ── 7. USUARIO ADMINISTRADOR ─────────────────────────────────────────────────
-- usuario: johan159gl
-- contraseña: 123456
-- Hash bcrypt generado con 10 rondas

INSERT INTO users (
  username, password_hash, system_name, display_name,
  roblox_username, roblox_id, avatar,
  role, status, birthday
) VALUES (
  'johan159gl',
  '$2a$10$54eEzR9.Hlio8tbxYGRDoeIu16Rm6k/chVcQESv95OemMZrxm13ru',
  'Johan',
  'DL_Johan',
  'DL_Johan',
  '1000000001',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=johan159gl',
  'admin',
  'active',
  '2000-01-01'
);


-- ── 8. PERMISOS DE SUPABASE ───────────────────────────────────────────────────
-- El backend usa JWT propio (no Supabase Auth).
-- Solo el service_role (backend) accede directamente a la BD.
-- Los usuarios anónimos no tienen acceso.

ALTER TABLE users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE events          DISABLE ROW LEVEL SECURITY;
ALTER TABLE justifications  DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    DISABLE ROW LEVEL SECURITY;

REVOKE ALL ON users, events, justifications, activity_log FROM anon;

GRANT ALL ON users, events, justifications, activity_log TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public    TO service_role;


-- ── FIN ───────────────────────────────────────────────────────────────────────
-- Credenciales de acceso:
--   Admin: johan159gl / 123456
-- ─────────────────────────────────────────────────────────────────────────────
