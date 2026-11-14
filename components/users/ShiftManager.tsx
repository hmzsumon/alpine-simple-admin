/* ── Component: editable shift templates, with revision protection ── */
"use client";
import {adminFetch} from "@/lib/adminFetch";

import {useLiveEffect} from "@/hooks/useLiveEffect";
import {  useState } from "react";
import { Clock3, Pencil, Plus } from "lucide-react";
import type { StaffShift } from "@/types/staff-shifts";
import "./staff-shifts.css";
export default function ShiftManager() {
  const [shifts,setShifts]=useState<StaffShift[]>([]),[editing,setEditing]=useState<StaffShift>(),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  useLiveEffect(()=>{const controller=new AbortController();adminFetch("/api/users/shifts",{cache:"no-store",signal:controller.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error);setShifts(data.shifts);}).catch(e=>{if(e.name!=="AbortError")setNotice(e.message);});return()=>controller.abort();},[]);
  return <section className="panel account-card staff-shifts-panel"><div className="panel-title"><h3><Clock3 size={20}/>Shift templates</h3><span className="count-pill">{shifts.length}</span></div>
    <p className="muted">Edit shift names and times here. Existing assignments keep their original times; reassign employees from their details page to apply a changed template.</p>
    {notice&&<p className="info-note" role="status">{notice}</p>}
    <div className="shift-template-grid">{shifts.map(shift=><div key={shift.id} className="shift-template"><strong>{shift.name}</strong><p>{shift.start} – {shift.end}{shift.start>shift.end?" (next day)":""}</p><small>{shift.active?"Active":"Inactive for new assignments"}</small><button type="button" className="secondary" onClick={()=>{setEditing(shift);setNotice("");}}><Pencil size={14}/>Edit</button></div>)}</div>
    <form key={editing?.id||"new"} className="shift-template-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget,values=new FormData(form);setBusy(true);setNotice("");try{const r=await adminFetch("/api/users/shifts"+(editing?"/"+encodeURIComponent(editing.id):""),{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:values.get("name"),start:values.get("start"),end:values.get("end"),active:values.get("active")==="on",...(editing?{version:editing.version}:{})})});const result=await r.json();if(!r.ok)throw Error(result.error);setShifts(result.shifts);setEditing(undefined);form.reset();setNotice("Shift saved. Assign it from the employee details page.");}catch(e){setNotice(e instanceof Error?e.message:"Could not save");}finally{setBusy(false);}}}>
      <h4>{editing?"Edit shift":"New shift"}</h4><div className="shift-form-grid"><label>Shift name<input required minLength={2} maxLength={80} name="name" defaultValue={editing?.name} placeholder="e.g. Evening shift"/></label><label>From<input required name="start" type="time" defaultValue={editing?.start||"08:00"}/></label><label>To<input required name="end" type="time" defaultValue={editing?.end||"16:00"}/></label></div>
      <label className="check-label"><input type="checkbox" name="active" defaultChecked={editing?.active??true}/>Active for new assignments</label>
      <div className="assignment-tools"><button className="primary" disabled={busy}><Plus size={15}/>{busy?"Saving...":"Save shift"}</button>{editing&&<button type="button" className="secondary" onClick={()=>setEditing(undefined)}>Create new shift</button>}</div>
    </form>
  </section>;
}
