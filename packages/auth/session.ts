import { auth } from "./index";
import { prisma } from "@/packages/db";
import { AppError } from "@/lib/errors";
import type { SessionContext } from "@/types/index";

export async function getSessionContext(): Promise<SessionContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const u = session.user as {
    id: string;
    email: string;
    systemRole?: string;
    companyId?: string | null;
    branchId?: string | null;
  };

  const permissions = u.companyId
    ? await loadPermissions(u.id, u.companyId)
    : [];

  const member = u.companyId
    ? await prisma.companyMember.findUnique({
        where: { userId_companyId: { userId: u.id, companyId: u.companyId } },
      })
    : null;

  return {
    userId: u.id,
    email: u.email,
    systemRole: u.systemRole ?? "SALES",
    companyId: u.companyId ?? null,
    branchId: u.branchId ?? null,
    permissions,
    isOwner: member?.isOwner ?? false,
  };
}

export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    throw new AppError({ code: "UNAUTHORIZED", message: "No autenticado" });
  }
  return ctx;
}

export async function requireCompany(): Promise<SessionContext & { companyId: string }> {
  const ctx = await requireSession();
  if (!ctx.companyId) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: "Selecciona una empresa para continuar",
    });
  }
  return ctx as SessionContext & { companyId: string };
}

async function loadPermissions(userId: string, companyId: string): Promise<string[]> {
  const member = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId, companyId } },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });
  if (!member) return [];
  if (member.isOwner) {
    const all = await prisma.permission.findMany({ select: { key: true } });
    return all.map((p) => p.key);
  }
  const rolePerms = member.role?.permissions.map((rp) => rp.permission.key) ?? [];
  return Array.from(new Set([...rolePerms, ...member.customPermissions]));
}
