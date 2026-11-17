/* ── Component: receipt preview and browser printing; never changes payment or order state ── */
"use client";
import LiveDocument from "@/components/ui/LiveDocument";
import PaperSize, {printDocument} from "@/components/cash/PaperSize";
import Link from "next/link";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Order } from "@/types";
import { orderLabel, paidOrder, total } from "@/utils/format";
import "./printable-bill.css";
import {taka,channelName} from "@/utils/cashFormat";
const amount = (value: number) => value.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value: string) => new Date(value).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
export default function PrintableBill({ order, printedBy, previewAt,paper="thermal" }: {paper?:"a4"|"thermal"; order: Order; printedBy: string; previewAt: string }) {
  const router = useRouter();
  const paid = paidOrder(order), cancelled = order.status === "Cancelled";
  const parcel = order.orderType==="takeaway" || order.salesChannel==="takeaway" || order.salesChannel==="foodpanda";
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  return <main className={"bill-preview-page "+(paper==="a4"?"paper-a4":"")}><LiveDocument/><PaperSize paper={paper}/>
    <nav className="bill-preview-toolbar" aria-label="Bill preview">
      <Link href="/orders"><ArrowLeft size={17} />Back to orders</Link>
      <button type="button" onClick={() => router.refresh()}><RefreshCw size={16} />Refresh</button>
      <button type="button" className="bill-print-button" onClick={() => printDocument()}><Printer size={17} />Print</button>{paper==="thermal"&&<button type="button" onClick={()=>printDocument(true)}>Compact PDF</button>}
    </nav>
    <p className="bill-preview-help">{paper==="a4"?"A4 bill preview.":"80mm counter receipt preview."} Choose Print for the printer, or Compact PDF and Save as PDF. Turn off Headers and footers; use 100% scale and the shortest suitable roll paper size. Printing does not change payment status.</p>
    <article className="bill-receipt" aria-label="Customer bill">
      <header><h1>Alpine Restaurant</h1><p>Chowhatta, Sylhet-3100</p><p>Mobile: 01715-19 55 50</p></header>
      <div className="bill-status">{cancelled ? "CANCELLED - not payable" : paid ? "Paid" : "Unpaid bill"}</div>
      <dl className="bill-meta">
        {order.table!=="WALK-IN"&&<div className={order.orderType==="takeaway"?undefined:"bill-meta-wide"}><dt>{order.orderType === "takeaway" ? "Parcel" : order.hallName?"Hall / Table":"Table"}</dt><dd>{orderLabel(order)}</dd></div>}
        <div><dt>Counter</dt><dd>{order.simpleCounterName||"Main counter"}</dd></div><div className="bill-meta-wide"><dt>Invoice</dt><dd>{order.simpleBillNo||order.id}</dd></div>
        <div className="bill-meta-wide"><dt>Date / time</dt><dd>{date(order.createdAt)}</dd></div>
        <div><dt>Type</dt><dd>{channelName(order.salesChannel)}</dd></div>{order.externalOrderId&&<div className="bill-meta-wide"><dt>Foodpanda ref.</dt><dd>{order.externalOrderId}</dd></div>}<div><dt>Waiter</dt><dd>{order.waiter}</dd></div>
        {order.customerName && <div><dt>Customer</dt><dd>{order.customerName}</dd></div>}
        {order.customerPhone && <div><dt>Mobile</dt><dd>{order.customerPhone}</dd></div>}
      </dl>
      <table className="bill-items compact-bill-items"><colgroup><col className="item-name-col"/><col className="item-rate-col"/><col className="item-qty-col"/><col className="item-amount-col"/></colgroup><thead><tr><th>Item</th><th>Rate</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>{order.items.map((item,index)=><tr key={index}><td>{index+1}. {item.name}{item.fulfillment==="parcel"?<small>Parcel</small>:null}</td><td>{amount(item.price)}</td><td>{item.quantity}</td><td>{amount(item.quantity*item.price)}</td></tr>)}</tbody>
      </table>
      <div className="bill-totals"><p><span>Sale total</span><span>{amount(subtotal)}</span></p>
        {!!order.discountCents&&<p><span>Discount</span><span>-{amount(order.discountCents/100)}</span></p>}
        {!!order.packingCharge && <p><span>Packing charge</span><span>{amount(order.packingCharge)}</span></p>}
        <p className="bill-grand-total"><strong>Net payable (BDT)</strong><strong>{amount(total(order))}</strong></p>
      </div>
      {!!order.payments?.length&&<div className="bill-payment">{Array.from(order.payments.reduce((methods,p)=>{for(const a of p.allocations)methods.set(a.name,(methods.get(a.name)||0)+a.cents);return methods;},new Map<string,number>())).map(([name,cents])=><p className="cash-slip-row" key={name}><span>{name}</span><strong>{taka(cents)}</strong></p>)}{order.payments.some(p=>p.tenderedCashCents!==undefined)?<><p className="cash-slip-row"><span>Customer paid (cash)</span><strong>{taka(order.payments.reduce((sum,p)=>sum+(p.tenderedCashCents??p.allocations.filter(a=>a.kind==="cash").reduce((n,a)=>n+a.cents,0)),0))}</strong></p><p className="cash-slip-row"><span>Change returned</span><strong>{taka(order.payments.reduce((sum,p)=>sum+(p.changeCents||0),0))}</strong></p></>:null}</div>}
      {parcel&&!cancelled&&<section className="parcel-token-slip" aria-label="Customer parcel token">
        <p className="parcel-token-heading">ALPINE · CUSTOMER PARCEL TOKEN</p>
        <strong className="parcel-token-number">{order.parcelToken||order.simpleBillNo||order.id}</strong>
        <p className="parcel-token-invoice">{order.simpleBillNo||order.id}</p>
        <p className="parcel-token-context">{order.simpleCounterName||"Main counter"} · {paid?"Paid":"Payment pending"}</p>
      </section>}
    </article>
  </main>;
}
