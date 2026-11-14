/* ── Component: StaffDirectory ───────────────────────────────────────── */
"use client";
import Link from "next/link";
import {adminFetch} from "@/lib/adminFetch";

import {useLiveEffect} from "@/hooks/useLiveEffect";





import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import type { AuthUser, Permission, StaffRole } from "@/types/auth";

import OwnerPasswordTools from "./OwnerPasswordTools";
import ShiftManager from "./ShiftManager";
import StaffAccountForm from "./StaffAccountForm";
import StaffRoleManager from "./StaffRoleManager";
export default function StaffDirectory() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]), [roles, setRoles] = useState<StaffRole[]>([]), [permissions, setPermissions] = useState<Permission[]>([]), [editing, setEditing] = useState<AuthUser>(), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const reads=useRef(0);
  const load = useCallback(async () => { const read=++reads.current;try {
    const [u, r] = await Promise.all([adminFetch("/api/users", { cache: "no-store" }), adminFetch("/api/roles", { cache: "no-store" })]);
    const [accounts, roleData] = await Promise.all([u.json(), r.json()]); if (!u.ok || !r.ok) throw new Error(accounts.error || roleData.error);
    if(read!==reads.current)return;setUsers(accounts.users); setRoles(roleData.roles); setPermissions(roleData.permissions);
  } catch (e) { setNotice(e instanceof Error ? e.message : "Could not load employees"); } }, []);
  useLiveEffect(() => { void load(); }, [load]);
  async function save(path: string, body: unknown, method = "POST") {
    setBusy(true); setNotice(""); try {
      const response = await adminFetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setNotice("Saved. Staff must sign in again after their role, assignments or password changes."); await load(); return true;
    } catch (e) { setNotice(e instanceof Error ? e.message : "Could not save"); return false; } finally { setBusy(false); }
  }
  return <>
    <p className="info-note">Staff sign in with their mobile numbers. Assign tables to waiters and use the Parcel & Foodpanda role for counter orders. Change cashier custody from Cash counter. Deactivate staff to retain their history.</p>{notice && <p role="status" className="info-note">{notice}</p>}
    <section className="panel"><div className="panel-title"><h3>Staff accounts</h3><span className="count-pill">{users.length}</span></div><div className="table-scroll"><table><thead><tr><th>Employee</th><th>Mobile / email</th><th>Role</th><th>Tables</th><th>Status</th>{user.role==="owner"&&!user.roleId&&<th>Password · Owner only</th>}<th>Actions</th></tr></thead><tbody>{users.map((staff) => <tr key={staff.id}><td><Link className="text-emerald-300 hover:underline" href={`/users/${staff.id}`}>{staff.name}{staff.id === user.id ? " (you)" : ""}</Link></td><td>{staff.phone || "Add mobile number"}<small className="staff-email">{staff.email}</small></td><td>{staff.roleName || staff.role}</td><td>{staff.stations?.join(", ") || "—"}<small className="staff-email">{staff.tables === undefined ? "Legacy account: all tables" : staff.tables.join(", ") || "No tables assigned"}</small></td><td><span className={"badge " + (staff.active ? "Ready" : "Cancelled")}>{staff.active ? "Active" : "Inactive"}</span></td>{user.role==="owner"&&!user.roleId&&<td><OwnerPasswordTools id={staff.id} name={staff.name} isOwner={staff.role==="owner"} reload={load}/></td>}<td><div className="assignment-tools"><Link className="secondary" href={`/users/${staff.id}`}>Details</Link><button className="secondary" disabled={busy} onClick={() => setEditing(staff)}>Edit</button>{staff.role !== "owner" && <button className="secondary" disabled={busy} onClick={() => void save("/api/users/" + staff.id, { active: !staff.active }, "PATCH")}>{staff.active ? "Inactive" : "Active"}</button>}</div></td></tr>)}</tbody></table></div></section>
    <div className="mt-6"><section className="panel account-card"><h3>{editing ? `${editing.name} — Edit` : "New employee"}</h3><StaffAccountForm key={editing?.id || "new"} staff={editing} roles={roles} busy={busy} cancel={editing ? () => setEditing(undefined) : undefined} save={async (body) => { const ok = await save(editing ? "/api/users/" + editing.id : "/api/users", body, editing ? "PATCH" : "POST"); if (ok) setEditing(undefined); return ok; }} /></section>
    </div>
    
    <div className="mt-6"><ShiftManager/></div>
    <div style={{ marginTop: 22 }}><StaffRoleManager roles={roles} permissions={permissions} busy={busy} save={(body, id) => save(id ? "/api/roles/" + id : "/api/roles", body, id ? "PATCH" : "POST")} /></div>
  </>;
}


