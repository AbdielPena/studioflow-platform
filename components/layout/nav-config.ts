import {
  LayoutDashboard,
  Users,
  Camera,
  Wallet,
  FileText,
  Boxes,
  Settings,
  ShoppingCart,
  Receipt,
  Package,
  Truck,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Facturación",
    items: [
      { label: "Facturas", href: "/facturacion", icon: Receipt, permission: "facturacion:invoice:read" },
      { label: "Cotizaciones", href: "/facturacion/quotes", icon: FileText, permission: "facturacion:quote:read" },
      { label: "Conduces", href: "/facturacion/deliveries", icon: ClipboardList, permission: "facturacion:delivery:manage" },
      { label: "POS", href: "/facturacion/pos", icon: ShoppingCart, permission: "facturacion:pos:use" },
      { label: "Productos", href: "/facturacion/products", icon: Package, permission: "facturacion:product:manage" },
      { label: "Clientes", href: "/facturacion/customers", icon: Users, permission: "facturacion:customer:manage" },
      { label: "Suplidores", href: "/facturacion/suppliers", icon: Truck, permission: "facturacion:supplier:manage" },
    ],
  },
  {
    label: "Inventario",
    items: [
      { label: "Conexión externa", href: "/inventario-link", icon: Boxes, permission: "inventario-link:logs:view" },
    ],
  },
  {
    label: "Clientes (CRM)",
    items: [
      { label: "CRM", href: "/crm", icon: Users, permission: "crm:lead:manage" },
      { label: "Galerías", href: "/gallery", icon: Camera, permission: "gallery:gallery:create" },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { label: "Finanzas", href: "/finanzas", icon: Wallet, permission: "finanzas:report:view" },
      { label: "Reportes", href: "/finanzas/reportes", icon: FileText, permission: "reports:sales:view" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configuración", href: "/settings", icon: Settings, permission: "platform:settings:manage" },
    ],
  },
];
