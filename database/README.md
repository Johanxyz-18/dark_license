# Base de datos — Dark License

## Archivos

| Archivo | Qué hace |
|---------|----------|
| `1_schema.sql` | Crea todas las tablas, tipos y índices |
| `2_seed.sql` | Inserta los datos de ejemplo (usuarios, eventos, etc.) |
| `3_rls_policies.sql` | Configura permisos para Supabase |

---

## Cómo subir a Supabase

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo
2. Anota la **URL** y el **service_role key** (los necesitarás para el backend)

### 2. Ejecutar los SQL en orden
1. En tu proyecto Supabase → **SQL Editor** → **New query**
2. Pega y ejecuta `1_schema.sql` → Run
3. Pega y ejecuta `2_seed.sql` → Run
4. Pega y ejecuta `3_rls_policies.sql` → Run

### 3. Conectar el backend a Supabase

Instala el cliente de PostgreSQL:
```bash
cd backend
npm install pg
```

Crea un `.env` con las credenciales de Supabase:
```env
# Supabase → Project Settings → Database → Connection string (URI)
DATABASE_URL=postgresql://postgres:[TU_PASSWORD]@db.[TU_REF].supabase.co:5432/postgres

JWT_SECRET=tu_secreto_largo_aqui
PORT=3000
FRONTEND_URL=https://tu-app.vercel.app
```

### 4. Contraseñas de los usuarios seed

| Usuario | Contraseña |
|---------|-----------|
| `admin` | `admin123` |
| `usuario1` | `123456` |
| `gamer_x` | `123456` |
| `luna_rx` | `123456` |
| `pro_builder` | `123456` |

---

## Estructura de tablas

```
users
  id, username, password_hash, display_name,
  roblox_username, roblox_id, avatar,
  role (admin/moderator/user), status (active/inactive),
  birthday, created_at

events
  id, titulo, descripcion, fecha, participantes,
  realizada (boolean), created_by → users.id, created_at

justifications
  id, user_id → users.id, evento_id → events.id,
  evento_nombre, motivo, fecha, descripcion,
  estado (pendiente/aprobada/rechazada), archivo, created_at

activity_log
  id, type, user_id → users.id, message, created_at
```
