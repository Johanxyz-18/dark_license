-- ============================================================
--  DARK LICENSE — Setup completo para Supabase
--  Pega este archivo en Supabase → SQL Editor → Run
-- ============================================================

-- ── 1. LIMPIAR si ya existía ─────────────────────────────────
DROP TABLE IF EXISTS activity_log    CASCADE;
DROP TABLE IF EXISTS justifications  CASCADE;
DROP TABLE IF EXISTS events          CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

-- ── 2. TABLAS ────────────────────────────────────────────────

CREATE TABLE users (
  id               SERIAL        PRIMARY KEY,
  username         TEXT          UNIQUE NOT NULL,
  password_hash    TEXT          NOT NULL,
  system_name      TEXT,                          -- nombre en el sistema (puesto por admin al crear cuenta)
  display_name     TEXT          NOT NULL,        -- displayName de Roblox
  roblox_username  TEXT,
  roblox_id        TEXT,
  avatar           TEXT,
  role             TEXT          NOT NULL DEFAULT 'user'
                                 CHECK (role IN ('admin', 'moderator', 'user')),
  status           TEXT          NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active', 'inactive')),
  birthday         DATE,
  phone            TEXT          UNIQUE,
  roblox_name_changed_at TIMESTAMPTZ,            -- última vez que cambió nombre en Roblox
  pending_dl_deadline    TIMESTAMPTZ,            -- si no tiene DL, fecha límite para ponerlo (7 días)
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id               SERIAL        PRIMARY KEY,
  titulo           TEXT          NOT NULL,
  descripcion      TEXT,
  fecha            DATE          NOT NULL,
  participantes    TEXT,
  realizada        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_by       INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE justifications (
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

CREATE TABLE activity_log (
  id               SERIAL        PRIMARY KEY,
  type             TEXT          NOT NULL,
  user_id          INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  message          TEXT          NOT NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 3. ÍNDICES ───────────────────────────────────────────────

CREATE INDEX idx_users_username        ON users(username);
CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_users_status          ON users(status);
CREATE INDEX idx_events_fecha          ON events(fecha);
CREATE INDEX idx_justifications_user   ON justifications(user_id);
CREATE INDEX idx_justifications_estado ON justifications(estado);
CREATE INDEX idx_activity_log_created  ON activity_log(created_at DESC);

-- ── 4. USUARIOS DE PRUEBA ────────────────────────────────────
-- admin    → contraseña: admin123
-- testuser → contraseña: user123

INSERT INTO users (username, password_hash, system_name, display_name, roblox_username, roblox_id, avatar, role, status, birthday) VALUES
(
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
),
(
  'testuser',
  '$2a$10$Xoqk6LjafrFhuAtj7dIv4eZt5o6tZ9t9ZbBaOkdu6SblMo5WHgvo.',
  'TestUser',
  'DL_TestUser',
  'DL_TestUser',
  '9876543210',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=testuser',
  'user',
  'active',
  '2000-07-04'
);

-- ── 5. PERMISOS ──────────────────────────────────────────────
-- El backend Express usa JWT propio, no Supabase Auth.
-- Solo el service_role (backend) tiene acceso.

ALTER TABLE users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE events          DISABLE ROW LEVEL SECURITY;
ALTER TABLE justifications  DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    DISABLE ROW LEVEL SECURITY;

REVOKE ALL ON users, events, justifications, activity_log FROM anon;
GRANT  ALL ON users, events, justifications, activity_log TO  service_role;
GRANT  USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public    TO  service_role;
