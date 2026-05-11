import { AuditAction } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import * as repo from "../repositories/product.repository";
import type { ProductFormInput, ProductCategoryFormInput } from "../schemas/product.schema";

export const listProductsService = (companyId: string, filters?: { query?: string; type?: "PRODUCT" | "SERVICE"; categoryId?: string }) =>
  repo.listProducts({ companyId, ...filters });

export async function getProductService(companyId: string, id: string) {
  const p = await repo.findProduct({ companyId, id });
  if (!p) throw new AppError({ code: "NOT_FOUND", message: "Producto no encontrado" });
  return p;
}

export async function createProductService(opts: {
  companyId: string;
  userId: string;
  data: ProductFormInput;
}) {
  const product = await repo.createProduct({ companyId: opts.companyId, data: opts.data });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "products",
    entityType: "Product",
    entityId: product.id,
    after: { sku: product.sku, name: product.name, price: product.price.toString() },
  });
  return product;
}

export async function updateProductService(opts: {
  companyId: string;
  userId: string;
  id: string;
  data: ProductFormInput;
}) {
  const before = await repo.findProduct({ companyId: opts.companyId, id: opts.id });
  if (!before) throw new AppError({ code: "NOT_FOUND", message: "Producto no encontrado" });
  const after = await repo.updateProduct({
    companyId: opts.companyId,
    id: opts.id,
    data: opts.data,
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "products",
    entityType: "Product",
    entityId: opts.id,
    before: { price: before.price.toString() },
    after: { price: after.price.toString() },
  });
  return after;
}

export async function deleteProductService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  const before = await repo.findProduct({ companyId: opts.companyId, id: opts.id });
  if (!before) throw new AppError({ code: "NOT_FOUND", message: "Producto no encontrado" });
  await repo.softDeleteProduct({ companyId: opts.companyId, id: opts.id });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.DELETE,
    module: "products",
    entityType: "Product",
    entityId: opts.id,
    before: { name: before.name },
  });
}

export const listCategoriesService = (companyId: string) => repo.listCategories(companyId);

export async function createCategoryService(opts: {
  companyId: string;
  userId: string;
  data: ProductCategoryFormInput;
}) {
  const c = await repo.createCategory({ companyId: opts.companyId, data: opts.data });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "products",
    entityType: "ProductCategory",
    entityId: c.id,
    after: { name: c.name },
  });
  return c;
}
