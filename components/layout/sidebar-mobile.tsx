"use client";

import * as React from "react";
import { Menu } from "lucide-react";

/**
 * Estado compartido del drawer móvil del sidebar (Sidebar ↔ Topbar).
 * El sidebar es off-canvas en móvil; la hamburguesa vive en el Topbar.
 */
type Ctx = { open: boolean; setOpen: (v: boolean) => void; toggle: () => void };

const SidebarMobileCtx = React.createContext<Ctx | null>(null);

export function SidebarMobileProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const value = React.useMemo<Ctx>(
    () => ({ open, setOpen, toggle: () => setOpen((o) => !o) }),
    [open],
  );
  return <SidebarMobileCtx.Provider value={value}>{children}</SidebarMobileCtx.Provider>;
}

export function useSidebarMobile(): Ctx {
  const c = React.useContext(SidebarMobileCtx);
  if (!c) throw new Error("useSidebarMobile fuera de SidebarMobileProvider");
  return c;
}

/** Botón hamburguesa — solo móvil. Va en el Topbar. */
export function MobileMenuButton() {
  const { toggle } = useSidebarMobile();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Abrir menú"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
