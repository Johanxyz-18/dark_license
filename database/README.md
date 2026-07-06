# Base de datos — Dark License

## Archivo único

Solo hay un archivo: **`supabase_setup.sql`**

## Cómo usarlo

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Clic en **SQL Editor** → **New query**
3. Pega el contenido de `supabase_setup.sql`
4. Clic en **Run**

Eso crea todas las tablas, índices y el usuario admin desde cero.

## Qué crea

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema con soporte para nombre de sistema, DL deadline, cooldown de cambio de nombre Roblox |
| `events` | Actividades/eventos creados por admins |
| `justifications` | Justificaciones de ausencia de usuarios |
| `activity_log` | Log de actividad del sistema |

## Credenciales iniciales

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `johan159gl` | `123456` | Admin |

## Notas

- El script es **idempotente**: borra y recrea todo. Úsalo solo en setup inicial.
- El backend usa JWT propio, no Supabase Auth. RLS está desactivado.
- Solo el `service_role` tiene acceso directo a las tablas.
- Para resetear la BD en producción, vuelve a correr el mismo script.
