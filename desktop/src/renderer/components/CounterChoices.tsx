/* ── Recover the same cashier's stopped PC without resetting the cash day. ── */
import React,{useRef} from 'react';
import type {State} from '../model';
import {api,money} from '../helpers';
declare global{interface Window{counterRecovery:{recover:(value:unknown)=>Promise<{ok:boolean;error?:string}>};}}
export function CounterChoices({state,busy,run}:{state:State;busy:boolean;run:(fn:()=>Promise<unknown>)=>Promise<void>}){
 const requests=useRef(new Map<string,string>());
 return <>{state.choices.map(c=>{const old=c.recovery;return <div key={c.id}><button className="counter-choice" disabled={busy||!!state.settings.pendingTransfer||!!state.settings.pendingHandover||!!old&&!old.canRecover} onClick={()=>void run(async()=>{
  if(!old)return api('reserve',c.id);
  const key=c.id+'|'+old.leaseId;if(!requests.current.has(key))requests.current.set(key,crypto.randomUUID());
  const result=await window.counterRecovery.recover({counterId:c.id,expectedLeaseId:old.leaseId,requestId:requests.current.get(key),confirmOldPcStopped:true});if(!result.ok)throw Error(result.error||'কাউন্টার পুনরুদ্ধার হয়নি।');return true;
 })}>{c.code} · {c.name}<span>{old?(old.canRecover?'এই PC-তে পুনরায় চালু করুন':'আগের PC এখনও যুক্ত আছে'):c.invitation?'Accept handover · '+money(c.invitation.countedCents):'Connect →'}</span></button>{old&&<p className="muted">শেষ যোগাযোগ: {new Date(old.lastSeenAt).toLocaleTimeString()}। আগের PC বন্ধ করার ৪৫ সেকেন্ড পরে Retry connection চাপুন। সার্ভারে সিঙ্ক হওয়া হিসাব এই PC-তে আসবে।</p>}</div>;})}</>;
}
