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
DROP TABLE IF EXISTS invitations     CASCADE;
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
--   id, titulo, descripcion, fecha, participantes, realizada, created_by, created_at, closes_at

CREATE TABLE events (
  id            SERIAL       PRIMARY KEY,
  titulo        TEXT         NOT NULL,
  descripcion   TEXT,
  fecha         DATE         NOT NULL,
  participantes TEXT,
  realizada     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  closes_at     TIMESTAMPTZ  NOT NULL,  -- cierre automático: created_at + 30 horas
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


-- ── 5. TABLA: monthly_records ────────────────────────────────────────────────
-- Historial mensual de asistencias por usuario.
-- Al inicio de cada mes se crea un nuevo registro para el mes anterior.

CREATE TABLE monthly_records (
  id              SERIAL       PRIMARY KEY,
  user_id         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year_month      TEXT         NOT NULL,  -- 'YYYY-MM'
  total_events    INTEGER      NOT NULL DEFAULT 0,  -- actividades en ese mes
  attended        INTEGER      NOT NULL DEFAULT 0,  -- asistió (no justificó ni faltó sin justif)
  justified       INTEGER      NOT NULL DEFAULT 0,  -- justificaciones aprobadas
  unjustified     INTEGER      NOT NULL DEFAULT 0,  -- faltas sin justificación
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year_month)
);

CREATE INDEX idx_monthly_records_user     ON monthly_records(user_id);
CREATE INDEX idx_monthly_records_month    ON monthly_records(year_month);

-- ── 6. TABLA: notifications ──────────────────────────────────────────────────
-- Notificaciones internas para usuarios (cierre de actividades sin justificar, etc.)

CREATE TABLE notifications (
  id          SERIAL       PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT         NOT NULL,   -- 'activity_closed' | 'monthly_reset' | 'warning'
  title       TEXT         NOT NULL,
  message     TEXT         NOT NULL,
  read        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user   ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read);

-- ── 7. TABLA: invitations ────────────────────────────────────────────────────
-- Códigos de invitación generados por el admin
-- El invitado los usa al registrarse para crear su propia cuenta

CREATE TABLE invitations (
  id            SERIAL       PRIMARY KEY,
  code          TEXT         UNIQUE NOT NULL,  -- código único ej: DL-ABC123
  role          TEXT         NOT NULL DEFAULT 'user'
                             CHECK (role IN ('admin', 'moderator', 'user')),
  system_name   TEXT,                          -- nombre en sistema sugerido por admin
  created_by    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  used_by       INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  used_at       TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ  NOT NULL,         -- expira en 7 días
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_invitations_created_by ON invitations(created_by);

-- ── 6. TABLA: activity_log ───────────────────────────────────────────────────
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


-- ── 8. ÍNDICES adicionales ───────────────────────────────────────────────────

CREATE INDEX idx_users_username         ON users(username);
CREATE INDEX idx_users_role             ON users(role);
CREATE INDEX idx_users_status           ON users(status);
CREATE INDEX idx_users_birthday         ON users(birthday);
CREATE INDEX idx_events_fecha           ON events(fecha);
CREATE INDEX idx_events_closes_at       ON events(closes_at);
CREATE INDEX idx_events_created_by      ON events(created_by);
CREATE INDEX idx_justifications_user    ON justifications(user_id);
CREATE INDEX idx_justifications_evento  ON justifications(evento_id);
CREATE INDEX idx_justifications_estado  ON justifications(estado);
CREATE INDEX idx_activity_log_user      ON activity_log(user_id);
CREATE INDEX idx_activity_log_created   ON activity_log(created_at DESC);


-- ── 9. USUARIO ADMINISTRADOR ──────────────────────────────────────────────────
-- usuario: johan159gl  /  contraseña: 123456

INSERT INTO users (
  username, password_hash, system_name, display_name,
  roblox_username, roblox_id, avatar, role, status, birthday
) VALUES (
  'johan159gl',
  '$2a$10$54eEzR9.Hlio8tbxYGRDoeIu16Rm6k/chVcQESv95OemMZrxm13ru',
  'Johan', 'DL_Johan', 'DL_Johan', '1000000001',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=johan159gl',
  'admin', 'active', '2000-01-01'
);


-- ── 10. PERMISOS DE SUPABASE ──────────────────────────────────────────────────

ALTER TABLE users            DISABLE ROW LEVEL SECURITY;
ALTER TABLE events           DISABLE ROW LEVEL SECURITY;
ALTER TABLE justifications   DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log     DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations      DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_records  DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    DISABLE ROW LEVEL SECURITY;

REVOKE ALL ON users, events, justifications, activity_log,
             invitations, monthly_records, notifications FROM anon;

GRANT ALL ON users, events, justifications, activity_log,
            invitations, monthly_records, notifications TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;


-- ── FIN ───────────────────────────────────────────────────────────────────────
-- Admin: johan159gl / 123456
-- ─────────────────────────────────────────────────────────────────────────────
