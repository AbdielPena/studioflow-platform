import { AppError } from "@/lib/errors";
import type { SessionContext } from "@/types/index";
import type { PermissionKey } from "@/lib/permissions";

export function hasPermission(ctx: SessionContext, permission: PermissionKey): boolean {
  if (ctx.systemRole === "SUPERADMIN") return true;
  if (ctx.isOwner) return true;
  return ctx.permissions.includes(permission);
}

export function hasAnyPermission(ctx: SessionContext, permissions: PermissionKey[]): boolean {
  return permissions.some((p) => hasPermission(ctx, p));
}

export function hasAllPermissions(ctx: SessionContext, permissions: PermissionKey[]): boolean {
  return permissions.every((p) => hasPermission(ctx, p));
}

export function requirePermission(ctx: SessionContext, permission: PermissionKey): void {
  if (!hasPermission(ctx, permission)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: `Permiso requerido: ${permission}`,
      details: { permission },
    });
  }
}
