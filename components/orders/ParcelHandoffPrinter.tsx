/* ── One print device claims each confirmed order once; bookings and payments create no extra copies ── */
'use client';
import {useEffect} from 'react';
import {useAuth} from '@/providers/AuthProvider';
import {printBill} from '@/lib/billPrinting';
import {notify} from '@/lib/feedback';
export default function OrderAutoPrinter(){const {user}=useAuth();useEffect(()=>{
 if(!user.permissions.includes('cash:operate')||!user.permissions.includes('payments:collect'))return;
 let stopped=false,running=false,blocked=false,again=false,lastError=0,device='';
 try{
  // Only the dedicated Auto Print browser profile participates; ordinary windows and phones do not steal jobs.
  if(new URLSearchParams(window.location.search).get('autoPrint')==='1')localStorage.setItem('alpine:auto-print-enabled','1');
  if(localStorage.getItem('alpine:auto-print-enabled')!=='1')return;
  device=localStorage.getItem('alpine:printer-device')||crypto.randomUUID();localStorage.setItem('alpine:printer-device',device);
  window.dispatchEvent(new Event('alpine:printer-status'));
 }catch{return;}
 const scan=async()=>{if(stopped||blocked)return;if(running){again=true;return;}running=true;try{
  const r=await fetch('/api/simple/order-print-jobs',{cache:'no-store'});if(!r.ok){if(r.status===401||r.status===403)blocked=true;throw Error('Print queue unavailable');}const data=await r.json();
  for(const job of data.jobs||[]){if(stopped)break;
   const claim=await fetch('/api/simple/order-print-claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...job,deviceId:device})});if(!claim.ok)continue;const saved=await claim.json();
   // Wait for customer bill + optional kitchen copy + parcel token before claiming another order, so reloads cannot lose a claimed backlog.
   if(saved.claimed&&await printBill(saved.orderId,undefined,'bill',saved.jobId,true)===false){blocked=true;notify('Auto-print paused. Check the printer and reopen the Auto Print window. Use Reprint for the last bill if needed.','error');break;}
  }
 }catch{if(!stopped&&Date.now()-lastError>=60000){lastError=Date.now();notify('Auto-print queue is unavailable. Check the connection; saved orders remain in Orders.','error');}}finally{running=false;if(again&&!stopped&&!blocked){again=false;void scan();}}};
 void scan();const timer=setInterval(()=>void scan(),3000),changed=()=>void scan();
 const events=typeof EventSource!=='undefined'?new EventSource('/api/events'):undefined;
 events?.addEventListener('connected',changed);events?.addEventListener('changed',changed);events?.addEventListener('session-ended',()=>{blocked=true;events.close();});
 window.addEventListener('alpine:data-changed',changed);window.addEventListener('simple-cash-updated',changed);document.addEventListener('visibilitychange',changed);
 return()=>{stopped=true;events?.close();clearInterval(timer);window.removeEventListener('alpine:data-changed',changed);window.removeEventListener('simple-cash-updated',changed);document.removeEventListener('visibilitychange',changed);};
 },[user.id,user.permissions]);return null;}
