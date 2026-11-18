/* ────────── roles and permission contracts ────────── */
export const ROLES = [
  "owner",
  "admin",
  "manager",
  "cashier",
  "kitchen",
  "waiter",
] as const;
export type Role = (typeof ROLES)[number];
export const PERMISSIONS = [
  "cash:read", "cash:operate", "cash:manage", "reports:read", "orders:parcel",
  "workspace:read",
  "workspace:replace",
  "overview:read",
  "menu:read",
  "menu:manage",
  "procurement:read", "procurement:manage", "procurement:pay", "procurement:operate", "procurement:close",
  "inventory:read",
  "inventory:operate",
  "inventory:manage",
  "inventory:close",
  "orders:read",
  "orders:create",
  "orders:update",
  "orders:cancel",
  "orders:delete",
  "payments:collect",
  "tables:read",
  "tables:manage",
  "kitchen:manage",
  "kitchen:read",
  "expenses:read",
  "expenses:create",
  "expenses:manage",
  "printers:read",
  "printers:manage",
  "users:manage",
  "operations:read",
  "operations:prepare",
  "operations:serve",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/* ────────── server-authoritative role permissions ────────── */
export const SIMPLE_PERMISSIONS: readonly Permission[] = ["workspace:read","overview:read","menu:read","menu:manage","orders:read","orders:create","orders:update","orders:cancel","orders:delete","payments:collect","tables:read","tables:manage","users:manage","cash:read","cash:operate","cash:manage","reports:read","orders:parcel"];
export const ROLE_PERMISSIONS:Record<Role,readonly Permission[]>={
 owner:SIMPLE_PERMISSIONS,admin:SIMPLE_PERMISSIONS.filter(p=>p!=="users:manage"),manager:SIMPLE_PERMISSIONS.filter(p=>!["users:manage","cash:manage","orders:delete"].includes(p)),
 cashier:["workspace:read","overview:read","orders:read","orders:create","orders:update","orders:cancel","payments:collect","tables:read","menu:read","cash:read","cash:operate","reports:read","orders:parcel"],
 waiter:["workspace:read","orders:read","orders:create","menu:read","tables:read"],kitchen:[]
};
export const hasPermission = (role: Role, permission: Permission) =>
  ROLE_PERMISSIONS[role].includes(permission);
