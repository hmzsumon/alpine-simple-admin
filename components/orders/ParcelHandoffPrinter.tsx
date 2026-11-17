/* ── Only the active drawer cashier claims a finalized parcel; no phone print commands ── */
'use client';
import {useEffect} from 'react';
import {useAuth} from '@/providers/AuthProvider';
import {printBill} from '@/lib/billPrinting';
import {notify} from '@/lib/feedback';
export default function ParcelHandoffPrinter(){const {user}=useAuth();useEffect(()=>{
 if(!user.permissions.includes('cash:operate')||!user.permissions.includes('payments:collect'))return;
 let stopped=false,running=false;let device='';try{device=localStorage.getItem('alpine:printer-device')||crypto.randomUUID();localStorage.setItem('alpine:printer-device',device);}catch{return;}
 const scan=async()=>{if(stopped||running)return;running=true;try{
  const r=await fetch('/api/simple/parcel-print-jobs',{cache:'no-store'});if(!r.ok)return;const data=await r.json();
  for(const job of data.jobs||[]){if(stopped)break;const claim=await fetch('/api/simple/parcel-print-claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...job,deviceId:device})});if(!claim.ok)continue;const saved=await claim.json();if(saved.claimed)printBill(saved.orderId,undefined,'bill',saved.jobId);}
 }catch{if(!stopped)notify('Parcel auto-print could not be checked. Check Orders and use Reprint bill if needed.','error');}finally{running=false;}};
 void scan();const timer=setInterval(()=>void scan(),5000),changed=()=>void scan();window.addEventListener('alpine:data-changed',changed);window.addEventListener('simple-cash-updated',changed);document.addEventListener('visibilitychange',changed);return()=>{stopped=true;clearInterval(timer);window.removeEventListener('alpine:data-changed',changed);window.removeEventListener('simple-cash-updated',changed);document.removeEventListener('visibilitychange',changed);};
 },[user.id,user.permissions]);return null;}
