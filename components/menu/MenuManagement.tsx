/* ── Component: MenuManagement ────────────────────────────────────────────── */
"use client";
import {confirmAction} from "@/lib/feedback";
import SearchableSelect from "@/components/ui/SearchableSelect";


/* ────────── imports ────────── */
import { useState } from "react";
import Link from "next/link";
import MenuImportPanel from "./MenuImportPanel";
import MenuCodeUpdatePanel from "./MenuCodeUpdatePanel";
import KitchenCopySettings from "./KitchenCopySettings";
import { useAuth } from "@/providers/AuthProvider";
import { useAdminContext } from "@/context/AdminContext";
import { Plus, Trash2, FileSpreadsheet } from "lucide-react";
import CategoryManagement from "./CategoryManagement";
import { money } from "@/utils/format";
import SearchBox from "@/components/ui/SearchBox";
import Empty from "@/components/ui/EmptyState";
import MenuImage from "@/components/menu/MenuImage";
import MenuItemName from "@/components/menu/MenuItemName";

export default function MenuManagement() {
  const { can } = useAuth();
  const [showImport, setShowImport] = useState(false);
  const [showCodes,setShowCodes]=useState(false);
  const [showKitchen,setShowKitchen]=useState(false);
  /* ────────── workspace state ────────── */
  const {
    data,
    search,
    setSearch,
    category,
    setCategory,
    setModal,
    setEditing,
    categories,
    filteredMenu,
    save, busy, mode, setNotice,
  } = useAdminContext();

  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <h3>
            Menu library <span className="count-pill">{data.menu.length}</span>
          </h3>
          <p>Price, Code and Bengali names in the menu</p>
        </div>
        <div className="menu-actions">
        {can("menu:manage")&&<button type="button" className="secondary" disabled={busy||mode!=="database"} onClick={()=>setShowKitchen(true)}>Kitchen copy items</button>}
        <Link href="/menu-code-print" target="_blank" className="secondary">Print item codes</Link><Link href="/menu/categories/Uncategorized" className="secondary">Uncategorized items</Link>
        {can("menu:manage")&&<button type="button" className="secondary" disabled={busy||showImport||showCodes||mode!=="database"} onClick={()=>setShowCodes(true)}>একসঙ্গে কোড আপডেট</button>}
        {can("menu:manage") && <button type="button" className="secondary" disabled={busy || showImport || mode !== "database"} onClick={() => setShowImport(true)}><FileSpreadsheet size={16}/>Excel Import / Update</button>}
        <button className="secondary" disabled={!can("menu:manage")}
          onClick={() => setModal("category")}>
          <Plus size={16} /> Add category
        </button>
        <button
          className="primary"
          disabled={!can("menu:manage")}
          onClick={async () => {
            setEditing(null);
            setModal("menu");
          }}
        >
          <Plus size={16} /> Add item
        </button>
        </div>
      </div>
      {showImport && <MenuImportPanel close={() => setShowImport(false)} />}
      {showCodes&&<MenuCodeUpdatePanel close={()=>setShowCodes(false)}/>}
      <CategoryManagement />
      {showKitchen&&<KitchenCopySettings close={()=>setShowKitchen(false)}/>}
      <div className="filters">
        <SearchBox value={search} onChange={setSearch} />
        <SearchableSelect
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SearchableSelect>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Item name</th>
              <th>Code</th>
              <th>Category</th>
              
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredMenu.map((i) => (
              <tr key={i.id}>
                <td>
                  <div className="menu-item-identity">
                  <MenuImage src={i.imageUrl} name={i.name} />
                  <div>
                  <MenuItemName item={i} />
                  {!i.nameBn && <small className="item-note amber-text">Add Bengali name</small>}
                  {i.note && <small className="item-note">{i.note}</small>}
                  </div>
                  </div>
                </td>
                <td><strong className="item-code-badge">{i.code || "—"}</strong>{i.codeNote && <small className="item-note amber-text" title={i.codeNote}>Code note - edit</small>}</td>
                <td>{i.category}</td>
                
                <td>
                  {i.price === null ? (
                    <span className="amber-text">Unconfirmed</span>
                  ) : (
                    money(i.price)
                  )}
                </td>
                <td>
                  <span className={`badge ${i.active && data.stockSummary?.[i.id]?.available !== false ? "Ready" : "Cancelled"}`}>
                    {!i.active ? "Disabled" : data.stockSummary?.[i.id]?.available === false ? "Unavailable" : "Available"}
                  </span>
                  {data.stockSummary?.[i.id]?.tracked && <small className="item-note">{data.stockSummary[i.id].available
                    ? data.stockSummary[i.id].quantity === null ? "Kitchen available" : `${data.stockSummary[i.id].quantity} remaining`
                    : data.stockSummary[i.id].reason}</small>}
                </td>
                <td>
                  <div className="resource-actions">
                  <button
                    className="text-button"
                    disabled={!can("menu:manage")}
                    onClick={async () => {
                      setEditing(i);
                      setModal("menu");
                    }}
                  >
                    Edit
                  </button>
                  {can("menu:manage") && <button type="button" className="text-button danger-text" disabled={busy || mode !== "database"} onClick={async () => {
                    if (!await confirmAction(`“${i.nameBn || i.name}” Delete ? Historical orders are retained. Settle open orders first.`)) return;
                    if (await save({ ...data, menu: data.menu.filter((item) => item.id !== i.id) })) setNotice("Menu item deleted. Historical orders are retained.");
                  }}><Trash2 size={14} /> Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredMenu.length && <Empty text="No items match your search." />}
      </div>
    </section>
  );
}
