import type { DefaultSession } from "next-auth";
import type { SystemRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      systemRole: SystemRole;
      companyId: string | null;
      branchId: string | null;
    };
  }

  interface User {
    id: string;
    systemRole?: SystemRole;
    companyId?: string | null;
    branchId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    systemRole?: SystemRole;
    companyId?: string | null;
    branchId?: string | null;
  }
}
