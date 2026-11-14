/* ── Component: CategoryManagement ───────────────────────────────────── */
"use client";
import {confirmAction} from "@/lib/feedback";
import { Trash2 } from "lucide-react";
import { useAdminContext } from "@/context/AdminContext";
import { useAuth } from "@/providers/AuthProvider";
export default function CategoryManagement() {
  const { data, categories, save, busy, mode, setNotice, category, setCategory } = useAdminContext();
  const { can } = useAuth();
  return <details className="category-management"><summary>Manage categories <span className="count-pill">{categories.length}</span></summary><p className="muted">Move or remove the items before deleting a category.</p><div className="category-chip-grid">{categories.map((name) => {
    const count = data.menu.filter((m) => m.category.toLowerCase() === name.toLowerCase()).length;
    return <div className="category-manage-chip" key={name}><span>{name}<small>{count}items</small></span>{can("menu:manage") && <button type="button" className="icon-button danger-text" aria-label={`${name} Category Delete`} disabled={busy || mode !== "database"} onClick={async () => {
      if (count) { setNotice("This category contains items. Move or delete them first."); return; }
      if (!await confirmAction(`“${name}” Category Delete ?`)) return;
      if (await save({ ...data, categories: categories.filter((c) => c.toLowerCase() !== name.toLowerCase()) })) { if (category === name) setCategory("All categories"); setNotice("Category deleted."); }
    }}><Trash2 size={16} /></button>}</div>;
  })}</div></details>;
}
