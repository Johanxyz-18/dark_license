-- ============================================================
--  DARK LICENSE — Schema principal
--  Archivo: 1_schema.sql
--  Ejecutar PRIMERO en Supabase → SQL Editor
-- ============================================================

-- ── Extensiones ──────────────────────────────────────────────
-- pgcrypto permite usar gen_random_uuid() si en algún momento
-- quieres usar UUIDs en lugar de integers.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Tabla: users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               SERIAL        PRIMARY KEY,
  username         TEXT          UNIQUE NOT NULL,
  password_hash    TEXT          NOT NULL,
  display_name     TEXT          NOT NULL,
  roblox_username  TEXT,
  roblox_id        TEXT,
  avatar           TEXT,
  role             TEXT          NOT NULL DEFAULT 'user'
                                 CHECK (role IN ('admin', 'moderator', 'user')),
  status           TEXT          NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active', 'inactive')),
  birthday         DATE,                          -- formato YYYY-MM-DD
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Tabla: events ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id               SERIAL        PRIMARY KEY,
  titulo           TEXT          NOT NULL,
  descripcion      TEXT,
  fecha            DATE          NOT NULL,        -- formato YYYY-MM-DD
  participantes    TEXT,
  realizada        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_by       INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Tabla: justifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS justifications (
  id               SERIAL        PRIMARY KEY,
  user_id          INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evento_id        INTEGER       REFERENCES events(id) ON DELETE SET NULL,
  evento_nombre    TEXT,
  motivo           TEXT          NOT NULL,
  fecha            DATE          NOT NULL,
  descripcion      TEXT,
  estado           TEXT          NOT NULL DEFAULT 'pendiente'
                                 CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  archivo          TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Tabla: activity_log ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id               SERIAL        PRIMARY KEY,
  type             TEXT          NOT NULL
                                 CHECK (type IN ('join', 'justification', 'approve', 'birthday', 'event')),
  user_id          INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  message          TEXT          NOT NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Índices para búsquedas frecuentes ───────────────────────
CREATE INDEX IF NOT EXISTS idx_users_username        ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role            ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status          ON users(status);
CREATE INDEX IF NOT EXISTS idx_events_fecha          ON events(fecha);
CREATE INDEX IF NOT EXISTS idx_justifications_user   ON justifications(user_id);
CREATE INDEX IF NOT EXISTS idx_justifications_evento ON justifications(evento_id);
CREATE INDEX IF NOT EXISTS idx_justifications_estado ON justifications(estado);
CREATE INDEX IF NOT EXISTS idx_activity_log_user     ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created  ON activity_log(created_at DESC);
