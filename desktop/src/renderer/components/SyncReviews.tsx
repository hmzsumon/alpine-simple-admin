/* ── A compact, separate list keeps rejected money visible without stopping service. ── */
import React from 'react';
import type {State} from '../model';
import {money,bill} from '../helpers';
export function SyncReviews({state}:{state:State}){
 const rows=state.syncReviews||[],pending=rows.filter(row=>row.status==='pending');if(!rows.length)return null;
 return <section className="panel sync-review-list"><h2>Sync reviews {pending.length>0&&<span className="pill unpaid">{pending.length} pending</span>}</h2><p className="muted">Other orders and payments remain available. Rejected transactions are saved separately and are not included in confirmed server totals. Admin: Counter setup → Sync reviews.</p>{rows.slice(0,50).map(row=><details key={row.id}><summary><b>{row.order?.parcelToken||row.order?.simpleBillNo||row.orderId}</b> · {row.action} · {row.status}{row.order&&<> · {money(bill(row.order))}</>}</summary><p>{row.reason}</p>{row.awaitingServer&&<p>Saved on this PC. Reconnect to the updated server to submit the review and remaining sales.</p>}{row.externalOrderId&&<p>Foodpanda reference: <b>{row.externalOrderId}</b></p>}{row.order?.items.map((item,index)=><p key={index}>{item.quantity} × {item.name} · {money(Math.round(item.price*100)*item.quantity)}</p>)}{!!row.order?.payments?.length&&<p>Saved local payment evidence is retained here. Admin must check it against the server bill before collecting again.</p>}{row.resolution&&<p>{row.resolvedBy}: {row.resolution}</p>}</details>)}</section>;
}
