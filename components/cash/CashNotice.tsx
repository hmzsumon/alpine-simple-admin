"use client";
import {useEffect} from "react";
import {notify} from "@/lib/feedback";
import type {useCashCounter} from "@/hooks/useCashCounter";
export default function CashNotice({counter}:{counter:ReturnType<typeof useCashCounter>}){useEffect(()=>{if(counter.error)notify(counter.error,"error");},[counter.error]);return <>{counter.error&&<p className="simple-error" role="alert">{counter.error}</p>}{counter.pending&&<div className="simple-notice"><strong>Previous transaction not yet confirmed</strong><p>The request is saved. Retrying it will not add or deduct money twice.</p><button type="button" className="secondary" disabled={counter.busy} onClick={()=>void counter.retry()}>Retry saved request</button></div>}</>;}
