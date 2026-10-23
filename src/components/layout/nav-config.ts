export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  backendDependency?: boolean;
  requiredPermission?: string;
  requiredAnyPermissions?: string[];
  requiredRole?: string;
  children?: NavItem[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// Icons as inline identifiers — rendered via NavIcon component
export const tenantNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: "dashboard", requiredPermission: "dashboard:read" }],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: "products", requiredPermission: "product:read" },
      { label: "Categories", href: "/categories", icon: "categories", requiredPermission: "category:read" },
      { label: "Attributes", href: "/attributes", icon: "attributes", requiredPermission: "attribute:read" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Stock", href: "/inventory", icon: "inventory", requiredPermission: "inventory:read" },
      { label: "Warehouses", href: "/warehouses", icon: "warehouses", requiredPermission: "warehouse:read" },
      { label: "Movements", href: "/inventory/movements", icon: "movements", requiredPermission: "inventory:read" },
      { label: "Low Stock", href: "/inventory/low-stock", icon: "lowstock", requiredPermission: "inventory:read" },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "All Orders", href: "/orders", icon: "orders", requiredPermission: "order:read" },
      { label: "Create Order", href: "/orders/new", icon: "orders-new", requiredPermission: "order:create" },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/customers", icon: "customers", badge: "Soon", backendDependency: true, requiredPermission: "customer:read" },
    ],
  },
  {
    label: "Payments",
    items: [{ label: "Payments", href: "/payments", icon: "payments", requiredPermission: "payment:read" }],
  },
  {
    label: "Analytics",
    items: [
      { label: "Analytics", href: "/analytics", icon: "analytics", requiredPermission: "analytics:read" },
      { label: "Sales", href: "/analytics/sales", icon: "analytics-sales", requiredPermission: "analytics:read" },
      { label: "Revenue", href: "/analytics/revenue", icon: "revenue", requiredPermission: "analytics:read" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/admin/users", icon: "users", requiredPermission: "user:read" },
      { label: "Roles", href: "/admin/roles", icon: "roles", requiredPermission: "role:read" },
      { label: "Audit", href: "/admin/audit", icon: "audit", requiredPermission: "audit:read" },
      { label: "Activity", href: "/admin/activity", icon: "activity", requiredPermission: "activity:read" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Settings", href: "/settings", icon: "settings" },
      { label: "Notifications", href: "/settings/notifications", icon: "notifications", requiredPermission: "notification:read" },
    ],
  },
];

export const platformNavGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { label: "Overview", href: "/platform", icon: "dashboard" },
      { label: "Tenants", href: "/platform/tenants", icon: "tenants" },
      { label: "Subscriptions", href: "/platform/subscriptions", icon: "subscriptions", badge: "Soon", backendDependency: true },
      { label: "Users", href: "/platform/users", icon: "users", badge: "Soon", backendDependency: true },
      { label: "Audit", href: "/platform/audit", icon: "audit", badge: "Soon", backendDependency: true },
      { label: "System", href: "/platform/system", icon: "system", badge: "Soon", backendDependency: true },
    ],
  },
];

export const storefrontNav = [
  { label: "Store", href: "/store" },
  { label: "Products", href: "/store/products" },
  { label: "Categories", href: "/store/categories" },
] as const;

export const storefrontAccountNav = [
  { label: "Account", href: "/account" },
  { label: "Orders", href: "/account/orders" },
] as const;
