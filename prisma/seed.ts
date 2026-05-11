/* eslint-disable no-console */
import { PrismaClient, SystemRole, NcfType, NcfStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSION_CATALOG, SYSTEM_ROLES } from "../packages/lib/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding StudioFlow Platform...\n");

  // ---- 1. Permisos
  console.log("→ Permisos");
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { module: p.module, resource: p.resource, action: p.action },
      create: p,
    });
  }
  console.log(`  ✓ ${PERMISSION_CATALOG.length} permisos`);

  // ---- 2. Roles globales (sistema)
  console.log("→ Roles del sistema");
  for (const [, role] of Object.entries(SYSTEM_ROLES)) {
    const r = await prisma.role.upsert({
      where: { companyId_key: { companyId: null as unknown as string, key: role.key } },
      update: { name: role.name, description: role.description, isSystem: true },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: true,
        companyId: null,
      },
    }).catch(async () => {
      // Fallback: Prisma upsert con companyId null no soporta el compound unique
      const existing = await prisma.role.findFirst({
        where: { companyId: null, key: role.key },
      });
      if (existing) {
        return prisma.role.update({
          where: { id: existing.id },
          data: { name: role.name, description: role.description, isSystem: true },
        });
      }
      return prisma.role.create({
        data: {
          key: role.key,
          name: role.name,
          description: role.description,
          isSystem: true,
        },
      });
    });

    const perms = await prisma.permission.findMany({
      where: { key: { in: [...role.permissions] } },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: r.id } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: r.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
  console.log(`  ✓ ${Object.keys(SYSTEM_ROLES).length} roles`);

  // ---- 3. Empresa demo
  console.log("→ Empresa demo");
  const company = await prisma.company.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      legalName: "Demo Studio SRL",
      tradeName: "Demo Studio",
      rnc: "131000000",
      email: "contacto@demo.do",
      phone: "+1-809-000-0000",
      address: "Av. Principal 123",
      city: "Santo Domingo",
      country: "DO",
      currency: "DOP",
      timezone: "America/Santo_Domingo",
    },
  });

  await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: "MAIN" } },
    update: {},
    create: {
      companyId: company.id,
      code: "MAIN",
      name: "Sucursal Principal",
      isMain: true,
    },
  });
  console.log(`  ✓ Empresa "${company.legalName}" + sucursal MAIN`);

  // ---- 4. NCF seed (B02 consumo)
  console.log("→ NCF B02 (Consumo)");
  await prisma.ncfSequence.upsert({
    where: {
      companyId_branchId_type_rangeFrom: {
        companyId: company.id,
        branchId: null as unknown as string,
        type: NcfType.B02,
        rangeFrom: 1,
      },
    },
    update: {},
    create: {
      companyId: company.id,
      type: NcfType.B02,
      prefix: "B02",
      rangeFrom: 1,
      rangeTo: 10000,
      currentValue: 0,
      status: NcfStatus.ACTIVE,
    },
  }).catch(async () => {
    const existing = await prisma.ncfSequence.findFirst({
      where: { companyId: company.id, type: NcfType.B02, rangeFrom: 1 },
    });
    if (!existing) {
      await prisma.ncfSequence.create({
        data: {
          companyId: company.id,
          type: NcfType.B02,
          prefix: "B02",
          rangeFrom: 1,
          rangeTo: 10000,
          currentValue: 0,
          status: NcfStatus.ACTIVE,
        },
      });
    }
  });
  console.log("  ✓ NCF B02: 1-10000");

  // ---- 5. Configuración fiscal (impuestos)
  console.log("→ Configuración fiscal");
  const taxes = [
    { key: "ITBIS_18", name: "ITBIS 18%", rate: 0.18, isWithholding: false },
    { key: "ITBIS_16", name: "ITBIS 16%", rate: 0.16, isWithholding: false },
    { key: "ITBIS_0", name: "ITBIS 0%", rate: 0, isWithholding: false },
    { key: "EXENTO", name: "Exento", rate: 0, isWithholding: false },
    { key: "RET_ITBIS_30", name: "Retención ITBIS 30%", rate: 0.054, isWithholding: true },
    { key: "RET_ISR_10", name: "Retención ISR 10%", rate: 0.1, isWithholding: true },
  ];
  for (const t of taxes) {
    await prisma.taxConfig.upsert({
      where: { companyId_key: { companyId: company.id, key: t.key } },
      update: t,
      create: { ...t, companyId: company.id },
    });
  }
  console.log(`  ✓ ${taxes.length} impuestos`);

  // ---- 6. Super admin
  console.log("→ Super admin");
  const adminPassword = "Admin123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@studioflow.app" },
    update: { passwordHash, isActive: true },
    create: {
      email: "admin@studioflow.app",
      name: "Super Admin",
      passwordHash,
      systemRole: SystemRole.SUPERADMIN,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const ownerRole = await prisma.role.findFirst({
    where: { companyId: null, key: "OWNER" },
  });
  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: admin.id, companyId: company.id } },
    update: { isOwner: true, isActive: true },
    create: {
      userId: admin.id,
      companyId: company.id,
      roleId: ownerRole?.id,
      isOwner: true,
      isActive: true,
    },
  });
  console.log(`  ✓ admin@studioflow.app / ${adminPassword}`);

  console.log("\n✅ Seed completo.");
  console.log("\n┌─────────────────────────────────────────────┐");
  console.log("│  Login:    admin@studioflow.app             │");
  console.log("│  Password: Admin123!                        │");
  console.log("└─────────────────────────────────────────────┘\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
