-- ================================================================
--  DARK LICENSE — Migración: Sistema de votaciones para convivencias
--  Ejecuta este archivo en: Supabase → SQL Editor → Run
-- ================================================================

CREATE TABLE IF NOT EXISTS polls (
  id          SERIAL       PRIMARY KEY,
  titulo      TEXT         NOT NULL,
  descripcion TEXT,
  fecha       DATE         NOT NULL,        -- fecha de la convivencia
  closes_at   TIMESTAMPTZ  NOT NULL,        -- cierre automático de votación
  closed      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by  INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id          SERIAL       PRIMARY KEY,
  poll_id     INTEGER      NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  respuesta   TEXT         NOT NULL CHECK (respuesta IN ('si', 'no')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_polls_closed    ON polls(closed);
CREATE INDEX IF NOT EXISTS idx_polls_closes_at ON polls(closes_at);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);

ALTER TABLE polls       DISABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes  DISABLE ROW LEVEL SECURITY;

REVOKE ALL ON polls, poll_votes FROM anon;
GRANT ALL ON polls, poll_votes TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
