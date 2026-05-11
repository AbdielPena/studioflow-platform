# StudioFlow Platform

Plataforma unificada multi-tenant que integra:

- **CRM** — leads, proyectos, clientes
- **Galerías** — estilo Pixieset para fotógrafos
- **Finanzas** — CxC, CxP, caja, bancos
- **Facturación + POS** — fiscalidad dominicana (NCF, ITBIS, retenciones)
- **Conexión con Inventario Externo** — sin inventario interno; se integra con software de inventario aparte

## Stack

- **Next.js 14** App Router + Server Actions
- **TypeScript strict**
- **PostgreSQL (Supabase)** + **Prisma ORM**
- **NextAuth v5** + RBAC granular
- **Tailwind + shadcn/ui** + **Framer Motion**
- **Zod** + **React Hook Form**
- **Decimal.js** para todo lo monetario

## Arquitectura

Modular Monolith multi-tenant. Una sola app, módulos independientes que comparten DB, auth y design system.

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para detalles.

## Setup

### 1. Instalar dependencias

```powershell
npm install
```

### 2. Configurar variables de entorno

```powershell
Copy-Item .env.example .env.local
```

Editar `.env.local` con tus credenciales de Supabase y `AUTH_SECRET`.

```powershell
# Generar AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Base de datos

```powershell
npm run db:generate
npm run db:push       # primer setup (luego usar db:migrate)
npm run db:seed
```

### 4. Dev server

```powershell
npm run dev
```

Login con credenciales seed:

```
admin@studioflow.app / Admin123!
```

## Comandos

```
npm run dev          # Dev server (puerto 3000)
npm run build        # Build de producción
npm run start        # Servir build
npm run lint         # ESLint
npm run typecheck    # TypeScript sin emitir
npm run format       # Prettier
npm run db:generate  # Prisma client
npm run db:migrate   # Crear migración
npm run db:push      # Sync schema (dev)
npm run db:studio    # Prisma Studio
npm run db:seed      # Cargar datos iniciales
```

## Estructura

```
/app                  Next.js App Router
  /(auth)             Login, registro
  /(platform)         Shell autenticado (sidebar + topbar)
    /dashboard
    /facturacion
    /crm
    /gallery
    /finanzas
    /inventario-link
    /settings
  /api                Route handlers
/modules              Lógica de negocio por módulo
  /facturacion
  /crm
  /gallery
  /finanzas
  /inventario-link
  /_shared
/packages             Capas compartidas (DB, auth, lib, events, types)
/components           UI compartido (shadcn + layout)
/prisma               Schema y migraciones
/hooks                React hooks compartidos
```

## Reglas críticas

- El sistema **NO** mantiene inventario interno. Stock viene de **inventario externo** vía adapter.
- Toda transacción monetaria usa `Decimal`, nunca `float`.
- Totales siempre se calculan en backend.
- Documentos fiscales emitidos no se eliminan, solo se anulan (con razón).
- Operaciones críticas usan transacciones de DB.
- Multi-tenant: cada query debe incluir `companyId`.

## Roadmap por fases

| Fase | Estado | Alcance |
|------|--------|---------|
| 0 — Foundation | ✅ Listo | Scaffolding, schema, auth, UI shell |
| 1 — Catálogo + Fiscal | Pendiente | Empresas, usuarios, clientes, productos, NCF |
| 2 — Facturación | Pendiente | Cotizaciones, facturas, PDFs, CxC |
| 3 — Inventario Externo | Pendiente | Adapters, jobs, hooks de factura |
| 4 — POS + Caja | Pendiente | POS, conduce, cierre de caja |
| 5 — Compras + CxP | Pendiente | Suplidores, compras, bancos |
| 6 — Reportes | Pendiente | Dashboard, exports, fiscales |
| 7 — Pulido | Pendiente | UX, accesibilidad, performance |

## Licencia

Propietaria.
