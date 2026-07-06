# Guía de deploy — Dark License

## Cuentas de prueba

| Usuario      | Contraseña | Rol   |
|--------------|-----------|-------|
| `johan159gl` | `123456`   | Admin |

> Los demás usuarios se crean mediante **invitaciones** generadas desde el panel admin.
> Admin → Usuarios → "Generar invitación" → compartir el código `DL-XXXXXX` con el nuevo miembro.

---

## Paso 1 — Supabase (base de datos)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y pega el contenido de `database/supabase_setup.sql` → **Run**
3. Ve a **Settings → Database** y copia la **Connection string (URI)**
   - Formato: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

---

## Paso 2 — Render (backend)

1. Crea cuenta en [render.com](https://render.com) y crea un **Web Service**
2. Conecta tu repositorio
3. Configuración:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
4. Variables de entorno en Render:

| Variable       | Valor                                      |
|----------------|--------------------------------------------|
| `DATABASE_URL` | La URI de Supabase del paso anterior       |
| `JWT_SECRET`   | Texto largo y aleatorio (mínimo 32 chars)  |
| `FRONTEND_URL` | `https://TU-APP.vercel.app`                |
| `NODE_ENV`     | `production`                               |

5. Despliega. Anota la URL: `https://dl-backend-xxxx.onrender.com`

---

## Paso 3 — Vercel (frontend)

1. Crea cuenta en [vercel.com](https://vercel.com) e importa el repositorio
2. Configuración:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Edita `frontend/vercel.json`** — reemplaza `TU-BACKEND` con tu subdominio real de Render:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://dl-backend-xxxx.onrender.com/api/:path*"
       }
     ]
   }
   ```
4. Despliega.

---

## Desarrollo local

### Backend
```bash
cd backend
cp .env.example .env
# Rellena DATABASE_URL con tu URL de Supabase y JWT_SECRET con cualquier texto
npm install
npm run dev   # corre en http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # corre en http://localhost:5173
```

El proxy en `vite.config.js` redirige `/api/*` → `localhost:3000` automáticamente.

---

## Endpoints disponibles

```
POST /api/auth/login              → login
POST /api/auth/register           → registro (verifica Roblox)
GET  /api/auth/me                 → usuario actual

GET  /api/users                   → listar usuarios (mod+)
GET  /api/users/birthdays         → cumpleaños
PATCH /api/users/me               → actualizar perfil
PATCH /api/users/:id/status       → activar/desactivar (admin)

GET  /api/events                  → listar eventos
POST /api/events                  → crear (admin)
PATCH /api/events/:id             → actualizar (admin)
DELETE /api/events/:id            → eliminar (admin)

GET  /api/justifications          → listar (admin: todas, user: las suyas)
POST /api/justifications          → crear
PATCH /api/justifications/:id     → aprobar/rechazar (admin)

GET  /api/dashboard/stats         → estadísticas (admin)
GET  /api/dashboard/activity-chart
GET  /api/dashboard/justification-status
GET  /api/dashboard/recent

GET  /api/roblox?username=...     → lookup Roblox
```
