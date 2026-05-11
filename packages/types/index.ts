// ============================================================================
// Shared types across modules
// ============================================================================

export type ModuleKey =
  | "platform"
  | "crm"
  | "gallery"
  | "finanzas"
  | "facturacion"
  | "inventario-link"
  | "reports";

export type SessionContext = {
  userId: string;
  email: string;
  systemRole: string;
  companyId: string | null;
  branchId: string | null;
  permissions: string[];
  isOwner: boolean;
};

export type Pagination = {
  page: number;
  pageSize: number;
};

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

export type SortDirection = "asc" | "desc";
