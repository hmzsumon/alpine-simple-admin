/* ── Component: DeletedOrderHistory; private audit summary for delegated responsibility ── */
"use client";
import {adminFetch} from "@/lib/adminFetch";

import {useLiveEffect} from "@/hooks/useLiveEffect";
import { useState } from "react";
import { money } from "@/utils/format";
interface Entry { id: string; table: string; total: number; deletedAt: string; actor: string; reason: string; paid: boolean; }
export default function DeletedOrderHistory() {
  const [open,setOpen]=useState(false);
  const [records, setRecords] = useState<Entry[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useLiveEffect(()=>{if(!open)return;const abort=new AbortController();setBusy(true);setError("");void adminFetch("/api/orders/deletions",{cache:"no-store",signal:abort.signal}).then(async response=>{const result=await response.json();if(!response.ok)throw Error(result.error);setRecords(result.records);}).catch(error=>{if(error.name!=="AbortError")setError(error.message);}).finally(()=>{if(!abort.signal.aborted)setBusy(false);});return()=>abort.abort();},[open]);
  return <details className="deleted-order-history" onToggle={event=>setOpen(event.currentTarget.open)}><summary>Deleteের ইতিহাস · সর্বTo ১০০items</summary>{busy ? <p>লোড হচ্ছে…</p> : error ? <p role="alert">{error}</p> : <div className="table-scroll"><table><thead><tr><th>Order</th><th>Quantity</th><th>কে / কখন</th><th>Reason</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td>{record.table}<small className="item-note">{record.id}</small></td><td>{money(record.total)}<small className="item-note">{record.paid ? "Paid ছিল" : "Due ছিল"}</small></td><td>{record.actor}<small className="item-note">{new Date(record.deletedAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</small></td><td>{record.reason}</td></tr>)}</tbody></table>{!records.length && <p>এখনো কোনো Order Delete হয়নি।</p>}</div>}</details>;
}
