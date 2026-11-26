import React from 'react';
import type {State} from '../model';
import {api} from '../helpers';
import {notify} from './Notifications';

export function PrintQueue({state,busy,run}:{state:State;busy:boolean;run:(fn:()=>Promise<unknown>,message?:string)=>Promise<void>}){
 const waiting=state.prints.filter(job=>['queued','failed','uncertain'].includes(job.status));
 return <section aria-label="Print queue">
  <div className="panel-heading"><h2>Print queue</h2><button type="button" className="secondary" disabled={busy||!waiting.length} onClick={()=>void run(async()=>{
   const result=await api<{cleared:number;inProgress:number;cancelled?:boolean}>('clearPrintQueue');
   if(!result.cancelled)notify('success',result.cleared+' pending print copies cleared. Saved sales and payments are unchanged.'+(result.inProgress?' The current document may finish printing.':''));
  })}>Clear print queue</button></div>
  <p className="muted">Clear waiting bill and kitchen copies to save paper. Orders and payments stay saved; use Reprint in Orders for a copy later. A document already sent to Windows may finish printing.</p>
  {!state.prints.length&&<p>Queue clear.</p>}
  {state.prints.map(job=><div className="print-row" key={job.id}><b>{job.part} · {job.status}</b><small>{job.orderId}</small>{job.error&&<p className="error">{job.error}</p>}{job.status==='uncertain'&&<button type="button" className="secondary" disabled={busy} onClick={()=>{if(window.confirm('Check the paper first. Mark this job as reviewed? Use Reprint in Orders only if needed.'))void run(()=>api('dismissPrint',job.id));}}>Checked paper · resume queue</button>}</div>)}
 </section>;
}
