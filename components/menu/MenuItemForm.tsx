/* ── Component: MenuItemForm ────────────────────────────────────────────── */
"use client";
import {isFishCategory} from "@/utils/fishPricing";
import SearchableSelect from "@/components/ui/SearchableSelect";


/* ────────── imports ────────── */
import { useAdminContext } from "@/context/AdminContext";
import { useRef, useState } from "react";
import MenuImagePicker from "@/components/menu/MenuImagePicker";
import { normalizeItemCode } from "@/utils/menuSearch";

import type { MenuItem, Station } from "@/types";


export default function MenuItemForm() {
  /* ────────── workspace state ────────── */
  const { data, setNotice, setModal, editing, busy, save, categories, category, kitchens } =
    useAdminContext();
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const committed = useRef(false);
  const savedImageUrl = data.menu.find((item) => item.id === editing?.id)?.imageUrl || "";

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (uploading) return;
        const f = new FormData(e.currentTarget);
        const priceText = String(f.get("price")).trim();
        const price = priceText === "" ? null : Number(priceText);
        if (price !== null && (!Number.isFinite(price) || price < 0)) {
          setNotice("Enter a valid price");
          return;
        }
        const item: MenuItem = {
          code: editing?normalizeItemCode(String(f.get("code") || "")):"",
          codeNote: String(f.get("codeNote") || "").trim(),
          imageUrl,
          id: editing?.id || crypto.randomUUID(),
          name: String(f.get("name")).trim(),
          nameBn: String(f.get("nameBn")).trim(),
          aliases: [...new Set(String(f.get("aliases") || "").split(/[,，\n]/).map(s => s.trim()).filter(Boolean))],
          category: String(f.get("category")).trim(),
          kitchenCopy: f.get("kitchenCopy") === "on",
          station: f.get("station") as Station,
          price,
          active: f.get("active") === "on",
          note: String(f.get("note")).trim(),
        };
        if (!item.name || !item.nameBn || !/[\u0980-\u09ff]/.test(item.nameBn) || !item.category) {
          setNotice("English name, Bengali name (Bangla) and category are required");
          return;
        }
        if ((item.aliases?.length || 0) > 20 || item.aliases?.some(alias => alias.length > 80)) { setNotice("Use up to 20 aliases, each within 80 characters."); return; }
        if (item.code && data.menu.some((other) => other.id !== item.id && other.code === item.code)) { setNotice("This code is already used. Enter another code or leave it blank for automatic assignment."); return; }
        if (item.active && price === null && !isFishCategory(item.category)) {
          setNotice("Confirm the price before enabling an item");
          return;
        }
        if (
          await save({
            ...data,
            menu: editing
              ? data.menu.map((i) => (i.id === editing.id ? item : i))
              : [...data.menu, item],
          })
        ) {
          committed.current = true;
          setModal(null);
          setNotice("Menu item saved");
        }
      }}
    >
      <MenuImagePicker value={imageUrl} onChange={setImageUrl}
        uploading={uploading} setUploading={setUploading} disabled={busy}
        committed={committed} savedImageUrl={savedImageUrl}
        onRemoveSaved={async () => {
          if (!editing) return true;
          return save({ ...data, menu: data.menu.map((item) =>
            item.id === editing.id ? { ...item, imageUrl: "" } : item) });
        }} />
      <label>
        Item name (English) *
        <input required name="name" maxLength={200} defaultValue={editing?.name} placeholder="e.g. Mug Dal" lang="en" />
      </label>
      <label>Item code<input name="code" readOnly={!editing} maxLength={40} defaultValue={editing?.code || ""} placeholder="Assigned automatically after saving" /><small className="item-note">New items receive the next unique code automatically. Existing codes can be edited.</small></label>
      {(editing?.codeNote || editing?.catalogRef) && <label>Code verification note<input name="codeNote" maxLength={500} defaultValue={editing?.codeNote || ""} /><small className="item-note">Excel-Verify uncertain workbook data and update this note.</small></label>}
      {editing?.price === null && <p className="info-note">This item's price is not confirmed. Set its price and enable Available for ordering before taking orders.</p>}
      <label>Item name (Bangla) *<input required name="nameBn" maxLength={200} defaultValue={editing?.nameBn} placeholder="Example: Mug Dal" lang="bn" />
        <small className="item-note">This name appears prominently in the Bengali waiter app. The English name is retained too.</small></label>
      <label>Voice search aliases<textarea name="aliases" maxLength={1620} defaultValue={editing?.aliases?.join(", ") || ""} placeholder="Example: porata, normal paratha, plain paratha" /><small className="item-note">Separate aliases with commas, up to 20. Include the correct size for half/full items. Ambiguous matches are reviewed by the waiter.</small></label>
      <div className="form-grid">
        <label>
          Category *
          <input
            list="categories"
            required
            name="category"
            defaultValue={editing?.category || (category === "All categories" ? "" : category)}
          />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Price (BDT)
          <input
            type="number"
            min="0"
            step="0.01"
            name="price"
            defaultValue={editing?.price ?? ""}
          />
        </label>
      </div>
      <label hidden>
        Internal catalog group
        <SearchableSelect
          name="station"
          defaultValue={editing?.station || kitchens[0]?.id || ""}
        >
          {kitchens.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </SearchableSelect>
      </label>
      <label>
        Internal note
        <input name="note" defaultValue={editing?.note} />
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          name="active"
          defaultChecked={editing?.active ?? true}
        />{" "}
        Available for ordering
      </label>
      <label className="check-label"><input type="checkbox" name="kitchenCopy" defaultChecked={editing?.kitchenCopy === true}/>Include in the Bengali kitchen copy</label>
      <button disabled={busy || uploading} className="primary" type="submit">
        {busy ? "Saving…" : "Save item"}
      </button>
    </form>
  );
}
