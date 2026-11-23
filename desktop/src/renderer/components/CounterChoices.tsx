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
  const result=await window.counterRecovery.recover({counterId:c.id,expectedLeaseId:old.leaseId,requestId:requests.current.get(key),confirmOldPcStopped:true});if(!result.ok)throw Error(result.error||'The counter could not be recovered.');return true;
 })}>{c.code} · {c.name}<span>{old?(old.canRecover?'Resume on this PC':'The previous PC is still connected'):c.invitation?'Accept handover · '+money(c.invitation.countedCents):'Connect →'}</span></button>{old&&<p className="muted">Last contact: {new Date(old.lastSeenAt).toLocaleTimeString()}. Wait 45 seconds after closing the previous PC, then select Retry connection. Server-synced records will load on this PC.</p>}</div>;})}</>;
}
