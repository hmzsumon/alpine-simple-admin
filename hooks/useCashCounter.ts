/* ────────── exact financial requests survive timeouts; retry never creates another voucher ────────── */
"use client";
import {adminFetch} from "@/lib/adminFetch";

import {useCallback,useEffect,useRef,useState} from "react";
import {notify} from "@/lib/feedback";
import {useAuth} from "@/providers/AuthProvider";
import type {CashRegister} from "@/types/simpleCash";
interface Pending {requestId:string;action:string;[key:string]:unknown;}
export interface CommandResult {ok:boolean;kind:string;ref:string;dayId?:string;counterId?:string;duplicate:boolean;}
export function useCashCounter(counterId?:string){
 const {user,can}=useAuth(),key="alpine-simple-cash-request:"+user.id;
 const [data,setData]=useState<CashRegister>(),[error,setError]=useState(""),[pending,setPending]=useState<Pending>(),[busy,setBusy]=useState(false);const sending=useRef(false),reads=useRef(0);
 const refresh=useCallback(async()=>{if(!can("cash:read"))return;const read=++reads.current;try{const r=await adminFetch("/api/simple/register"+(counterId?"?counterId="+encodeURIComponent(counterId):""),{cache:"no-store"});const result=await r.json();if(!r.ok){if(r.status===403&&counterId){const fallback=await adminFetch("/api/simple/register",{cache:"no-store"});const safe=await fallback.json();if(fallback.ok){if(read===reads.current){setData(safe);setError("");}return;}}throw Error(result.error);}if(read===reads.current){setData(result);setError("");}}catch(e){if(read===reads.current){setData(undefined);setError(e instanceof Error?e.message:"Could not load cash counter");}}},[can,counterId]);
 useEffect(()=>{try{const saved=sessionStorage.getItem(key);if(saved)setPending(JSON.parse(saved));}catch{setError("Could not read the saved request. Check browser storage.");}void refresh();const timer=setInterval(()=>void refresh(),12000);window.addEventListener("simple-cash-updated",refresh);window.addEventListener("alpine:data-changed",refresh);return()=>{clearInterval(timer);window.removeEventListener("simple-cash-updated",refresh);window.removeEventListener("alpine:data-changed",refresh);};},[key,refresh]);
 const submit=async(body:Pending):Promise<CommandResult|null>=>{if(sending.current)return null;sending.current=true;setBusy(true);setError("");try{
  sessionStorage.setItem(key,JSON.stringify(body));setPending(body);
  const r=await adminFetch("/api/simple/command",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const result=await r.json();
  if(!r.ok){if(r.status<500){sessionStorage.removeItem(key);setPending(undefined);}throw Error(result.error||"Request was not confirmed");}
  sessionStorage.removeItem(key);setPending(undefined);await refresh();window.dispatchEvent(new Event("simple-cash-updated"));notify("Transaction saved successfully.");return result;
 }catch(e){setError(e instanceof Error?e.message:"No response received. Retry the saved request.");return null;}finally{sending.current=false;setBusy(false);}};
 return {data,error,setError,busy,pending,refresh,command:async(action:string,fields:Record<string,unknown>={})=>{const saved=sessionStorage.getItem(key);if(saved){setPending(JSON.parse(saved));setError("Confirm the saved request before starting another transaction.");return null;}return submit({action,orderEpoch:data?.orderEpoch,counterId:data?.counter.id||counterId||"main",...fields,requestId:crypto.randomUUID()});},retry:async()=>{const saved=sessionStorage.getItem(key);return saved?submit(JSON.parse(saved)):null;}};
}
