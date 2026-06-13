"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { cn } from "@/packages/lib/utils";
import { NAV_GROUPS } from "./nav-config";
import { AppSwitcher } from "@/components/app-switcher";
import { useSidebarMobile } from "./sidebar-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  permissions: string[];
  isOwner: boolean;
  systemRole: string;
};

export function Sidebar({ permissions, isOwner, systemRole }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { open: mobileOpen, setOpen: setMobileOpen } = useSidebarMobile();

  // Cerrar el drawer al navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const filteredGroups = useMemo(() => {
    if (systemRole === "SUPERADMIN" || isOwner) return NAV_GROUPS;
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (it) => !it.permission || permissions.includes(it.permission),
      ),
    })).filter((g) => g.items.length > 0);
  }, [permissions, isOwner, systemRole]);

  return (
    <TooltipProvider delayDuration={150}>
      {/* Overlay — solo móvil cuando el drawer está abierto. */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "z-50 flex h-screen shrink-0 flex-col border-r bg-card/50 backdrop-blur",
          // Ancho por CSS (no framer, que pisaría el transform del drawer).
          "w-[260px]",
          collapsed ? "lg:w-[72px]" : "lg:w-[260px]",
          // Móvil: drawer off-canvas. Desktop: parte del flujo.
          // NO transicionar `transform` (Tailwind translate usa var(--tw-translate-x)
          // y Chromium no interpola transforms basados en variable → panel pegado).
          "fixed inset-y-0 left-0 transition-[width] duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:sticky lg:top-0 lg:translate-x-0",
        )}
      >
        {/* AppSwitcher: header compartido del Studio Suite. */}
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b",
            collapsed ? "justify-center px-2" : "px-3",
          )}
        >
          <div className="min-w-0 flex-1">
            <AppSwitcher currentSystem="billing" collapsed={collapsed} />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto scrollbar-thin p-3">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.p
                    key={`label-${group.label}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const link = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {isActive && (
                        <motion.span
                          layoutId="active-pill"
                          className="absolute inset-y-1 left-0 w-1 rounded-full bg-primary"
                        />
                      )}
                    </Link>
                  );
                  return (
                    <li key={item.href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden border-t p-3 lg:block">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                Colapsar
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
