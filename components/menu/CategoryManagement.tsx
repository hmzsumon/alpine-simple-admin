/* ── Component: CategoryManagement ───────────────────────────────────── */
"use client";
import {confirmAction} from "@/lib/feedback";
import { Pencil, Trash2 } from "lucide-react";
import {useState} from "react";
import {renameCategory} from "@/utils/renameCategory";
import { useAdminContext } from "@/context/AdminContext";
import { useAuth } from "@/providers/AuthProvider";
export default function CategoryManagement() {
  const { data, categories, save, busy, mode, setNotice, category, setCategory } = useAdminContext();
  const { can } = useAuth();
  const [editing,setEditing]=useState<string|null>(null),[nameValue,setNameValue]=useState(""),[error,setError]=useState("");
  return <details className="category-management"><summary>Manage categories <span className="count-pill">{categories.length}</span></summary><p className="muted">Rename a category to update all its menu items. Move or remove items before deleting a category.</p>{editing!==null&&can("menu:manage")&&<form className="category-rename-form" onSubmit={async event=>{event.preventDefault();setError("");try{const next=renameCategory(data,editing,nameValue);if(await save(next)){if(category.toLowerCase()===editing.toLowerCase())setCategory(nameValue.trim());setEditing(null);setNotice("Category and its menu items updated.");}}catch(e){setError(e instanceof Error?e.message:"Could not update the category.");}}}><label htmlFor="rename-category">Rename {editing}</label><input autoFocus id="rename-category" value={nameValue} maxLength={100} required onChange={event=>{setNameValue(event.target.value);setError("");}}/><div><button className="primary" disabled={busy||mode!=="database"}>Save category</button><button type="button" className="secondary" disabled={busy} onClick={()=>setEditing(null)}>Cancel</button></div>{error&&<p className="form-error" role="alert">{error}</p>}</form>}<div className="category-chip-grid">{categories.map((name) => {
    const count = data.menu.filter((m) => m.category.toLowerCase() === name.toLowerCase()).length;
    return <div className="category-manage-chip" key={name}><span>{name}<small>{count} items</small></span>{can("menu:manage")&&<button type="button" className="icon-button" aria-label={`Edit ${name} category`} disabled={busy||mode!=="database"} onClick={()=>{setEditing(name);setNameValue(name);setError("");}}><Pencil size={16}/></button>}{can("menu:manage") && <button type="button" className="icon-button danger-text" aria-label={`${name} Category Delete`} disabled={busy || mode !== "database"} onClick={async () => {
      if (count) { setNotice("This category contains items. Move or delete them first."); return; }
      if (!await confirmAction(`“${name}” Category Delete ?`)) return;
      if (await save({ ...data, categories: categories.filter((c) => c.toLowerCase() !== name.toLowerCase()) })) { if (category === name) setCategory("All categories"); setNotice("Category deleted."); }
    }}><Trash2 size={16} /></button>}</div>;
  })}</div></details>;
}
