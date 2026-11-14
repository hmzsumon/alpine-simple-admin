"use client";
import {adminFetch} from "@/lib/adminFetch";

import {useLiveEffect} from "@/hooks/useLiveEffect";
import Link from "next/link";
import {useCallback,useState} from "react";
import {taka,dayToday} from "@/utils/cashFormat";
import type {DayReport} from "@/types/simpleCash";
import "./simple-cash.css";
type Row=DayReport&{counterId:string;counterName:string;id:string;closed:boolean;custodian:string;countedCents?:number};
export default function SalesReportsPage(){const [from,setFrom]=useState(()=>dayToday().slice(0,8)+"01"),[to,setTo]=useState(dayToday),[rows,setRows]=useState<Row[]>([]),[error,setError]=useState("");
 const load=useCallback(async()=>{try{const r=await adminFetch("/api/simple/reports?"+new URLSearchParams({from,to}),{cache:"no-store"});const data=await r.json();if(!r.ok)throw Error(data.error);setRows(data.days);setError("");}catch(e){setError(e instanceof Error?e.message:"Could not load data");}},[from,to]);useLiveEffect(()=>{void load();},[load]);
 return <div><h2>Sales & closing reports</h2><p className="info-note">View sales, cash, digital payments, Foodpanda receivables, payouts and closing for any day.</p><section className="panel simple-section"><form className="simple-form" onSubmit={e=>{e.preventDefault();void load();}}><label>From<input type="date" required value={from} max={to} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" required value={to} min={from} onChange={e=>setTo(e.target.value)}/></label><button className="secondary">View reports</button></form></section>{error&&<p className="simple-error">{error}</p>}<section className="panel simple-section"><div className="table-scroll"><table><thead><tr><th>Day / counter</th><th>Sales</th><th>Cash bills</th><th>Digital</th><th>Foodpanda receivable</th><th>Cash paid out</th><th>Counted cash</th><th>Total shortage / overage</th><th>Action</th></tr></thead><tbody>{rows.map(row=><tr key={row.id+row.counterId}><td>{row.id} · {row.counterName}<small className="item-note">{row.closed?"Day closed":"Day open"} · {row.custodian}</small></td><td>{taka(row.sales)}</td><td>{taka(row.cashReceived)}</td><td>{taka(row.digitalReceived)}</td><td>{taka(row.platformReceivable)}</td><td>{taka(row.cashOut)}</td><td>{row.countedCents===undefined?"—":taka(row.countedCents)}</td><td>{row.totalDifference===null?"—":taka(row.totalDifference)}</td><td><Link className="text-button" href={`/reports/${row.id}?counterId=${encodeURIComponent(row.counterId)}`}>Counter report</Link><br/><Link className="text-button" href={`/reports/${row.id}`}>Daily total / PDF</Link></td></tr>)}</tbody></table>{!rows.length&&<p className="simple-empty">No business days in this range.</p>}</div></section></div>;
}
