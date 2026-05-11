# Setup local — paso a paso

## Pre-requisitos

- Node.js 20+ (tienes 24, ok)
- npm 10+
- Proyecto Supabase (gratuito sirve)
- Git

## 1. Instalar dependencias

```powershell
cd C:\Users\abdiel\Desktop\Claude\Programas\studioflow-platform
npm install
```

Esto va a tomar un par de minutos. Va a generar `package-lock.json`.

## 2. Crear proyecto Supabase

1. Ir a [supabase.com](https://supabase.com) → crear nuevo proyecto.
2. Anota el password de la DB.
3. Settings → Database → Connection string → URI mode.
4. Settings → API → copia `Project URL`, `anon public` y `service_role`.

## 3. Configurar `.env.local`

```powershell
Copy-Item .env.example .env.local
```

Editar `.env.local`:

```env
# Connection pooling (puerto 6543) para queries normales
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (puerto 5432) para migrations
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

NODE_ENV="development"
LOG_LEVEL="debug"
```

## 4. Generar Prisma client y aplicar schema

```powershell
npm run db:generate
npm run db:push
```

`db:push` aplica el schema sin crear archivos de migración (ok para Fase 0). En producción usar `db:migrate`.

## 5. Cargar datos iniciales (seed)

```powershell
npm run db:seed
```

Esto crea:
- 50+ permisos (catálogo completo)
- 10 roles del sistema (SUPERADMIN, OWNER, ADMIN, SALES, CASHIER, etc.)
- Empresa demo "Demo Studio SRL"
- Sucursal MAIN
- Secuencia NCF B02 (1-10000)
- 6 configuraciones de impuestos (ITBIS 18/16/0, exento, retenciones)
- Super admin: `admin@studioflow.app` / `Admin123!`

## 6. Levantar dev server

```powershell
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) → redirige a `/login`.

## 7. Verificar

- [ ] Login con `admin@studioflow.app` / `Admin123!` funciona
- [ ] Dashboard carga con sidebar colapsable
- [ ] Navegar a /facturacion, /crm, /gallery, /finanzas, /inventario-link, /settings muestra placeholders
- [ ] Theme toggle (sol/luna) funciona
- [ ] Logout vuelve a /login

## Problemas comunes

### "Module not found: @/packages/..."

Verifica `tsconfig.json` tiene los paths configurados. Reinicia TS Server en VSCode (Cmd+Shift+P → "TypeScript: Restart TS Server").

### "PrismaClient is unable to be run in the browser"

Importaste `@/packages/db` desde un Client Component. Mueve esa lógica a Server Action o Server Component.

### "Failed to load auth.config"

Revisa que `middleware.ts` importa de `@/packages/auth/auth.config` (Edge-safe), NO de `@/packages/auth` (Node-only).

### Seed falla con "RolePermission" duplicate

El seed se puede correr múltiples veces. Si falla, ejecutar:
```sql
TRUNCATE TABLE role_permissions, roles, permissions CASCADE;
```
Y volver a correr `npm run db:seed`.

## Próximo: Fase 1

Empezar por:
1. CRUD de empresa (settings)
2. CRUD de usuarios + invitar
3. CRUD de clientes
4. CRUD de productos
5. Gestión de NCF (paginas en settings)

Una vez Fase 1 esté lista, Fase 2 (facturas) puede empezar.
