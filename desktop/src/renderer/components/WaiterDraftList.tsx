/* ── One draft opens automatically; several are identified by table and time ── */
import React from 'react';
import type {Snapshot} from '../../../shared/desktop/contracts';
export interface SavedWaiterDraft {id:string;revision:number;updatedAt:string;data:{waiterId:string;table:string;items:{menuId:string;quantity:number;unitPrice?:number}[]};}
export function WaiterDraftList({rows,catalog,busy,open,remove}:{rows:SavedWaiterDraft[];catalog:Snapshot['catalog'];busy:boolean;open:(id:string)=>void;remove:(row:SavedWaiterDraft)=>void}){
 if(!rows.length)return null;
 return <section className="waiter-drafts" aria-label="Waiter saved drafts"><strong>Saved drafts · {catalog.waiters.find(w=>w.id===rows[0].data.waiterId)?.name}</strong><p>Choose the table to continue. These drafts are saved on this PC.</p>{rows.map(row=><div className="waiter-draft-row" key={row.id}><button type="button" className="secondary" disabled={busy} onClick={()=>open(row.id)}>Table {catalog.tables.find(t=>t.id===row.data.table)?.name||row.data.table} · {row.data.items.reduce((n,l)=>n+l.quantity,0)} items · {new Date(row.updatedAt).toLocaleString()} <b>Open draft →</b></button><button type="button" className="secondary" disabled={busy} onClick={()=>remove(row)}>Delete</button></div>)}</section>;
}
