import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Package,
  ScrollText,
  Server,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  Users,
  UserRound,
  Warehouse,
  Layers,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** Item is shown when the user holds this permission (or any of the listed ones). */
  requiredPermission?: string;
  requiredAnyPermissions?: string[];
  /** Sub-links shown in a collapsible section. */
  children?: Array<{ label: string; href: string; requiredPermission?: string }>;
  /** Extra keywords for the command palette. */
  keywords?: string[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const tenantNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiredPermission: "dashboard:read", keywords: ["home", "kpi"] },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        requiredPermission: "analytics:read",
        children: [
          { label: "Overview", href: "/analytics" },
          { label: "Sales", href: "/analytics/sales" },
          { label: "Revenue", href: "/analytics/revenue" },
        ],
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        label: "Orders",
        href: "/orders",
        icon: ShoppingCart,
        requiredPermission: "order:read",
        children: [
          { label: "All orders", href: "/orders" },
          { label: "Create order", href: "/orders/new", requiredPermission: "order:create" },
        ],
      },
      { label: "Customers", href: "/customers", icon: UserRound, requiredPermission: "customer:read", keywords: ["buyers", "clients"] },
      { label: "Payments", href: "/payments", icon: CreditCard, requiredPermission: "payment:read", keywords: ["refunds", "transactions"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package, requiredPermission: "product:read", keywords: ["variants", "sku"] },
      { label: "Categories", href: "/categories", icon: FolderTree, requiredPermission: "category:read" },
      { label: "Attributes", href: "/attributes", icon: Tags, requiredPermission: "attribute:read" },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Stock",
        href: "/inventory",
        icon: Boxes,
        requiredPermission: "inventory:read",
        children: [
          { label: "Stock levels", href: "/inventory" },
          { label: "Movements", href: "/inventory/movements" },
          { label: "Low stock", href: "/inventory/low-stock" },
        ],
      },
      { label: "Warehouses", href: "/warehouses", icon: Warehouse, requiredPermission: "warehouse:read" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Team", href: "/admin/users", icon: Users, requiredPermission: "user:read", keywords: ["users", "members"] },
      { label: "Roles", href: "/admin/roles", icon: ShieldCheck, requiredPermission: "role:read", keywords: ["permissions", "rbac"] },
      {
        label: "Logs",
        href: "/admin/audit",
        icon: ScrollText,
        requiredAnyPermissions: ["audit:read", "activity:read"],
        children: [
          { label: "Audit log", href: "/admin/audit", requiredPermission: "audit:read" },
          { label: "Activity", href: "/admin/activity", requiredPermission: "activity:read" },
        ],
      },
      { label: "Notifications", href: "/notifications", icon: Bell, requiredPermission: "notification:read" },
      { label: "Settings", href: "/settings", icon: Settings, keywords: ["profile", "password", "sessions", "account"] },
    ],
  },
];

export const platformNavGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { label: "Overview", href: "/platform", icon: LayoutDashboard },
      { label: "Tenants", href: "/platform/tenants", icon: Building2, keywords: ["workspaces", "customers"] },
      { label: "Plans", href: "/platform/subscriptions", icon: Layers, keywords: ["subscriptions", "limits", "pricing"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Platform admins", href: "/platform/users", icon: Users, keywords: ["staff", "roles"] },
      { label: "Audit log", href: "/platform/audit", icon: Activity, keywords: ["history", "support sessions"] },
      { label: "System health", href: "/platform/system", icon: Server, keywords: ["status", "database", "redis", "queues"] },
    ],
  },
];

export const settingsNav = [
  { label: "Profile", href: "/settings", icon: UserRound },
  { label: "Notifications", href: "/settings/notifications", icon: SlidersHorizontal },
] as const;

export const storefrontNav = [
  { label: "Store", href: "/store" },
  { label: "Products", href: "/store/products" },
  { label: "Categories", href: "/store/categories" },
] as const;

export const storefrontAccountNav = [
  { label: "Account", href: "/account" },
  { label: "Orders", href: "/account/orders" },
] as const;
