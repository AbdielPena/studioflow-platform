import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { prisma } from "@/packages/db";
import { loginSchema } from "./schemas";
import authConfig from "./auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            companyMembers: {
              where: { isActive: true, deletedAt: null },
              take: 1,
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (!user || !user.passwordHash || !user.isActive || user.deletedAt) {
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const primaryMembership = user.companyMembers[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          systemRole: user.systemRole,
          companyId: primaryMembership?.companyId ?? null,
          branchId: primaryMembership?.branchId ?? null,
        };
      },
    }),

    // Studio Business Hub — provider de SSO via JWT firmado por el hub.
    // El usuario NO se autentica con password aquí; el hub ES la fuente de verdad.
    Credentials({
      id: "hub-sso",
      name: "Studio Hub SSO",
      credentials: { token: { label: "Hub token", type: "text" } },
      async authorize(credentials) {
        const token = credentials?.token;
        if (typeof token !== "string" || !token) return null;

        const secret = process.env.HUB_JWT_SECRET;
        if (!secret) {
          console.error("[auth:hub-sso] HUB_JWT_SECRET no configurado");
          return null;
        }

        let email: string;
        let name: string | undefined;
        try {
          const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
            issuer: process.env.HUB_JWT_ISSUER ?? "studio-hub",
            audience: "studioflow_platform",
          });
          email = String(payload.email ?? "").toLowerCase();
          name = typeof payload.name === "string" ? payload.name : undefined;
          if (!email) return null;
        } catch (err) {
          console.error("[auth:hub-sso] jwtVerify falló", err);
          return null;
        }

        // Upsert User en Prisma. NO setea passwordHash (el user no podrá login local
        // hasta que se setee uno; solo via hub).
        const user = await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name: name ?? email.split("@")[0],
            isActive: true,
          },
          update: {
            lastLoginAt: new Date(),
            ...(name ? { name } : {}),
          },
          include: {
            companyMembers: {
              where: { isActive: true, deletedAt: null },
              take: 1,
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (!user.isActive || user.deletedAt) return null;

        const primaryMembership = user.companyMembers[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          systemRole: user.systemRole,
          companyId: primaryMembership?.companyId ?? null,
          branchId: primaryMembership?.branchId ?? null,
        };
      },
    }),
  ],
});

export { auth as getServerSession };
