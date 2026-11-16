/* ── Component: ResourceForm; routing codes remain immutable ───────────── */
"use client";
import {nextHallTableNumber} from "@/utils/tableNumbering";
import { useState } from "react";
import type { RestaurantTable, Kitchen } from "@/types";
export default function ResourceForm({ kind, value, suggestedId, busy, submit, halls=[], tables=[], initialHallId="" }: { tables?:RestaurantTable[];initialHallId?:string;halls?:{id:string;name:string;floor:string}[]; kind: "table" | "kitchen"; value?: RestaurantTable | Kitchen; suggestedId: string; busy: boolean; submit: (entry: RestaurantTable) => Promise<boolean> }) {
  const [selectedFloor,setSelectedFloor]=useState(value?.floor||halls.find(h=>h.id===initialHallId)?.floor||"Ground floor");
  const [selectedHall,setSelectedHall]=useState(value&&"hallId" in value?value.hallId||"":initialHallId);
  const [tableName,setTableName]=useState(value?.name||(kind==="table"?nextHallTableNumber(tables,initialHallId):""));
  const [error, setError] = useState("");
  return <form onSubmit={async (e) => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const id = String(f.get("id")).trim(), name = String(f.get("name")).trim(), floor = String(f.get("floor")).trim();
    if (!name || !floor || (kind === "table" ? !/^T-(0[1-9]|[1-9]\d{1,3})$/.test(id) : !id || id === "Cash Counter" || /[\u0000-\u001f:]/.test(id))) { setError("Could not save. Check the message and refresh if needed."); return; }
    if(kind==="table"&&!selectedHall){setError("Choose a hall for this table.");return;}
    setError(""); if (!await submit({ id, name, floor, ...(kind==="table"&&f.get("hallId")?{hallId:String(f.get("hallId"))}:{}), seats: kind === "table" ? Number(f.get("seats")) : 4 })) setError("Could not save. Check the message and refresh if needed.");
  }}>
    {kind==="table"?<input type="hidden" name="id" value={value?.id||suggestedId}/>:<label>Internal group code<input name="id" required readOnly={!!value} defaultValue={value?.id||suggestedId}/></label>}
    <label>{kind==="table"?"Table number / name":"Internal group name"} *<input name="name" required maxLength={80} value={tableName} onChange={e=>setTableName(e.target.value)}/></label>
    {kind==="table"&&<small className="item-note">Numbers restart in every hall. A number must be unique within its hall.</small>}
    {kind==="table"?<><label>Hall *<select required name="hallId" value={selectedHall} onChange={e=>{setSelectedHall(e.target.value);setTableName(nextHallTableNumber(tables.filter(t=>t.id!==value?.id),e.target.value));setSelectedFloor(halls.find(h=>h.id===e.target.value)?.floor||"");}}><option value="" disabled>Choose hall</option>{halls.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><label>Floor (from hall)<input name="floor" readOnly value={selectedFloor}/></label></>:<label>Floor *<input required name="floor" value={selectedFloor} onChange={e=>setSelectedFloor(e.target.value)}/></label>}
    {kind === "table" && <label>Number of seats *<input name="seats" type="number" required min={1} max={100} step={1} defaultValue={value && "seats" in value ? value.seats : 4} /></label>}
    {error && <p role="alert" className="form-error">{error}</p>}<button type="submit" className="primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
  </form>;
}
