# Arquitectura — StudioFlow Platform

## Decisiones técnicas raíz

### Modular Monolith, no monorepo

Una sola app Next.js, módulos como carpetas con sus propios `actions/`, `services/`, `schemas/`. Compartimos auth, DB, design system y middleware sin overhead de packages publicables.

Razón: simplifica deploy, evita coordinación de versiones, una sola DB, una sola sesión. Si en el futuro se necesita separar (deploys independientes), migrar a monorepo es lineal.

### Multi-tenant desde día 1

Todas las tablas de negocio llevan `companyId`. La sesión incluye `companyId` y `branchId`. Cualquier query sin scope a `companyId` es bug.

Razón: agregar multi-tenancy después es retrabajo masivo. Hacerlo de día 1 cuesta lo mismo y previene fugas cross-empresa.

### NextAuth v5 con JWT + Prisma Adapter, RBAC en app layer

- Sesión = JWT (no DB session). Más rápido y compatible con Edge runtime para middleware.
- `companyId` + `branchId` viajan en el token y se pueden actualizar con `session.update({ companyId })` para cambiar de empresa sin re-loguear.
- Adapter Prisma para `User`, `Account`, `Session` (NextAuth lo requiere) — sessions table queda como respaldo.
- Permisos no van en el JWT (cambian frecuentemente y volverían el token gigante). Se cargan en `getSessionContext()` desde DB con `companyMember.role.permissions`.

### Decimal.js obligatorio para dinero

`float` no representa exactamente 0.1. No es opinión.

- Schema Prisma: `Decimal @db.Decimal(18, 4)` para precios; `Decimal(18, 2)` para totales.
- En código: `import { D } from "@/lib/decimal"` y nunca operar con `Number`.

### Auditoría sin bloqueo

`audit()` no debe nunca tumbar una operación. Si falla, loggea pero no propaga. La auditoría es valor agregado, no bloqueante.

## Capas

### packages/db
Singleton de Prisma con HMR-safe global. Re-exporta enums y tipos generados.

### packages/auth
- `auth.config.ts` — Config Edge-compatible (middleware)
- `index.ts` — Config full (Credentials + Prisma adapter) para route handler y server actions
- `session.ts` — `getSessionContext()` / `requireSession()` / `requireCompany()`
- `rbac.ts` — `hasPermission()` / `requirePermission()`
- Permisos format `module:resource:action`. Catalog en `lib/permissions.ts`.

### packages/lib
- `decimal.ts` — wrapper Decimal.js + helpers de impuestos y líneas
- `errors.ts` — `AppError`, `ActionResult<T>` para server actions
- `logger.ts` — Pino con `pino-pretty` en dev
- `audit.ts` — Trazabilidad sin bloqueo
- `permissions.ts` — Catálogo + roles del sistema
- `utils.ts` — `cn()` para Tailwind, slugify, generateCode

### packages/events
In-memory event bus tipado para comunicación cross-module dentro del mismo proceso. Para eventos que cruzan instancia o requieren persistencia, usar `pending_inventory_sync_jobs` u otra cola en DB.

Subscribers se registran en boot de cada módulo. Patrón:
```ts
// modules/finanzas/listeners.ts
subscribe("invoice.confirmed", async ({ invoiceId, companyId }) => {
  await createReceivableForInvoice(invoiceId);
});
```

### packages/types
Tipos compartidos: `SessionContext`, `ModuleKey`, `Pagination`, `PageResult`.

## Módulos

Cada módulo sigue esta estructura:

```
/modules/<modulo>
  /actions      Server Actions ('use server'), valida con Zod, retorna ActionResult
  /services     Lógica de negocio pura, no toca request/response
  /repositories Acceso a DB, scope por companyId
  /schemas      Zod schemas de input/output
  /components   Componentes específicos del módulo (preferir colocación cercana)
  /listeners.ts Subscribers al event bus
  /index.ts     Public API del módulo
```

Capas:
- **Action** valida entrada → llama service → maneja errores → retorna `ActionResult<T>`.
- **Service** orquesta repositories, dispara eventos, no conoce Next.js.
- **Repository** habla con Prisma, recibe `companyId` siempre.

## Flujo crítico: Facturación con Inventario Externo

```
1. Action: confirmInvoice(invoiceId)
   ├─ requireSession() + requirePermission("facturacion:invoice:confirm")
   ├─ Service: invoiceService.confirm()
   │   ├─ tx: validar NCF, asignar número, recalcular totales
   │   ├─ tx: cambiar invoice.status = ISSUED
   │   ├─ tx: si tiene productos físicos → crear pending job RESERVE
   │   ├─ tx: si isCredit → crear AccountReceivable
   │   └─ tx commit
   └─ publish("invoice.confirmed", { invoiceId, companyId })
       └─ runJob(jobId) async (no bloquea respuesta)
           ├─ adapter.reserve() o adapter.commit()
           ├─ exitoso: log SUCCEEDED, invoice.inventorySyncStatus = SYNCED
           └─ fallo retryable: status RETRYING, nextAttemptAt = backoff
              fallo no-retryable: status DEAD_LETTER, alerta al usuario
```

Si el sistema externo está caído:
- La factura **se confirma igual** (no bloqueamos venta).
- Job queda en cola.
- Dashboard muestra alerta "N facturas pendientes de sincronización".
- Worker (pg_cron + edge function) corre cada minuto procesando cola.
- Si supera `maxAttempts`, va a DEAD_LETTER y requiere acción manual.

## Flujo crítico: Cotización → Factura

```
quoteService.convertToInvoice(quoteId)
  ├─ tx: invoice = create from quote items
  ├─ tx: quote.status = CONVERTED, quote.convertedInvoiceId = invoice.id
  └─ tx commit
```

Unique constraint en `quote.convertedInvoiceId` previene doble conversión.

## Reglas de DB

- Soft-delete: campo `deletedAt DateTime?`. Todos los `findMany` filtran `deletedAt: null` por defecto.
- Timestamps automáticos: `createdAt @default(now())` + `updatedAt @updatedAt`.
- IDs: `cuid()` (ordenable temporalmente, 25 chars).
- Money: `Decimal(18, 4)` para precios; `Decimal(18, 2)` para totales y balances.
- Foreign keys con `onDelete: Restrict` para documentos fiscales (facturas, cotizaciones). `Cascade` para hijos puros (items).
- Índices en todos los `companyId`, `status`, fechas operativas.

## Seguridad

- Auth en middleware (`middleware.ts`) — protege todas las rutas `/dashboard`, `/crm`, etc.
- Permisos en cada server action (no en componente).
- Sanitización: Zod en boundaries (action + API route).
- Secrets API externos: cifrar `authToken` at rest (TODO Fase 3 — clave master en env).
- Logs nunca incluyen `passwordHash` ni `authToken`.
- Audit log captura `before/after` de operaciones críticas.

## UI/UX

Design system fijo (memoria del proyecto):
- Sidebar colapsable con framer-motion ✓
- Cards `rounded-2xl` ✓
- Charts animados (Recharts) — Fase 1
- Skeleton loaders en todas las tablas
- Sonner para toasts
- Tema dark/light + system

Layout:
- `/(auth)` — fondo con gradientes blur, card centrada
- `/(platform)` — sidebar izq (260px / 72px colapsado) + topbar 64h con search global

## Performance

- RSC por defecto, `"use client"` solo cuando hace falta interactividad.
- React Query para client cache en lecturas pesadas.
- Prisma queries con `select` explícito en hot paths (no traer todo el row).
- Indices en `(companyId, status)` y `(companyId, createdAt DESC)` para listados.

## Lo que NO existe en este sistema

- ❌ Kardex interno
- ❌ Stock levels
- ❌ Movimientos de inventario internos
- ❌ Almacenes con lógica de stock
- ❌ Costeo FIFO/LIFO
- ❌ Lotes/seriales como entidad principal
- ❌ Ajustes de inventario internos
- ❌ Transferencias entre almacenes

Esos viven en el **software externo de inventario** del usuario. Nosotros consultamos, reservamos, descontamos y liberamos vía API.
