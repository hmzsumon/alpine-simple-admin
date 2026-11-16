/* ────────── imports ────────── */
import type { AuthUser, Permission } from "@/types/auth";
/* ────────── route visibility; the API independently enforces permissions ────────── */
export const routePermissions: Record<string, Permission> = {
 "/cash-counters":"cash:manage","/daily-print":"reports:read", "/cash":"cash:read","/cash-print":"reports:read","/reports":"reports:read","/payment-methods":"cash:manage",
  "/dashboard": "overview:read",
  "/orders/new": "orders:create",
  "/orders": "orders:read",
  "/bill": "payments:collect",
  "/menu": "menu:read",
  "/procurement": "procurement:read",
  "/procurement-print": "procurement:read",
  "/inventory": "inventory:read",
  "/tables": "tables:read",
  "/kitchen": "kitchen:read",
  "/expenses": "expenses:read",
  "/printers": "printers:read",
  "/users": "users:manage",
};
export function canAccessPath(user: AuthUser, path: string) {
  // Employee profiles are role restricted even if cashier permissions are delegated.
  if (/^\/users\/[^/]+$/.test(path))return user.role==="owner"||user.role==="admin";
  if (["/developer","/inventory","/procurement","/procurement-print","/kitchen","/printers","/expenses"].some(base=>path===base||path.startsWith(base+"/")))return false;
  const route = Object.keys(routePermissions).sort((a,b)=>b.length-a.length).find(
    (base) => path === base || path.startsWith(base + "/")
  );
  return !route || user.permissions.includes(routePermissions[route]);
}
export function landingPath(user: AuthUser) {
  if(user.role==="cashier")return "/cash";
  if(user.permissions.includes("overview:read"))return "/dashboard";
  if (user.role === "kitchen") return "/kitchen";
  if (user.role === "waiter") return "/tables";
  return (
    Object.keys(routePermissions).sort((a,b)=>b.length-a.length).find((path) =>
      user.permissions.includes(routePermissions[path])
    ) || "/profile"
  );
}


