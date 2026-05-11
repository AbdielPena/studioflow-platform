"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { formatCurrency, D } from "@/packages/lib/decimal";
import { cn } from "@/packages/lib/utils";
import { createInvoiceAction, confirmInvoiceAction, addPaymentAction } from "../actions/invoice.actions";

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: string;
  taxConfigKey: string;
  categoryName: string | null;
};

type CartItem = {
  productId: string;
  description: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

type Customer = { id: string; legalName: string; documentNumber: string | null };

type Props = {
  products: Product[];
  customers: Customer[];
  taxes: Array<{ key: string; rate: string }>;
  activeSession: { id: string; cashRegisterName: string; openedAt: Date } | null;
};

export function PosInterface({ products, customers, taxes, activeSession }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id ?? "");
  const [payOpen, setPayOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return products.slice(0, 24);
    const q = search.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").includes(q),
      )
      .slice(0, 24);
  }, [products, search]);

  function addToCart(p: Product) {
    const tax = taxes.find((t) => t.key === p.taxConfigKey);
    const taxRate = tax ? Number(tax.rate) : 0.18;
    setCart((prev) => {
      const existing = prev.find((it) => it.productId === p.id);
      if (existing) {
        return prev.map((it) =>
          it.productId === p.id ? { ...it, quantity: it.quantity + 1 } : it,
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          description: p.name,
          sku: p.sku,
          quantity: 1,
          unitPrice: Number(p.price),
          taxRate,
        },
      ];
    });
  }

  function updateQty(idx: number, delta: number) {
    setCart((prev) =>
      prev
        .map((it, i) => (i === idx ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it))
        .filter((it) => it.quantity > 0),
    );
  }

  function removeItem(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  const totals = useMemo(() => {
    let subtotal = D(0);
    let taxTotal = D(0);
    for (const it of cart) {
      const sub = D(it.quantity).times(D(it.unitPrice));
      const tax = sub.times(D(it.taxRate));
      subtotal = subtotal.plus(sub);
      taxTotal = taxTotal.plus(tax);
    }
    return { subtotal, taxTotal, total: subtotal.plus(taxTotal) };
  }, [cart]);

  function clearCart() {
    if (cart.length === 0) return;
    if (!confirm("¿Vaciar el carrito?")) return;
    setCart([]);
  }

  if (!activeSession) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Sin caja abierta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para vender desde POS necesitas abrir una sesión de caja primero.
          </p>
          <Button onClick={() => router.push("/finanzas/cash")} className="w-full">
            Ir a Caja
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid h-[calc(100vh-9rem)] gap-4 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar por nombre, SKU, código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-10 text-base"
            />
          </div>
          <Badge variant="success" className="h-12 px-3">
            Caja: {activeSession.cashRegisterName}
          </Badge>
        </div>

        <div className="grid auto-rows-min grid-cols-2 gap-3 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="group flex flex-col items-start rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{p.sku}</p>
              <p className="mt-1 font-mono text-base font-semibold">{formatCurrency(p.price)}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Sin coincidencias
            </div>
          )}
        </div>
      </div>

      <Card className="flex flex-col overflow-hidden">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Carrito ({cart.length})
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={clearCart} disabled={cart.length === 0}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.legalName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Toca un producto para empezar
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((it, idx) => {
                const sub = D(it.quantity).times(D(it.unitPrice));
                return (
                  <div
                    key={`${it.productId}-${idx}`}
                    className="flex items-center gap-2 rounded-xl border bg-card/40 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{it.description}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{it.sku}</p>
                      <p className="mt-0.5 text-xs font-mono">{formatCurrency(it.unitPrice)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(idx, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{it.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(idx, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="w-20 text-right font-mono text-sm font-semibold">
                      {formatCurrency(sub)}
                    </span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(idx)}>
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        <div className="border-t bg-card/50 p-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ITBIS</span>
              <span className="font-mono">{formatCurrency(totals.taxTotal)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(totals.total)}</span>
            </div>
          </div>
          <Button
            className="mt-3 h-12 w-full text-base"
            disabled={cart.length === 0 || !customerId || isPending}
            onClick={() => setPayOpen(true)}
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
            Cobrar
          </Button>
        </div>
      </Card>

      <PayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        total={totals.total.toNumber()}
        onConfirm={(method, cashReceived) => {
          startTransition(async () => {
            // 1. Crear factura
            const createRes = await createInvoiceAction({
              customerId,
              ncfType: "B02",
              paymentMethod: method,
              isCredit: false,
              currency: "DOP",
              exchangeRate: 1,
              tipAmount: 0,
              items: cart.map((it, idx) => ({
                productId: it.productId,
                description: it.description,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                discount: 0,
                taxRate: it.taxRate,
                position: idx,
              })),
            });
            if (!createRes.ok) {
              toast.error(createRes.error.message);
              return;
            }

            // 2. Confirmar (asigna NCF)
            const confirmRes = await confirmInvoiceAction(createRes.data.id);
            if (!confirmRes.ok) {
              toast.error(confirmRes.error.message);
              return;
            }

            // 3. Registrar pago
            const payRes = await addPaymentAction({
              invoiceId: createRes.data.id,
              amount: totals.total.toNumber(),
              method,
              receivedAt: new Date(),
            });
            if (!payRes.ok) {
              toast.error(payRes.error.message);
              return;
            }

            const change = method === "CASH" && cashReceived ? cashReceived - totals.total.toNumber() : 0;
            toast.success(
              change > 0
                ? `Venta cerrada · Cambio: ${formatCurrency(change)}`
                : `Venta cerrada · ${confirmRes.data.ncf ?? ""}`,
            );
            setCart([]);
            setPayOpen(false);
            router.push(`/facturacion/invoices/${createRes.data.id}`);
          });
        }}
        isPending={isPending}
      />
    </div>
  );
}

function PayDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onConfirm: (method: "CASH" | "CARD" | "TRANSFER" | "CHECK" | "DIGITAL_WALLET" | "OTHER", cashReceived?: number) => void;
  isPending: boolean;
}) {
  const [method, setMethod] = useState<"CASH" | "CARD" | "TRANSFER" | "CHECK" | "DIGITAL_WALLET" | "OTHER">("CASH");
  const [received, setReceived] = useState<number>(total);
  const change = method === "CASH" ? Math.max(0, received - total) : 0;

  const quickAmounts = method === "CASH" ? [total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrar venta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border bg-primary/5 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total a cobrar</p>
            <p className="font-mono text-3xl font-bold text-primary">{formatCurrency(total)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <PayMethodButton
              icon={Banknote}
              label="Efectivo"
              active={method === "CASH"}
              onClick={() => setMethod("CASH")}
            />
            <PayMethodButton
              icon={CreditCard}
              label="Tarjeta"
              active={method === "CARD"}
              onClick={() => setMethod("CARD")}
            />
            <PayMethodButton
              icon={CreditCard}
              label="Transferencia"
              active={method === "TRANSFER"}
              onClick={() => setMethod("TRANSFER")}
            />
            <PayMethodButton
              icon={CreditCard}
              label="Wallet"
              active={method === "DIGITAL_WALLET"}
              onClick={() => setMethod("DIGITAL_WALLET")}
            />
          </div>

          {method === "CASH" && (
            <>
              <FormField label="Efectivo recibido">
                <Input
                  type="number"
                  step="0.01"
                  min={total}
                  value={received}
                  onChange={(e) => setReceived(Number(e.target.value))}
                  className="h-12 text-lg"
                  autoFocus
                />
              </FormField>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(quickAmounts)).map((amt) => (
                  <Button key={amt} size="sm" variant="outline" onClick={() => setReceived(amt)}>
                    {formatCurrency(amt)}
                  </Button>
                ))}
              </div>
              {received >= total && (
                <div className="rounded-xl border bg-success/10 p-3 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Cambio</p>
                  <p className="font-mono text-2xl font-bold text-success">{formatCurrency(change)}</p>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || (method === "CASH" && received < total)}
            onClick={() => onConfirm(method, method === "CASH" ? received : undefined)}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayMethodButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border p-4 transition-all",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-input bg-card hover:border-primary/30 hover:bg-accent/50",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
