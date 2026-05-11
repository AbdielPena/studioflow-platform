"use client";

import { useRouter } from "next/navigation";
import { Package, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/packages/lib/decimal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Product, ProductCategory } from "@prisma/client";

type Row = Product & { category: ProductCategory | null };

export function ProductsTable({ products }: { products: Row[] }) {
  const router = useRouter();

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Producto",
      searchAccessor: (p) => `${p.name} ${p.sku} ${p.barcode ?? ""}`,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            {p.type === "PRODUCT" ? (
              <Package className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Wrench className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{p.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      cell: (p) =>
        p.category ? (
          <Badge variant="secondary">{p.category.name}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "price",
      header: "Precio",
      align: "right",
      cell: (p) => <span className="font-medium">{formatCurrency(p.price.toString())}</span>,
    },
    {
      key: "sync",
      header: "Inv. externo",
      cell: (p) => <StatusBadge status={p.syncStatus} />,
    },
    {
      key: "isActive",
      header: "Estado",
      cell: (p) => <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
  ];

  return (
    <DataTable
      data={products}
      columns={columns}
      rowKey={(p) => p.id}
      searchPlaceholder="Buscar por nombre, SKU, código de barras..."
      emptyMessage="No hay productos. Crea el primero."
      onRowClick={(p) => router.push(`/facturacion/products/${p.id}`)}
    />
  );
}
