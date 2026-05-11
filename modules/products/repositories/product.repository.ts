import { prisma, Prisma } from "@/packages/db";
import type { ProductFormInput, ProductCategoryFormInput } from "../schemas/product.schema";

export async function listProducts(opts: {
  companyId: string;
  query?: string;
  type?: "PRODUCT" | "SERVICE";
  categoryId?: string;
}) {
  const where: Prisma.ProductWhereInput = {
    companyId: opts.companyId,
    deletedAt: null,
  };
  if (opts.type) where.type = opts.type;
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.query) {
    where.OR = [
      { name: { contains: opts.query, mode: "insensitive" } },
      { sku: { contains: opts.query, mode: "insensitive" } },
      { barcode: { contains: opts.query } },
    ];
  }
  return prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
    take: 500,
  });
}

export async function findProduct(opts: { companyId: string; id: string }) {
  return prisma.product.findFirst({
    where: { id: opts.id, companyId: opts.companyId, deletedAt: null },
    include: { category: true, externalMapping: true },
  });
}

export async function createProduct(opts: {
  companyId: string;
  data: ProductFormInput;
}) {
  const d = opts.data;
  return prisma.product.create({
    data: {
      companyId: opts.companyId,
      type: d.type,
      sku: d.sku,
      barcode: d.barcode || null,
      name: d.name,
      description: d.description || null,
      unit: d.unit,
      price: new Prisma.Decimal(d.price),
      costReference: d.costReference ? new Prisma.Decimal(d.costReference) : null,
      taxConfigKey: d.taxConfigKey,
      categoryId: d.categoryId || null,
      imageUrl: d.imageUrl || null,
      externalId: d.externalId || null,
      syncStatus: d.externalId ? "LINKED" : "UNLINKED",
      isActive: d.isActive,
    },
  });
}

export async function updateProduct(opts: {
  companyId: string;
  id: string;
  data: ProductFormInput;
}) {
  const d = opts.data;
  const existing = await prisma.product.findUnique({
    where: { id: opts.id },
    select: { price: true },
  });

  return prisma.$transaction(async (tx) => {
    if (existing && Number(existing.price) !== Number(d.price)) {
      await tx.productPriceHistory.create({
        data: {
          productId: opts.id,
          oldPrice: existing.price,
          newPrice: new Prisma.Decimal(d.price),
        },
      });
    }
    return tx.product.update({
      where: { id: opts.id },
      data: {
        type: d.type,
        sku: d.sku,
        barcode: d.barcode || null,
        name: d.name,
        description: d.description || null,
        unit: d.unit,
        price: new Prisma.Decimal(d.price),
        costReference: d.costReference ? new Prisma.Decimal(d.costReference) : null,
        taxConfigKey: d.taxConfigKey,
        categoryId: d.categoryId || null,
        imageUrl: d.imageUrl || null,
        externalId: d.externalId || null,
        syncStatus: d.externalId ? "LINKED" : "UNLINKED",
        isActive: d.isActive,
      },
    });
  });
}

export async function softDeleteProduct(opts: { companyId: string; id: string }) {
  return prisma.product.update({
    where: { id: opts.id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

// Categorías
export async function listCategories(companyId: string) {
  return prisma.productCategory.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(opts: {
  companyId: string;
  data: ProductCategoryFormInput;
}) {
  return prisma.productCategory.create({
    data: {
      companyId: opts.companyId,
      name: opts.data.name,
      parentId: opts.data.parentId || null,
    },
  });
}
