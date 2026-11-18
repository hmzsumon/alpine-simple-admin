"use client";
import Link from "next/link";
import {useCashCounter} from "@/hooks/useCashCounter";
import {useAdminContext} from "@/context/AdminContext";
import CashSummary from "@/components/cash/CashSummary";
import CashNotice from "@/components/cash/CashNotice";
import "@/components/cash/simple-cash.css";
function CashierOverview(){const cash=useCashCounter(),{data}=useAdminContext();return <div><div className="simple-top"><div><span className="simple-badge">ALPINE SIMPLE · Separate local edition</span><h2>Today's simple overview</h2><p>Take orders → Collect bills → Reconcile cash and close the day.</p></div></div><div className="simple-report-links"><Link className="primary" href="/cash">Cash counter</Link><Link className="secondary" href="/orders">Orders and bills</Link><Link className="secondary" href="/reports">Previous day reports</Link><Link className="secondary" href="/guide">How to use</Link></div><CashNotice counter={cash}/>{cash.data?.day?<><div className="simple-day"><strong>{cash.data.day.id} · Day open</strong><span>Cashier: {cash.data.day.custodianName}</span></div><CashSummary data={cash.data}/></>:<p className="info-note">No day is open. Open the Cash counter with the starting petty cash.</p>}<section className="panel simple-section"><h3>Current activity</h3><div className="simple-kpis-inline"><span>Unpaid bills: <strong>{data.orders.filter(o=>!["Paid","Cancelled"].includes(o.status)).length}items</strong></span><span>Available menu items: <strong>{data.menu.filter(m=>m.active&&m.price!==null).length}items</strong></span></div><p className="muted">Table, parcel and manually entered Foodpanda bills reach the same cash counter.</p></section></div>;}

import {useAuth} from '@/providers/AuthProvider';
import OwnerOverview from './OwnerOverview';
export default function OverviewDashboard(){const {user}=useAuth();return user.role==='owner'||user.role==='admin'?<OwnerOverview/>:<CashierOverview/>;}
