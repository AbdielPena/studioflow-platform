"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/packages/lib/utils";
import { NAV_GROUPS } from "./nav-config";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  permissions: string[];
  isOwner: boolean;
  systemRole: string;
};

export function Sidebar({ permissions, isOwner, systemRole }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="sticky top-0 z-30 hidden h-screen shrink-0 border-r bg-card/50 backdrop-blur lg:flex lg:flex-col"
      >
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <span className="text-xs font-bold">SF</span>
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="truncate text-sm font-semibold">StudioFlow</span>
                <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                  Platform
                </span>
              </motion.div>
            )}
          </AnimatePresence>
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

        <div className="border-t p-3">
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
      </motion.aside>
    </TooltipProvider>
  );
}
