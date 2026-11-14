/* ── Component: TableManagement ───────────────────────────────────────── */
"use client";
import {confirmAction} from "@/lib/feedback";
import { useState, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useAdminContext } from "@/context/AdminContext";
import { Plus, Table2, Pencil, Trash2 } from "lucide-react";
import { money, total } from "@/utils/format";
import HallManagement from "./HallManagement";
import SetupDialog from "@/components/setup/SetupDialog";
import ResourceForm from "@/components/setup/ResourceForm";
import type { RestaurantTable } from "@/types";
export default function TableManagement() {
  const { can } = useAuth();
  const { data, tables, floor, setFloor, active, openOrder, save, busy, mode, setNotice } = useAdminContext();
  const [editing, setEditing] = useState<RestaurantTable | null | undefined>();
  const close = useCallback(() => setEditing(undefined), []);
  const floors = [...new Set(tables.map((t) => t.floor))];
  const visible = floor === "All floors" || !floors.includes(floor) ? tables : tables.filter((t) => t.floor === floor);
  const nextNumber = Math.max(0, ...[...tables.map((t) => t.id), ...(data.retiredTableIds || [])].map((id) => Number(id.slice(2)))) + 1;
  return <>
    <HallManagement/>
    <div className="resource-toolbar"><div><h2>Manage tables</h2><p className="muted">{tables.length}tables · {floors.length}floors</p></div>{can("tables:manage") && <button type="button" className="primary" disabled={busy || mode !== "database"} onClick={() => setEditing(null)}><Plus size={17} /> New table</button>}</div>
    <div className="filters floor-filters">{["All floors", ...floors].map((f) => <button type="button" key={f} className={(floor === f || (f === "All floors" && !floors.includes(floor))) ? "primary" : "secondary"} onClick={() => setFloor(f)}>{f === "All floors" ? "All floors" : f}</button>)}</div>
    <div className="table-grid">{visible.map((table) => {
      const current = active.filter((o) => o.table === table.id);
      return <article key={table.id} className={`table-card resource-table-card ${current.length ? "occupied" : ""}`}>
        <div><Table2 size={23} /><span className={`badge ${current.length ? "Preparing" : "Ready"}`}>{current.length ? "Occupied" : "Available"}</span></div>
        <h3>{table.name}</h3><p>{table.id} · {table.floor} · {data.halls?.find(h=>h.id===table.hallId)?.name||"Hall not assigned"} · {table.seats} Seats</p>
        <footer>{current.length ? `${current.length} Order · ${money(current.reduce((s, o) => s + total(o), 0))}` : "Available for new orders"}</footer>
        <div className="resource-actions">{can("orders:create") && <button type="button" className="secondary" disabled={busy} onClick={() => openOrder(table.id)}><Plus size={15} /> Order</button>}{can("tables:manage") && <><button type="button" className="text-button" disabled={busy || mode !== "database"} onClick={() => setEditing(table)}><Pencil size={14} /> Edit</button><button type="button" className="text-button danger-text" disabled={busy || mode !== "database" || !!current.length} title={current.length ? "Settle open orders first" : "Delete table"} onClick={async () => {
          if (!await confirmAction(`“${table.name}” (${table.id}) Delete table ? Historical orders are retained and this code cannot be reused.`)) return;
          if (await save({ ...data, tables: tables.filter((t) => t.id !== table.id) })) setNotice("Table deleted. Historical orders are retained.");
        }}><Trash2 size={14} /> Delete</button></>}</div>
      </article>;
    })}</div>
    {!tables.length && <p className="info-note">No tables yet. Add tables and assign them to waiters.</p>}
    {editing !== undefined && <SetupDialog title={editing ? "Edit table" : "New table"} busy={busy} close={close}><ResourceForm halls={data.halls} kind="table" value={editing || undefined} suggestedId={`T-${String(nextNumber).padStart(2, "0")}`} busy={busy} submit={async (entry) => {
      if (tables.some((t) => t.id !== editing?.id && (t.id === entry.id || t.name.toLowerCase() === entry.name.toLowerCase()))) { setNotice("A table already uses this code or name. Choose another."); return false; }
      const saved = await save({ ...data, tables: editing ? tables.map((t) => t.id === editing.id ? entry : t) : [...tables, entry] });
      if (saved) { close(); setNotice("Table saved. Assign it to waiters in Staff & permissions."); } return saved;
    }} /></SetupDialog>}
  </>;
}
