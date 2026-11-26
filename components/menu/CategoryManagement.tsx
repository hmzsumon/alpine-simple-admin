/* ── Component: CategoryManagement ───────────────────────────────────── */
"use client";
import {confirmAction} from "@/lib/feedback";
import { Pencil, Trash2 } from "lucide-react";
import {useState, type FormEvent} from "react";
import {renameCategory} from "@/utils/renameCategory";
import { useAdminContext } from "@/context/AdminContext";
import { useAuth } from "@/providers/AuthProvider";
export default function CategoryManagement() {
  const { data, categories, save, busy, mode, setNotice, category, setCategory } = useAdminContext();
  const { can } = useAuth();
  const [editing, setEditing] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [error, setError] = useState("");
  const canManage = can("menu:manage");

  async function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editing === null || busy || mode !== "database" || !canManage) return;
    setError("");
    try {
      const next = renameCategory(data, editing, nameValue);
      if (await save(next)) {
        if (category.toLowerCase() === editing.toLowerCase()) setCategory(nameValue.trim());
        setEditing(null);
        setNotice("Category and its menu items updated.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the category.");
    }
  }

  return (
    <details className="category-management">
      <summary>Manage categories <span className="count-pill">{categories.length}</span></summary>
      <p className="muted">Use Edit beside a category to change its name and update its menu items. Move or remove items before deleting a category.</p>
      {editing !== null && canManage && (
        <form className="category-rename-form" onSubmit={submitRename}>
          <label htmlFor="rename-category">Rename {editing}</label>
          <input autoFocus id="rename-category" value={nameValue} maxLength={100} required disabled={busy}
            onChange={event => { setNameValue(event.target.value); setError(""); }} />
          <div>
            <button className="primary" disabled={busy || mode !== "database"}>Save category</button>
            <button type="button" className="secondary" disabled={busy} onClick={() => setEditing(null)}>Cancel</button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      )}
      <div className="category-chip-grid">
        {categories.map(name => {
          const count = data.menu.filter(item => item.category.toLowerCase() === name.toLowerCase()).length;
          return (
            <div className="category-manage-chip" key={name}>
              <span className="category-manage-name">{name}<small>{count} items</small></span>
              {canManage && <div className="category-manage-actions">
                <button type="button" className="category-edit-button" aria-label={`Edit ${name} category`}
                  disabled={busy || mode !== "database"}
                  onClick={() => { setEditing(name); setNameValue(name); setError(""); }}>
                  <Pencil size={14} /><span>Edit</span>
                </button>
                <button type="button" className="icon-button danger-text" aria-label={`${name} Category Delete`}
                  title={`Delete ${name} category`} disabled={busy || mode !== "database"}
                  onClick={async () => {
                    if (count) { setNotice("This category contains items. Move or delete them first."); return; }
                    if (!await confirmAction(`“${name}” Category Delete ?`)) return;
                    if (await save({ ...data, categories: categories.filter(value => value.toLowerCase() !== name.toLowerCase()) })) {
                      if (category === name) setCategory("All categories");
                      if (editing === name) setEditing(null);
                      setNotice("Category deleted.");
                    }
                  }}><Trash2 size={16} /></button>
              </div>}
            </div>
          );
        })}
      </div>
    </details>
  );
}
