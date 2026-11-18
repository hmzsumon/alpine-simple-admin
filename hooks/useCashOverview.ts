/* ── A single small dashboard read; stale responses never replace a newer refresh ── */
'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from '@/providers/AuthProvider';
import {adminFetch} from '@/lib/adminFetch';
import type {CashOverview} from '@/types/cashOverview';
export function useCashOverview(){
 const {user,can}=useAuth(),allowed=(user.role==='owner'||user.role==='admin')&&can('cash:read');
 const [data,setData]=useState<CashOverview>(),[error,setError]=useState(''),[loading,setLoading]=useState(false),reads=useRef(0),abort=useRef<AbortController>();
 const refresh=useCallback(async()=>{if(!allowed)return;const read=++reads.current;abort.current?.abort();const control=new AbortController();abort.current=control;setLoading(true);try{const r=await adminFetch('/api/simple/overview',{cache:'no-store',signal:control.signal});const result=await r.json();if(!r.ok)throw Error(result.error||'Could not load the counter overview.');if(read===reads.current){setData(result);setError('');}}catch(e){if(read===reads.current&&!(e instanceof Error&&e.name==='AbortError'))setError(e instanceof Error?e.message:'Could not load the counter overview.');}finally{if(read===reads.current)setLoading(false);}},[allowed]);
 useEffect(()=>{void refresh();const changed=()=>void refresh(),tick=()=>{if(document.visibilityState!=='hidden')void refresh();};const timer=setInterval(tick,15000);window.addEventListener('alpine:data-changed',changed);window.addEventListener('simple-cash-updated',changed);return()=>{reads.current++;abort.current?.abort();clearInterval(timer);window.removeEventListener('alpine:data-changed',changed);window.removeEventListener('simple-cash-updated',changed);};},[refresh]);
 return {data:allowed?data:undefined,error,loading,refresh,allowed};
}
