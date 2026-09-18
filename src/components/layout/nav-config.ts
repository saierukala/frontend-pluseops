export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  backendDependency?: boolean;
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
    items: [{ label: "Dashboard", href: "/dashboard", icon: "dashboard" }],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: "products" },
      { label: "Categories", href: "/categories", icon: "categories" },
      { label: "Attributes", href: "/attributes", icon: "attributes" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Stock", href: "/inventory", icon: "inventory" },
      { label: "Warehouses", href: "/warehouses", icon: "warehouses" },
      { label: "Movements", href: "/inventory/movements", icon: "movements" },
      { label: "Low Stock", href: "/inventory/low-stock", icon: "lowstock" },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "All Orders", href: "/orders", icon: "orders" },
      { label: "Create Order", href: "/orders/new", icon: "orders-new" },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/customers", icon: "customers", badge: "Soon", backendDependency: true },
    ],
  },
  {
    label: "Payments",
    items: [{ label: "Payments", href: "/payments", icon: "payments" }],
  },
  {
    label: "Analytics",
    items: [
      { label: "Analytics", href: "/analytics", icon: "analytics" },
      { label: "Sales", href: "/analytics/sales", icon: "analytics-sales" },
      { label: "Revenue", href: "/analytics/revenue", icon: "revenue" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/admin/users", icon: "users" },
      { label: "Roles", href: "/admin/roles", icon: "roles" },
      { label: "Audit", href: "/admin/audit", icon: "audit" },
      { label: "Activity", href: "/admin/activity", icon: "activity" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Settings", href: "/settings", icon: "settings" },
      { label: "Notifications", href: "/settings/notifications", icon: "notifications" },
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
