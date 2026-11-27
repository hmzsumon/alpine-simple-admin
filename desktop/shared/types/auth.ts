/* ────────── imports ────────── */
import type { Role, Permission } from "../constants/permissions";
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  counterId?:string;
  phone?: string;
  roleId?: string;
  roleName?: string;
  mobileMode?: "waiter" | "operator" | "supervisor" | "none";
  stations?: string[];
  tables?: string[];
  role: Role;
  passwordMinimum?: 6 | 12;
  canDeleteOrders?: boolean;
  active: boolean;
  permissions: readonly Permission[];
}
export interface AuthContext {
  user: AuthUser;
  tokenHash: string;
}
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
