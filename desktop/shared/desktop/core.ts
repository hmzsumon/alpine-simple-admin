/* ── Deterministic, shared money rules: accepted writes never wait for the network ── */
import {kitchenContent} from '../utils/stationTickets';
import {createHash} from 'node:crypto';
import type {Snapshot,DesktopCommand} from './contracts';
import type {Order} from '../types/workspace';
import {ApiError} from '../utils/ApiError';
import {billCents,cents,dueCents,grossBillCents,paidCents,paymentAllocations,canOperate,dayReport,movement,closeDay,text} from '../utils/simpleCash';
import {adjustOrder} from '../utils/orderAdjustment';
import {correctPaymentMethod} from '../utils/paymentCorrection';
import {isRecord} from '../utils/authValidation';
import {canSetOrderPrice} from '../utils/orderPricing';
import {isOrderQuantity} from '../utils/orderQuantity';
import type {AuthUser} from '../types/auth';
export const canonical=(value:unknown):string=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':isRecord(value)?'{'+Object.keys(value).filter(k=>value[k]!==undefined&&k!=='_id').sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value)??'null';
export const fingerprint=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');
// Printer acknowledgements must not make an otherwise unchanged bill stale.
export const billFingerprint=(order:Order|undefined)=>order?fingerprint({...order,kitchenVersion:undefined,handoffPrintClaim:undefined,handoffPrintId:undefined}):fingerprint(order);
const legacyPrintFingerprint=(order:Order)=>fingerprint({...order,handoffPrintClaim:undefined,handoffPrintId:undefined});
export const businessDate=(at:string)=>new Date(Date.parse(at)+21600000).toISOString().slice(0,10);
export function applyCommand(original:Snapshot,event:DesktopCommand,operator?:AuthUser):Snapshot {
 const state=JSON.parse(JSON.stringify(original)) as Snapshot,c=state.catalog,user=operator||c.user,body=event.data,at=event.at;
 const need=(p:string)=>{if(!user.permissions.includes(p as never)||!c.user.permissions.includes(p as never))throw new ApiError(403,'Permission required: '+p);};
 if(operator&&(!event.operatorPermit||!['create','pay','edit','cancel','correct'].includes(event.action)))throw new ApiError(403,'Switch to the responsible cashier for cash-day or custody changes.');
 if(event.protocol!==1||!/^[-a-f0-9]{36}$/i.test(event.id)||event.deviceId!==c.deviceId||event.counterId!==c.counter.id||event.epoch!==c.epoch||event.catalogId!==c.id||event.sequence!==state.lastSequence+1||!isRecord(body)||!Number.isFinite(Date.parse(at)))throw new ApiError(409,'Invalid or out-of-sequence desktop command.');
 if(Date.parse(at)<Date.parse(c.issuedAt)-300000||Date.parse(at)>Date.parse(c.expiresAt))throw new ApiError(401,'This offline session has expired. Connect and sign in again.');
 need('cash:operate');let day=state.day;
 if(event.action==='open'){
  if(day&&!day.closedAt)throw new ApiError(409,'Close the current cash day first.');if(day?.closedAt&&day.id===businessDate(at))throw new ApiError(409,'This cash day is already closed.');
  if(state.orders.some(o=>o.bookingState!=='booking'&&!['Paid','Cancelled'].includes(o.status)))throw new ApiError(409,'Settle previous orders before opening a day.');
  day={id:businessDate(at),counterId:c.counter.id,counterName:c.counter.name,counterCode:c.counter.code,openedAt:at,openedBy:user.name,openingCents:cents(body.amount),openingCustodianId:user.id,openingCustodianName:user.name,custodianId:user.id,custodianName:user.name,sequence:0,orderSequence:0,movements:[],handovers:[],commands:[]};state.orders=[];
 }else{
  if(!day)throw new ApiError(409,'Open the cash day first.');canOperate(day,c.user);
  if(event.action==='create'){
   need('orders:create');if(state.orders.length>=5000)throw new ApiError(409,'Close the day before accepting more orders.');
   const channel=body.salesChannel;if(!['dine_in','takeaway','foodpanda'].includes(String(channel)))throw new ApiError(400,'Select an order channel.');if(channel!=='dine_in')need('orders:parcel');
   const table=c.tables.find(t=>t.id===body.table),hall=c.halls.find(h=>h.id===table?.hallId);if(channel==='dine_in'&&(!table||!hall||hall.counterId!==c.counter.id))throw new ApiError(400,'Select a valid hall and table.');
   const waiter=body.waiterId?c.waiters.find(w=>w.id===body.waiterId):undefined;if(body.waiterId&&!waiter)throw new ApiError(400,'Select an available waiter.');
   if(!Array.isArray(body.items)||!body.items.length||body.items.length>80)throw new ApiError(400,'Select 1–80 items.');
   const items:Order['items']=body.items.map(v=>{
    if(!isRecord(v)||!isOrderQuantity(v.quantity))throw new ApiError(400,'Quantity must be a positive whole number.');
    const item=c.menu.find(m=>m.id===v.menuId&&m.active);if(!item)throw new ApiError(409,'Selected item is unavailable.');
    if(v.unitPrice!==undefined&&!canSetOrderPrice(item))throw new ApiError(403,'Only Fish and items ending in Dish / ডিশ prices can be overridden.');
    if(body.localWaiter&&v.unitPrice===undefined&&v.expectedPrice!==undefined&&v.expectedPrice!==item.price)throw new ApiError(409,'Menu price changed. Refresh before sending.');
    if(v.fulfillment!==undefined&&!['dine_in','parcel'].includes(String(v.fulfillment)))throw new ApiError(400,'Select a valid serving type.');
    const price=v.unitPrice!==undefined?cents(v.unitPrice,false)/100:item.price;if(price===null)throw new ApiError(400,'Enter this item’s price for this order.');cents(price);
    return {...(item.kitchenCopy===undefined?{}:{kitchenCopy:item.kitchenCopy}),menuId:item.id,name:item.name,nameBn:item.nameBn,category:item.category,station:item.station,quantity:Number(v.quantity),price,fulfillment:channel==='dine_in'?(v.fulfillment==='parcel'?'parcel':'dine_in'):'parcel',...(typeof v.note==='string'?{note:v.note.slice(0,200)}:{}),...(v.unitPrice!==undefined?{unitPrice:price,priceSetBy:body.localWaiter&&waiter?waiter.id:user.id,priceSetByName:body.localWaiter&&waiter?waiter.name:user.name}:{})};
   });
   const packing=cents(body.packingCharge||0);if(packing>1000000)throw new ApiError(400,'Packing charge is too high.');
   const external:string|undefined=undefined;

   const seq=String(event.sequence).padStart(5,'0'),prefix='D-'+day.id.replace(/-/g,'')+'-'+c.counter.code+'-'+c.deviceId.slice(0,6)+'-'+seq;
   const order:Order={...(c.stationDispatch?{kitchenVersion:body.localWaiter&&typeof body.localKitchenVersion==='string'&&/^[a-f0-9-]{36}$/i.test(body.localKitchenVersion)?body.localKitchenVersion:event.id}:{}),...(body.localWaiter&&typeof body.kitchenOrderId==='string'&&/^LB-[a-f0-9-]{36}$/i.test(body.kitchenOrderId)?{kitchenOrderId:body.kitchenOrderId}:{}),adjustments:[],id:'DS-'+event.id,table:channel==='dine_in'?table!.id:'PARCEL',...(channel==='dine_in'?{hallId:hall!.id,hallName:hall!.name,tableName:table!.name,floorName:table!.floor}:{}),createdBy:waiter?.id||user.id,waiter:waiter?.name||user.name,...(waiter?{enteredBy:user.id,enteredByName:user.name}:{}),createdAt:at,finalizedAt:at,status:'New',paymentStatus:'unpaid',salesChannel:channel as Order['salesChannel'],orderType:channel==='dine_in'?'dine_in':'takeaway',externalOrderId:external,packingCharge:packing/100,customerName:typeof body.customerName==='string'?body.customerName.trim().slice(0,100):'',customerPhone:typeof body.customerPhone==='string'?body.customerPhone.trim().slice(0,30):'',items,payments:[],simpleDayId:day.id,simpleCounterId:c.counter.id,simpleCounterName:c.counter.name,simpleBillNo:prefix,...(channel!=='dine_in'?{parcelToken:(channel==='foodpanda'?'FP-':'P-')+c.deviceId.slice(0,4)+'-'+seq}:{}),handoffPrintId:event.id,handoffPrintClaim:{by:user.id,at,deviceId:c.deviceId}};
   if(body.localWaiter){if(!waiter)throw new ApiError(403,'Local waiter is unavailable.');order.bookingState='final';order.note=typeof body.note==='string'?body.note.slice(0,1000):'';}
   const gross=grossBillCents(order),discount=body.discount===undefined?0:cents(body.discount);
   if(discount){if(body.localWaiter)throw new ApiError(403,'Only the cashier can apply an order discount.');need('payments:collect');if(!c.orderEntryDiscount)throw new ApiError(409,'Update the restaurant server and sync before applying an order discount.');if(discount>gross)throw new ApiError(400,'Discount cannot exceed the bill total.');order.discountCents=discount;order.discountBy=user.id;order.discountByName=user.name;order.discountAt=at;if(discount===gross){order.status='Paid';order.paymentStatus='paid';order.paidAt=at;order.paidBy=user.id;order.deliveredAt=at;}}
   state.orders.unshift(order);day.orderSequence++;
  }else if(['pay','edit','cancel','correct'].includes(event.action)){
   const i=state.orders.findIndex(o=>o.id===event.orderId&&o.simpleDayId===day!.id&&(o.simpleCounterId||'main')===c.counter.id);if(i<0)throw new ApiError(404,'Bill not found in this cash day.');let o=state.orders[i];
   const oldLines={...o,items:o.items.map(({kitchenCopy,...line})=>line)};
   if(![billFingerprint(o),billFingerprint(oldLines),legacyPrintFingerprint(o),legacyPrintFingerprint(oldLines)].includes(String(event.before)))throw new ApiError(409,'This bill changed on another device. Keep the local transaction and resolve it before syncing.');
   if(o.bookingState==='booking'||o.status==='Cancelled')throw new ApiError(409,'Only confirmed, non-cancelled bills can be changed.');
   if(event.action==='pay'){
    need('payments:collect');if(!dueCents(o))throw new ApiError(409,'Bill is already paid.');
    const discount=body.discount===undefined?o.discountCents||0:cents(body.discount);if(o.payments?.length&&discount!==(o.discountCents||0))throw new ApiError(409,'Discount is locked after the first payment.');if(discount>grossBillCents(o))throw new ApiError(400,'Discount exceeds the bill total.');
    if(discount!==(o.discountCents||0)){o.discountCents=discount;o.discountBy=user.id;o.discountByName=user.name;o.discountAt=at;}
    const due=dueCents(o),allocations=due===0?[]:paymentAllocations(body.allocations,c.methods,due);if(!due&&Array.isArray(body.allocations)&&body.allocations.length)throw new ApiError(400,'Do not collect a fully discounted bill.');
    if(allocations.some(a=>a.kind==='platform')&&o.salesChannel!=='foodpanda')throw new ApiError(400,'Use Foodpanda receivable only for Foodpanda.');
    const cash=allocations.filter(a=>a.kind==='cash').reduce((n,a)=>n+a.cents,0),tender=body.tenderedCash===undefined?undefined:cents(body.tenderedCash);if(tender!==undefined&&(!cash||tender<cash))throw new ApiError(400,'Check the cash received.');
    const amount=allocations.reduce((n,a)=>n+a.cents,0);o.payments=[...(o.payments||[]),{id:event.id,at,by:user.id,byName:user.name,allocations,totalCents:amount,...(tender===undefined?{}:{tenderedCashCents:tender,changeCents:tender-cash})}];
    if(amount===due){o.status='Paid';o.paymentStatus='paid';o.paidAt=at;o.paidBy=user.id;o.deliveredAt=at;}
   }else if(event.action==='correct'){
    need('payments:collect');o=correctPaymentMethod(o,{...body,fingerprint:requireFingerprint(o)},c.methods,user,at,event.id);
   }else{
    need(event.action==='edit'?'orders:update':'orders:cancel');const previousKitchen=kitchenContent(o);o=adjustOrder(o,{...body,fingerprint:requireFingerprint(o)},c.menu,user,at,event.action==='cancel',{adjustment:event.id,refund:event.id});if(c.stationDispatch&&kitchenContent(o)!==previousKitchen)o.kitchenVersion=event.id;
   }
   state.orders[i]=o;if(dayReport(day,state.orders).expectedCash<0)throw new ApiError(409,'Not enough cash for this refund or correction.');
  }else if(event.action==='movement'){
   const m=movement(day,state.orders,body,user,event.id,at);m.no=(m.kind==='in'?'IN-':'OUT-')+day.id.replace(/-/g,'')+'-'+c.deviceId.slice(0,6)+'-'+event.sequence;day.movements.push(m);day.sequence++;
  }else if(event.action==='close'){
   day=closeDay(day,state.orders,body.amount,body.reason,user,at);
  }else throw new ApiError(400,'Unsupported desktop action.');
 }
 state.day=day;state.lastSequence=event.sequence;state.lastHash=fingerprint(event);return state;
}
// Existing audited adjustment helpers use their original byte-level fingerprint internally.
import {orderFingerprint as requireFingerprint} from '../utils/orderAdjustment';
export {billCents,dueCents,paidCents,dayReport,cents};
