/* ── Print only the saved, settled receipt; reload/retry cannot auto-print it twice ── */
"use client";
import {useEffect} from "react";
import {printDocument} from "@/components/cash/PaperSize";
export default function AutomaticBillPrint({jobId,userId,orderId,eligible}:{jobId:string;userId:string;orderId:string;eligible:boolean}){
 useEffect(()=>{let active=true;const report=(status:string)=>window.parent.postMessage({type:"alpine:bill-print",jobId,status},window.location.origin);const key=`alpine:bill-print:${userId}:${orderId}:${jobId}`;
  if(!eligible){report("skipped");return;}
  const done=()=>report("finished");window.addEventListener("afterprint",done);
  void(async()=>{try{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));if(!active)return;const submit=()=>{if(!active)return;if(localStorage.getItem(key)){report("skipped");return;}localStorage.setItem(key,"requested");report("started");printDocument();};if(navigator.locks)await navigator.locks.request(key,submit);else submit();}catch{report("error");}})();
  return()=>{active=false;window.removeEventListener("afterprint",done);};
 },[jobId,userId,orderId,eligible]);return null;
}
