/* ── Component: StaffAccountForm ─────────────────────────────────────── */
"use client";
import {adminFetch} from "@/lib/adminFetch";

import {useLiveEffect} from "@/hooks/useLiveEffect";
import SearchableSelect from "@/components/ui/SearchableSelect";
import PasswordInput from "@/components/ui/PasswordInput";

import { useState } from "react";
import type { AuthUser, StaffRole } from "@/types/auth";
import { useAdminContext } from "@/context/AdminContext";
import {useAuth} from "@/providers/AuthProvider";
import { staffPasswordMinimum } from "@/utils/staffPassword";
export default function StaffAccountForm({ staff, roles, busy, save, cancel }: { staff?: AuthUser; roles: StaffRole[]; busy: boolean; save: (body: unknown) => Promise<boolean>; cancel?: () => void }) {
  const {user}=useAuth();
  const { kitchens } = useAdminContext();
  const [selectedRole, setSelectedRole] = useState(staff?.roleId || staff?.role || "waiter");
  const [counters,setCounters]=useState<import("@/types/simpleCash").CashCounter[]>([]);useLiveEffect(()=>{adminFetch("/api/simple/counters").then(r=>r.json()).then(d=>setCounters(d.counters||[])).catch(()=>{});},[]);
  const minimum = staffPasswordMinimum(selectedRole, roles);
  const [stations, setStations] = useState(staff?.stations || []);
  return <form onSubmit={async (event) => {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    const body: Record<string, unknown> = { ...values, canDeleteOrders: values.canDeleteOrders === "on", stations: stations.filter((id) => kitchens.some((k) => k.id === id)) }; if (staff && !values.password) delete body.password;
    if (await save(body)) { if (!staff) { form.reset(); setSelectedRole("waiter"); setStations([]); } }
  }}>
    <label>Employee name (English)<input name="name" required minLength={2} maxLength={80} defaultValue={staff?.name} /></label>
    <label>Mobile number - login ID<input name="phone" type="tel" required autoComplete="off" placeholder="01712345678" defaultValue={staff?.phone} /></label>
    {!staff && <label>Email (optional)<input name="email" type="email" autoComplete="off" /></label>}
    <label>Role<SearchableSelect name="role" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>{roles.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{r.name}{r.builtin ? "" : " · Custom"}</option>)}</SearchableSelect></label>
    {(!staff||user.role==="owner"&&!user.roleId)&&<label>{staff ? "New password (leave blank to keep current)" : "Password"}<PasswordInput name="password" required={!staff} minLength={minimum} maxLength={72} autoComplete="new-password" /><small className="item-note">At least {minimum} characters; longer passwords are allowed.</small></label>}
    <label>Order routing / default cash counter<SearchableSelect name="counterId" defaultValue={staff?.counterId||"main"}>{counters.filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</SearchableSelect><small className="item-note">Orders from this waiter go to this counter. Cash custody is assigned separately when opening or handing over the drawer.</small></label>
    <p className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-200">Waiters can take orders at every table on every floor. No table assignment is required.</p>
    <div className="assignment-tools"><button className="primary" disabled={busy}>{staff ? "Save changes" : "Create employee"}</button>{cancel && <button type="button" className="secondary" onClick={cancel}>Disable</button>}</div>
  </form>;
}
