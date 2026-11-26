'use client';
/* ── Live reads retain the last matching report; only a different filter replaces the view. ── */
import {useEffect,useRef,useState} from 'react';
import {adminFetch} from '@/lib/adminFetch';
import {reconcileCollections} from '@/utils/readQueue';
import {salesQuery} from '@/utils/salesReportFilters';
import type {SalesFilters,SalesAnalysisData} from '@/types/salesAnalysis';

export function useSalesAnalysis(filters:SalesFilters,offset:number,permitted:boolean){
 const [result,setResult]=useState<{key:string;data:SalesAnalysisData}>(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const refreshRead=useRef<()=>void>(()=>{});
 const query=salesQuery(filters)+'&offset='+offset+'&limit=25';
 useEffect(()=>{
  if(!permitted)return;
  let stopped=false,running=false,again=false,timer:ReturnType<typeof setTimeout>|undefined,lastStarted=0;
  const control=new AbortController();setError('');
  function schedule(){
   if(stopped)return;
   if(running){again=true;return;}
   if(timer)return;
   timer=setTimeout(()=>{timer=undefined;void load();},Math.max(200,1500-(Date.now()-lastStarted)));
  }
  async function load(){
   if(stopped)return;
   if(running){again=true;return;}
   running=true;lastStarted=Date.now();setBusy(true);
   try{
    const response=await adminFetch('/api/simple/sales-analysis?'+query,{cache:'no-store',signal:control.signal});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'Could not load this report.');
    if(!stopped){setResult(previous=>({key:query,data:previous?.key===query?reconcileCollections(previous.data,data):data}));setError('');}
   }catch(problem){if(!stopped&&!(problem instanceof Error&&problem.name==='AbortError'))setError(problem instanceof Error?problem.message:'Could not load this report.');}
   finally{running=false;if(!stopped){setBusy(false);if(again){again=false;schedule();}}}
  }
  const changed=()=>{if(document.visibilityState!=='hidden')schedule();};
  refreshRead.current=()=>void load();
  window.addEventListener('alpine:data-changed',changed);
  window.addEventListener('simple-cash-updated',changed);
  void load();
  return()=>{stopped=true;control.abort();if(timer)clearTimeout(timer);window.removeEventListener('alpine:data-changed',changed);window.removeEventListener('simple-cash-updated',changed);refreshRead.current=()=>{};};
 },[query,permitted]);
 const data=permitted&&result?.key===query?result.data:undefined;
 return {data,ready:!!data&&!error,error,busy,refresh:()=>refreshRead.current()};
}
