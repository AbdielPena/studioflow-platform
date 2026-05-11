import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
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
  ],
});

export { auth as getServerSession };
