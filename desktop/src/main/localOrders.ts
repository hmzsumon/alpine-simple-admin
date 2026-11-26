/* ── LAN bookings and confirmed bills share the desktop money engine ── */
import {kitchenContent} from '../../shared/utils/stationTickets';
import type {Snapshot,DesktopCommand} from '../../shared/desktop/contracts';
import type {AuthUser} from '../../shared/types/auth';
import type {Order} from '../../shared/types/workspace';
import {canSetOrderPrice} from '../../shared/utils/orderPricing';
import {applyCommand,fingerprint} from '../../shared/desktop/core';
export interface LocalActor {user:AuthUser;counterId:string;deviceId:string;leaseId?:string;epoch:number;issuedAt:string;expiresAt:string;ticket:string;demo?:boolean;}
export function requireLocalActor(s:Snapshot,a:LocalActor,now:number){
 if(!a||a.counterId!==s.catalog.counter.id||a.deviceId!==s.catalog.deviceId||a.leaseId!==s.catalog.leaseId||a.epoch!==s.catalog.epoch||!a.user.permissions.includes('orders:create')||!s.catalog.waiters.some(w=>w.id===a.user.id)||now>Date.parse(a.expiresAt)||now>Date.parse(s.catalog.expiresAt))throw Error('Local pairing expired or changed. Sign in and connect again.');
}
export function localBootstrap(s:Snapshot,a:LocalActor,bookings:Order[]){
 requireLocalActor(s,a,Date.now());const orders=[...bookings,...s.orders.filter(o=>o.createdBy===a.user.id)];
 return {user:a.user,orderEpoch:s.catalog.epoch,counter:s.catalog.counter,cashDayOpen:!!s.day&&!s.day.closedAt,tableSelectionRequired:true,menu:s.catalog.menu.filter(m=>m.active&&(m.price!==null||canSetOrderPrice(m))).map(m=>({...m,price:m.price??0})),unavailableMenu:s.catalog.menu.filter(m=>!m.active),stockSummary:{},stationDispatch:s.catalog.stationDispatch,kitchens:s.catalog.kitchens||[],halls:s.catalog.halls.filter(h=>h.counterId===s.catalog.counter.id).map(h=>({...h,operatingCounterId:h.counterId})),orders:orders.map(order=>({...order,kitchenContentHash:kitchenContent(order)})),tables:s.catalog.tables.filter(t=>s.catalog.halls.some(h=>h.id===t.hallId&&h.counterId===s.catalog.counter.id)).map(t=>{const h=s.catalog.halls.find(h=>h.id===t.hallId),open=orders.filter(o=>o.table===t.id&&!['Paid','Cancelled'].includes(o.status));return {...t,hallName:h?.name,counterId:s.catalog.counter.id,counterName:s.catalog.counter.name,counterOpen:!!s.day&&!s.day.closedAt,occupied:!!open.length,openBillCount:open.length,orders:open.map(o=>({id:o.id,waiter:o.waiter,status:o.status,simpleBillNo:o.simpleBillNo,total:o.items.reduce((n,l)=>n+l.price*l.quantity,0)}))};})};
}
export function prepareLocalOrder(s:Snapshot,a:LocalActor,body:any,old:Order|undefined,existingId:string|undefined,at:string,eventId:string){
 requireLocalActor(s,a,Date.parse(at));
 if(!body||!/^[a-f0-9-]{36}$/i.test(body.requestId)||body.orderEpoch!==s.catalog.epoch)throw Error('Invalid request or old restaurant data. Refresh the menu.');
 if(existingId&&(!old||old.createdBy!==a.user.id||old.bookingState!=='booking'||old.status==='Cancelled'))throw Error('Only your own open local booking can be changed. Use the cashier for confirmed bills.');
 if(old&&(body.bookingRevision!==old.bookingRevision||body.table!==old.table||body.salesChannel!==old.salesChannel))throw Error('Booking changed. Refresh and open it again.');
 const channel=body.salesChannel||body.orderType||'dine_in';if(channel!=='dine_in'&&!a.user.permissions.includes('orders:parcel'))throw Error('Parcel permission required.');
 if(channel!=='dine_in'&&(a.user.counterId||'main')!==s.catalog.counter.id&&!a.demo)throw Error('Connect to the parcel waiter’s assigned counter.');
 if(body.counterId!==s.catalog.counter.id)throw Error('This order belongs to another counter.');
 const data={...body,...(old?{kitchenOrderId:old.kitchenOrderId||old.id}:{}),salesChannel:channel,waiterId:a.user.id,localWaiter:a.demo?'DEMO-NO-SERVER':a.ticket};
 const event:DesktopCommand={protocol:1,id:eventId,sequence:s.lastSequence+1,deviceId:s.catalog.deviceId,counterId:s.catalog.counter.id,catalogId:s.catalog.id,epoch:s.catalog.epoch,at,action:'create',data};
 const next=applyCommand(s,event),order=next.orders.find(o=>o.id==='DS-'+eventId)!;
 order.note=typeof body.note==='string'?body.note.slice(0,1000):'';
 if(old&&kitchenContent(old)===kitchenContent(order)){order.kitchenVersion=old.kitchenVersion;event.data.localKitchenVersion=old.kitchenVersion;}
 const final=body.finalize===true||body.booking!==true;
 if(body.cancelBooking===true&&!old)throw Error('Choose your own booking to delete.');
 if(!final||body.cancelBooking===true){
  const booking:Order={...order,id:old?.id||'LB-'+eventId,bookingState:'booking',bookingRevision:(old?.bookingRevision||0)+1,createdAt:old?.createdAt||at,simpleBillNo:old?.simpleBillNo||'LOCAL BOOKING',handoffPrintId:undefined,handoffPrintClaim:undefined,...(body.cancelBooking===true?{status:'Cancelled'}:{})};
  return {receipt:{order:booking,tickets:[],duplicate:false,local:true},booking};
 }
 order.bookingState='final';return {receipt:{order,tickets:[],duplicate:false,local:true},event,next};
}
export const localPayloadHash=(path:string,body:unknown)=>fingerprint({path,body});
