/* ── Component: dated schedule changes with preserved history ── */
"use client";
import {adminFetch} from "@/lib/adminFetch";

import { useState } from "react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import type { StaffDetails } from "@/types/staff-shifts";
export const dhakaToday=()=>new Date(Date.now()+6*3600000).toISOString().slice(0,10);
export default function StaffShiftAssignment({data,reload}:{data:StaffDetails;reload:()=>Promise<void>}) {
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const today=dhakaToday(),current=data.schedule.entries.find(e=>!e.supersededAt&&e.from<=today&&(!e.to||e.to>=today));
  return <section className="panel account-card staff-shifts-panel"><h3>Shift assignment</h3><p className="info-note">Current assignment: <strong>{current?current.name:"Not assigned"}</strong>{current?.start&&` · ${current.start} – ${current.end}`}</p>
    <p className="muted">The new shift starts on the selected date. Earlier history is retained; later planned assignments are replaced.</p>
    {notice&&<p className="info-note" role="status">{notice}</p>}
    <form onSubmit={async e=>{e.preventDefault();const values=new FormData(e.currentTarget);setBusy(true);setNotice("");try{const r=await adminFetch(`/api/users/${data.user.id}/shift`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({shiftId:values.get("shiftId")==="__leave__"?"":values.get("shiftId"),from:values.get("from"),revision:data.schedule.revision})});const result=await r.json();if(!r.ok)throw Error(result.error);await reload();setNotice("Shift assignment saved.");}catch(e){setNotice(e instanceof Error?e.message:"Could not save");}finally{setBusy(false);}}}>
      <div className="shift-form-grid"><label>Shift<SearchableSelect required name="shiftId" defaultValue={current?.shiftId||(current?"__leave__":"")}><option value="" disabled>Select shift</option><option value="__leave__">Leave / no scheduled shift</option>{data.shifts.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name} · {s.start} – {s.end}</option>)}</SearchableSelect></label><label>Effective from<input name="from" type="date" required min={today} defaultValue={today}/></label></div><button className="primary" disabled={busy}>{busy?"Saving...":"Save assignment"}</button>
    </form>
    <details className="staff-history"><summary>Assignment history ({data.schedule.entries.length})</summary><div className="table-scroll"><table><thead><tr><th>Shift</th><th>Time</th><th>Effective dates</th><th>Assigned by</th></tr></thead><tbody>{[...data.schedule.entries].reverse().map(entry=><tr key={entry.id}><td>{entry.name}{entry.supersededAt&&<small className="item-note">Superseded assignment</small>}</td><td>{entry.start?`${entry.start} – ${entry.end}`:"Leave"}</td><td>{entry.from} → {entry.to||"Until next change"}</td><td>{entry.assignedBy}<small className="item-note">{new Date(entry.assignedAt).toLocaleString("en-GB",{timeZone:"Asia/Dhaka"})}</small></td></tr>)}</tbody></table></div></details>
  </section>;
}
