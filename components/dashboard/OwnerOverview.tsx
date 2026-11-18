'use client';
/* ── Combined business-day totals and live counter access for Owner/Admin ── */
import Link from 'next/link';
import {RefreshCw,ReceiptText,Banknote,Wallet,Clock3} from 'lucide-react';
import {useCashOverview} from '@/hooks/useCashOverview';
import PaymentBreakdown from '@/components/cash/PaymentBreakdown';
import CounterCards from './CounterCards';
import {taka} from '@/utils/cashFormat';
import '@/components/cash/simple-cash.css';
import './counter-overview.css';
export default function OwnerOverview(){
 const {data,error,loading,refresh}=useCashOverview();
 const metrics=data?[{label:'Total sales',value:data.totals.sales,icon:ReceiptText,help:data.totals.orders+' finalised bills'},{label:'Cash collections',value:data.totals.cashReceived,icon:Banknote,help:'Bill payments received in cash'},{label:'Digital collections',value:data.totals.digitalReceived,icon:Wallet,help:'Mobile banking, card and bank'},{label:'Unpaid bills',value:data.totals.due,icon:Clock3,help:'Amount still to collect'}]:[];
 return <div className="owner-overview"><header className="overview-heading"><div><span className="overview-eyebrow">RESTAURANT OVERVIEW</span><h1>Sales & counters</h1><p>All counters, payment methods and collections in one place.</p></div><div className="overview-actions"><span className="cash-section-chip">Business day · {data?.date||'Loading…'}</span><button className="secondary" disabled={loading} onClick={()=>void refresh()} aria-label="Refresh dashboard"><RefreshCw size={16} className={loading?'overview-spin':''}/>Refresh</button></div></header>{error&&<div className="simple-error" role="alert">{error} <button className="text-button" disabled={loading} onClick={()=>void refresh()}>Retry</button></div>}{!data?<section className="panel overview-loading" role="status">{error?'Overview is unavailable. Please retry.':'Loading sales and counters…'}</section>:<div aria-busy={loading}><div className="overview-scope"><span><i/>Live overview</span><span>Updated {new Date(data.updatedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dhaka'})} · Bangladesh time</span></div>{data.previousDayOpen>0&&<p className="simple-notice">{data.previousDayOpen} counter(s) still have an earlier business day open. Their live figures appear on the counter cards; totals above cover {data.date} only.</p>}<section className="overview-metrics" aria-label="Combined business-day totals">{metrics.map(m=><article className="panel overview-metric" key={m.label}><div><span>{m.label}</span><m.icon size={18}/></div><strong>{taka(m.value)}</strong><small>{m.help}</small></article>)}</section><PaymentBreakdown methods={data.methods} totals={data.byMethod}/><CounterCards counters={data.counters}/><footer className="overview-footer"><p>Sales include finalised unpaid bills. Opening float is separate from sales; platform receivables are separate from collections.</p><Link href="/reports">Sales & closing reports →</Link></footer></div>}</div>;
}
