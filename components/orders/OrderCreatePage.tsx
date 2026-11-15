/* ── Component: dedicated cashier order workspace; uses the same retry-safe submission ── */
"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft,ShoppingBag} from "lucide-react";
import {useAdminContext} from "@/context/AdminContext";
import OrderForm from "./OrderForm";
export default function OrderCreatePage({table}:{table?:string}){
 const {mode,tables}=useAdminContext(),router=useRouter();
 const selected=table==="PARCEL"||tables.some(t=>t.id===table)?table:undefined;
 return <section><header className="erp-page-heading"><div><Link href="/orders" className="mb-3 inline-flex items-center gap-2 text-xs text-emerald-300 hover:underline"><ArrowLeft size={15}/>Back to orders</Link><h1>Create order</h1><p>Choose the counter, table or parcel channel, then add menu items.</p></div><span className="erp-page-icon"><ShoppingBag size={22}/></span></header>{mode==="loading"?<p className="info-note" role="status">Loading order workspace…</p>:mode==="error"?<p className="simple-error" role="alert">The order workspace is unavailable. Check the connection before continuing.</p>:<div className="panel p-4 sm:p-6"><OrderForm key={selected||"new"} fullPage initialTable={selected} onSaved={()=>router.replace("/orders")}/></div>}</section>;
}
