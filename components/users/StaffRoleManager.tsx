/* ── Component: StaffRoleManager ─────────────────────────────────────── */
"use client";
import SearchableSelect from "@/components/ui/SearchableSelect";

import { useState } from "react";
import type { Permission, StaffRole } from "@/types/auth";
const labels:Record<string,string>={"workspace:read": "Admin access", "overview:read": "View overview", "menu:read": "View menu", "menu:manage": "Manage menu", "orders:read": "View orders", "orders:create": "Take orders", "orders:update": "Manage orders", "orders:cancel": "Cancel unpaid orders", "payments:collect": "Collect bill payments", "tables:read": "View tables", "tables:manage": "Manage tables", "cash:read": "View cash counter", "cash:operate": "Operate assigned cash drawer", "cash:manage": "Manage payment methods", "reports:read": "View sales and closing reports", "orders:parcel": "Parcel and Foodpanda orders"};
export default function StaffRoleManager({ roles, permissions, busy, save }: { roles: StaffRole[]; permissions: Permission[]; busy: boolean; save: (body: unknown, id?: string) => Promise<boolean> }) {
  const [editing, setEditing] = useState<StaffRole>(); const [selected, setSelected] = useState<Permission[]>(["menu:read","tables:read","orders:read","orders:create"]);
  const [mode, setMode] = useState("waiter"), [base, setBase] = useState("waiter"), [name, setName] = useState(""), [active, setActive] = useState(true);
  const reset = () => { setEditing(undefined); setName(""); setBase("waiter"); setMode("waiter"); setSelected(["menu:read","tables:read","orders:read","orders:create"]); setActive(true); };
  return <section className="panel account-card"><h3>Roles & permissions</h3><p>Choose only the permissions needed for the role. Members must sign in again after changes.</p>
    <div className="role-chips">{roles.filter((r) => !r.builtin).map((r) => <button type="button" key={r.id} className="secondary" onClick={() => { setEditing(r); setName(r.name); setBase(r.baseRole); setMode(r.mobileMode); setSelected(r.permissions); setActive(r.active); }}>{r.name}{!r.active ? " · Inactive" : ""}</button>)}</div>
    <form onSubmit={async (e) => { e.preventDefault(); if (await save({ name, baseRole: base, mobileMode: mode, permissions: selected, active }, editing?.id)) reset(); }}>
      <label>Role name<input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Example: Parcel waiter" /></label>
      <label>Base role<SearchableSelect value={base} onChange={(e) => { const role = roles.find((r) => r.id === e.target.value)!; setBase(role.baseRole); setSelected(role.permissions.filter((p) => permissions.includes(p))); }}>{roles.filter((r) => r.builtin && r.id !== "owner").map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</SearchableSelect></label>
      <label>Android Interface<select value={mode} onChange={(e) => { const value = e.target.value; setMode(value); const needed: Permission[] = value === "waiter" ? ["menu:read", "tables:read", "orders:read", "orders:create"] : value === "operator" ? ["operations:read", "operations:prepare"] : []; setSelected((current) => [...new Set([...current, ...needed])]); }}><option value="waiter">Waiter</option><option value="none">Authorized admin pages only</option></select></label>
      <fieldset><legend>Permissions</legend><div className="permission-options">{permissions.map((p) => <label key={p}><input type="checkbox" checked={selected.includes(p)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, p] : current.filter((v) => v !== p))} />{labels[p] || p}</label>)}</div></fieldset>
      {editing && <label className="check-label"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />Role active</label>}
      <div className="assignment-tools"><button className="primary" disabled={busy}>{editing ? "Save role" : "Create role"}</button>{editing && <button type="button" className="secondary" onClick={reset}>New Create</button>}</div>
    </form>
  </section>;
}
