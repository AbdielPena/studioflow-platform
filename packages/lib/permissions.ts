// ============================================================================
// RBAC — Catálogo de permisos por módulo.
// Formato: <module>:<resource>:<action>
// ============================================================================

export const PERMISSIONS = {
  // Platform / Admin
  PLATFORM_COMPANY_MANAGE: "platform:company:manage",
  PLATFORM_USER_MANAGE: "platform:user:manage",
  PLATFORM_ROLE_MANAGE: "platform:role:manage",
  PLATFORM_AUDIT_VIEW: "platform:audit:view",
  PLATFORM_SETTINGS_MANAGE: "platform:settings:manage",

  // Facturación
  FACTURACION_INVOICE_CREATE: "facturacion:invoice:create",
  FACTURACION_INVOICE_READ: "facturacion:invoice:read",
  FACTURACION_INVOICE_UPDATE: "facturacion:invoice:update",
  FACTURACION_INVOICE_VOID: "facturacion:invoice:void",
  FACTURACION_INVOICE_DELETE: "facturacion:invoice:delete",
  FACTURACION_QUOTE_CREATE: "facturacion:quote:create",
  FACTURACION_QUOTE_READ: "facturacion:quote:read",
  FACTURACION_QUOTE_UPDATE: "facturacion:quote:update",
  FACTURACION_QUOTE_DELETE: "facturacion:quote:delete",
  FACTURACION_QUOTE_CONVERT: "facturacion:quote:convert",
  FACTURACION_PRODUCT_MANAGE: "facturacion:product:manage",
  FACTURACION_CUSTOMER_MANAGE: "facturacion:customer:manage",
  FACTURACION_NCF_MANAGE: "facturacion:ncf:manage",
  FACTURACION_POS_USE: "facturacion:pos:use",
  FACTURACION_DELIVERY_MANAGE: "facturacion:delivery:manage",

  // Compras / Suplidores
  PURCHASE_CREATE: "facturacion:purchase:create",
  PURCHASE_READ: "facturacion:purchase:read",
  PURCHASE_UPDATE: "facturacion:purchase:update",
  SUPPLIER_MANAGE: "facturacion:supplier:manage",

  // Finanzas
  FINANZAS_RECEIVABLE_MANAGE: "finanzas:receivable:manage",
  FINANZAS_PAYABLE_MANAGE: "finanzas:payable:manage",
  FINANZAS_CASH_OPEN: "finanzas:cash:open",
  FINANZAS_CASH_CLOSE: "finanzas:cash:close",
  FINANZAS_CASH_RECONCILE: "finanzas:cash:reconcile",
  FINANZAS_BANK_MANAGE: "finanzas:bank:manage",
  FINANZAS_REPORT_VIEW: "finanzas:report:view",

  // Inventario externo
  INVENTORY_LINK_CONFIGURE: "inventario-link:connection:configure",
  INVENTORY_LINK_SYNC: "inventario-link:sync:execute",
  INVENTORY_LINK_LOGS_VIEW: "inventario-link:logs:view",
  INVENTORY_LINK_MAPPING_MANAGE: "inventario-link:mapping:manage",

  // CRM
  CRM_LEAD_MANAGE: "crm:lead:manage",
  CRM_PROJECT_MANAGE: "crm:project:manage",
  CRM_CONTACT_MANAGE: "crm:contact:manage",

  // Gallery
  GALLERY_CREATE: "gallery:gallery:create",
  GALLERY_PUBLISH: "gallery:gallery:publish",
  GALLERY_DELETE: "gallery:gallery:delete",

  // Reportes
  REPORT_SALES_VIEW: "reports:sales:view",
  REPORT_TAX_VIEW: "reports:tax:view",
  REPORT_INVENTORY_SYNC_VIEW: "reports:inventory-sync:view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================================================
// Catálogo plano para seed
// ============================================================================

export const PERMISSION_CATALOG = Object.values(PERMISSIONS).map((key) => {
  const [module, resource, action] = key.split(":");
  return { key, module, resource, action };
});

// ============================================================================
// Roles del sistema con permisos por defecto
// ============================================================================

export const SYSTEM_ROLES = {
  SUPERADMIN: {
    key: "SUPERADMIN",
    name: "Super Administrador",
    description: "Acceso total a la plataforma",
    permissions: Object.values(PERMISSIONS),
  },
  OWNER: {
    key: "OWNER",
    name: "Dueño",
    description: "Acceso total a su empresa",
    permissions: Object.values(PERMISSIONS).filter(
      (p) => !p.startsWith("platform:company"),
    ),
  },
  ADMIN: {
    key: "ADMIN",
    name: "Administrador",
    description: "Administración operativa de la empresa",
    permissions: [
      PERMISSIONS.PLATFORM_USER_MANAGE,
      PERMISSIONS.PLATFORM_SETTINGS_MANAGE,
      PERMISSIONS.PLATFORM_AUDIT_VIEW,
      PERMISSIONS.FACTURACION_INVOICE_CREATE,
      PERMISSIONS.FACTURACION_INVOICE_READ,
      PERMISSIONS.FACTURACION_INVOICE_UPDATE,
      PERMISSIONS.FACTURACION_INVOICE_VOID,
      PERMISSIONS.FACTURACION_QUOTE_CREATE,
      PERMISSIONS.FACTURACION_QUOTE_READ,
      PERMISSIONS.FACTURACION_QUOTE_UPDATE,
      PERMISSIONS.FACTURACION_QUOTE_CONVERT,
      PERMISSIONS.FACTURACION_PRODUCT_MANAGE,
      PERMISSIONS.FACTURACION_CUSTOMER_MANAGE,
      PERMISSIONS.FACTURACION_NCF_MANAGE,
      PERMISSIONS.FACTURACION_POS_USE,
      PERMISSIONS.FACTURACION_DELIVERY_MANAGE,
      PERMISSIONS.PURCHASE_CREATE,
      PERMISSIONS.PURCHASE_READ,
      PERMISSIONS.PURCHASE_UPDATE,
      PERMISSIONS.SUPPLIER_MANAGE,
      PERMISSIONS.FINANZAS_RECEIVABLE_MANAGE,
      PERMISSIONS.FINANZAS_PAYABLE_MANAGE,
      PERMISSIONS.FINANZAS_CASH_OPEN,
      PERMISSIONS.FINANZAS_CASH_CLOSE,
      PERMISSIONS.FINANZAS_CASH_RECONCILE,
      PERMISSIONS.FINANZAS_BANK_MANAGE,
      PERMISSIONS.FINANZAS_REPORT_VIEW,
      PERMISSIONS.INVENTORY_LINK_CONFIGURE,
      PERMISSIONS.INVENTORY_LINK_SYNC,
      PERMISSIONS.INVENTORY_LINK_LOGS_VIEW,
      PERMISSIONS.INVENTORY_LINK_MAPPING_MANAGE,
      PERMISSIONS.CRM_LEAD_MANAGE,
      PERMISSIONS.CRM_PROJECT_MANAGE,
      PERMISSIONS.CRM_CONTACT_MANAGE,
      PERMISSIONS.REPORT_SALES_VIEW,
      PERMISSIONS.REPORT_TAX_VIEW,
      PERMISSIONS.REPORT_INVENTORY_SYNC_VIEW,
    ],
  },
  MANAGER: {
    key: "MANAGER",
    name: "Gerente",
    description: "Gestión operativa sin admin de usuarios",
    permissions: [
      PERMISSIONS.FACTURACION_INVOICE_CREATE,
      PERMISSIONS.FACTURACION_INVOICE_READ,
      PERMISSIONS.FACTURACION_INVOICE_UPDATE,
      PERMISSIONS.FACTURACION_QUOTE_CREATE,
      PERMISSIONS.FACTURACION_QUOTE_READ,
      PERMISSIONS.FACTURACION_QUOTE_UPDATE,
      PERMISSIONS.FACTURACION_QUOTE_CONVERT,
      PERMISSIONS.FACTURACION_PRODUCT_MANAGE,
      PERMISSIONS.FACTURACION_CUSTOMER_MANAGE,
      PERMISSIONS.FACTURACION_POS_USE,
      PERMISSIONS.FACTURACION_DELIVERY_MANAGE,
      PERMISSIONS.PURCHASE_READ,
      PERMISSIONS.FINANZAS_RECEIVABLE_MANAGE,
      PERMISSIONS.FINANZAS_CASH_OPEN,
      PERMISSIONS.FINANZAS_CASH_CLOSE,
      PERMISSIONS.REPORT_SALES_VIEW,
    ],
  },
  SALES: {
    key: "SALES",
    name: "Vendedor",
    description: "Crear cotizaciones y facturas",
    permissions: [
      PERMISSIONS.FACTURACION_INVOICE_CREATE,
      PERMISSIONS.FACTURACION_INVOICE_READ,
      PERMISSIONS.FACTURACION_QUOTE_CREATE,
      PERMISSIONS.FACTURACION_QUOTE_READ,
      PERMISSIONS.FACTURACION_QUOTE_UPDATE,
      PERMISSIONS.FACTURACION_QUOTE_CONVERT,
      PERMISSIONS.FACTURACION_CUSTOMER_MANAGE,
      PERMISSIONS.FACTURACION_POS_USE,
    ],
  },
  CASHIER: {
    key: "CASHIER",
    name: "Cajero",
    description: "POS y cierre de caja",
    permissions: [
      PERMISSIONS.FACTURACION_POS_USE,
      PERMISSIONS.FACTURACION_INVOICE_CREATE,
      PERMISSIONS.FACTURACION_INVOICE_READ,
      PERMISSIONS.FINANZAS_CASH_OPEN,
      PERMISSIONS.FINANZAS_CASH_CLOSE,
    ],
  },
  ACCOUNTANT: {
    key: "ACCOUNTANT",
    name: "Contador",
    description: "Acceso financiero y fiscal",
    permissions: [
      PERMISSIONS.FACTURACION_INVOICE_READ,
      PERMISSIONS.FACTURACION_NCF_MANAGE,
      PERMISSIONS.PURCHASE_READ,
      PERMISSIONS.FINANZAS_RECEIVABLE_MANAGE,
      PERMISSIONS.FINANZAS_PAYABLE_MANAGE,
      PERMISSIONS.FINANZAS_BANK_MANAGE,
      PERMISSIONS.FINANZAS_REPORT_VIEW,
      PERMISSIONS.FINANZAS_CASH_RECONCILE,
      PERMISSIONS.REPORT_SALES_VIEW,
      PERMISSIONS.REPORT_TAX_VIEW,
    ],
  },
  AUDITOR: {
    key: "AUDITOR",
    name: "Auditor",
    description: "Solo lectura + auditoría",
    permissions: [
      PERMISSIONS.PLATFORM_AUDIT_VIEW,
      PERMISSIONS.FACTURACION_INVOICE_READ,
      PERMISSIONS.FACTURACION_QUOTE_READ,
      PERMISSIONS.PURCHASE_READ,
      PERMISSIONS.FINANZAS_REPORT_VIEW,
      PERMISSIONS.REPORT_SALES_VIEW,
      PERMISSIONS.REPORT_TAX_VIEW,
      PERMISSIONS.REPORT_INVENTORY_SYNC_VIEW,
      PERMISSIONS.INVENTORY_LINK_LOGS_VIEW,
    ],
  },
  SUPPORT: {
    key: "SUPPORT",
    name: "Soporte Técnico",
    description: "Solo lectura técnica + logs",
    permissions: [
      PERMISSIONS.PLATFORM_AUDIT_VIEW,
      PERMISSIONS.INVENTORY_LINK_LOGS_VIEW,
      PERMISSIONS.INVENTORY_LINK_SYNC,
    ],
  },
  PHOTOGRAPHER: {
    key: "PHOTOGRAPHER",
    name: "Fotógrafo",
    description: "CRM + Gallery (StudioFlow)",
    permissions: [
      PERMISSIONS.CRM_LEAD_MANAGE,
      PERMISSIONS.CRM_PROJECT_MANAGE,
      PERMISSIONS.CRM_CONTACT_MANAGE,
      PERMISSIONS.GALLERY_CREATE,
      PERMISSIONS.GALLERY_PUBLISH,
      PERMISSIONS.GALLERY_DELETE,
      PERMISSIONS.FACTURACION_QUOTE_CREATE,
      PERMISSIONS.FACTURACION_INVOICE_CREATE,
      PERMISSIONS.FACTURACION_CUSTOMER_MANAGE,
    ],
  },
} as const;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES;
