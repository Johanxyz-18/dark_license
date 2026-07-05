-- ============================================================
--  DARK LICENSE — Row Level Security (RLS)
--  Archivo: 3_rls_policies.sql
--  Ejecutar TERCERO (opcional pero recomendado en Supabase)
--
--  NOTA: Este proyecto usa su propio sistema de autenticación
--  con JWT (no usa Supabase Auth). Por eso desactivamos RLS
--  y dejamos que el backend Express controle el acceso.
--
--  Si en el futuro migras a Supabase Auth, activa RLS aquí.
-- ============================================================

-- Desactivar RLS en todas las tablas
-- (el backend Express es el que valida los tokens JWT)
ALTER TABLE users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE events          DISABLE ROW LEVEL SECURITY;
ALTER TABLE justifications  DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    DISABLE ROW LEVEL SECURITY;

-- ── Permisos para el service role (usado por el backend) ────
-- Supabase crea automáticamente el rol "service_role" con acceso total.
-- Asegurarse de que anon no tenga acceso directo a las tablas.
REVOKE ALL ON users          FROM anon;
REVOKE ALL ON events         FROM anon;
REVOKE ALL ON justifications FROM anon;
REVOKE ALL ON activity_log   FROM anon;

GRANT ALL ON users          TO service_role;
GRANT ALL ON events         TO service_role;
GRANT ALL ON justifications TO service_role;
GRANT ALL ON activity_log   TO service_role;

-- Permisos en las secuencias (para que funcione SERIAL / autoincrement)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
