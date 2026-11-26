import React from 'react';
import type {State} from '../model';
import {SendToStations} from './SendToStations';
export function RecentKitchenOrder({state,busy}:{state:State;busy:boolean}){
 const snapshot=state.snapshot,user=state.operator?.id||snapshot?.catalog.user.id;
 const order=snapshot?.orders.find(row=>row.status!=='Cancelled'&&(row.createdBy===user||row.enteredBy===user));
 if(!snapshot?.catalog.stationDispatch||!order)return null;
 return <section className="saved-order-notice" aria-label="সর্বশেষ সেভ করা অর্ডার"><span>সেভ হয়েছে (কিচেনে পাঠানো ঐচ্ছিক): {order.simpleBillNo||order.parcelToken||order.id} · {order.waiter}</span><SendToStations key={order.id} orderId={order.id} sent={!!state.stationSent?.[order.id]} disabled={busy}/></section>;
}
