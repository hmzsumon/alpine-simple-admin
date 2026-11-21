/* ── Audited revisions retain original collections; refunds are signed allocations ── */
import {createHash,randomUUID} from 'node:crypto';
import type {Order,MenuItem} from '../types/workspace';
import type {AuthUser} from '../types/auth';
import {ApiError} from './ApiError';
import {isRecord} from './authValidation';
import {canSetOrderPrice} from './orderPricing';
import {billCents,cents,grossBillCents,paidCents,text} from './simpleCash';
export const orderFingerprint=(order:Order)=>createHash('sha256').update(JSON.stringify(order)).digest('hex');
export function adjustOrder(original:Order,input:Record<string,unknown>,menu:MenuItem[],actor:AuthUser,at:string,cancel=false,ids?:{adjustment:string;refund:string}):Order{
 if(original.status==='Cancelled'||original.bookingState==='booking')throw new ApiError(409,'Only a submitted, non-cancelled order can be changed.');
 if(input.fingerprint!==orderFingerprint(original))throw new ApiError(409,'This bill changed. Reopen its latest details before editing.');
 const reason=text(input.reason,'Reason',300),order=structuredClone(original);
 if((order.adjustments?.length||0)>=200)throw new ApiError(409,'Order revision limit reached.');
 if(!cancel){
  if(!Array.isArray(input.items)||!input.items.length||input.items.length>80)throw new ApiError(400,'Keep at least one item, or cancel the order.');
  const seen=new Set<number>();
  order.items=input.items.map(value=>{
   if(!isRecord(value)||typeof value.menuId!=='string'||!Number.isInteger(value.quantity)||Number(value.quantity)<1||Number(value.quantity)>99)throw new ApiError(400,'Enter valid items and quantities (1–99).');
   let old:Order['items'][number]|undefined;
   if(value.lineIndex!==undefined){if(!Number.isInteger(value.lineIndex)||seen.has(Number(value.lineIndex)))throw new ApiError(400,'Invalid original item reference.');seen.add(Number(value.lineIndex));old=original.items[Number(value.lineIndex)];if(!old||old.menuId!==value.menuId)throw new ApiError(409,'Original item changed.');}
   const item=menu.find(m=>m.id===value.menuId);
   if(!old&&(!item?.active||(item.price===null&&!canSetOrderPrice(item))))throw new ApiError(409,'Selected item is unavailable.');
   const adjustable=canSetOrderPrice({category:old?.category||item?.category,name:old?.name||item?.name,nameBn:old?.nameBn||item?.nameBn});
   if(value.unitPrice!==undefined&&!adjustable)throw new ApiError(403,'Only Fish and items ending in Dish / ডিশ prices can be overridden.');
   const price=value.unitPrice!==undefined?cents(value.unitPrice,false)/100:old?.price??item?.price;
   if(price===null||price===undefined)throw new ApiError(400,'Enter this item’s price.');cents(price);
   return {...(old||{menuId:item!.id,name:item!.name,nameBn:item!.nameBn,station:item!.station,category:item!.category,fulfillment:original.orderType==="takeaway"?"parcel" as const:"dine_in" as const}),quantity:Number(value.quantity),price,...(value.unitPrice!==undefined?{unitPrice:price,priceSetBy:actor.id,priceSetByName:actor.name}:{})};
  });
  order.discountCents=input.discount===undefined?original.discountCents||0:cents(input.discount);
  if(order.discountCents>grossBillCents(order))throw new ApiError(400,'Discount cannot exceed the revised bill.');
 }
 const target=cancel?0:billCents(order),paid=paidCents(original),refund=Math.max(0,paid-target);
 const allocations=(original.payments||[]).flatMap(p=>p.allocations),balances=new Map<string,number>();
 for(const a of allocations)balances.set(a.methodId,(balances.get(a.methodId)||0)+a.cents);
 if(input.refunds!==undefined&&!Array.isArray(input.refunds))throw new ApiError(400,'Enter refund methods.');
 const values=(input.refunds||[]) as unknown[];if(values.length>10)throw new ApiError(400,'Too many refund methods.');const used=new Set<string>();
 const returns=values.map(v=>{if(!isRecord(v)||typeof v.methodId!=='string'||used.has(v.methodId))throw new ApiError(400,'Enter unique refund methods.');used.add(v.methodId);const amount=cents(v.amount,false),old=allocations.find(a=>a.methodId===v.methodId);if(!old||amount>(balances.get(v.methodId)||0))throw new ApiError(400,'Refund exceeds the amount collected through this method.');return {...old,cents:-amount};});
 if(-returns.reduce((s,a)=>s+a.cents,0)!==refund)throw new ApiError(400,'Confirm refund methods for exactly '+(refund/100).toFixed(2)+' BDT.');
 if(refund){if(input.refundConfirmed!==true)throw new ApiError(400,'Confirm the customer refund before saving.');order.payments=[...(order.payments||[]),{id:ids?.refund||randomUUID(),at,by:actor.id,byName:actor.name,allocations:returns,totalCents:-refund,refund:true,reason}];}
 order.adjustments=[...(original.adjustments||[]),{id:ids?.adjustment||randomUUID(),at,by:actor.id,byName:actor.name,reason,cancel,refundedCents:refund,before:{items:original.items,discountCents:original.discountCents||0,status:original.status},after:{items:order.items,discountCents:order.discountCents||0,totalCents:target}}];
 if(cancel){order.status='Cancelled';order.cancelReason=reason;order.paymentStatus='unpaid';}
 else if(paidCents(order)>=target){order.status='Paid';order.paymentStatus='paid';}
 else{order.status='New';order.paymentStatus='unpaid';order.paidAt=undefined;order.paidBy=undefined;order.deliveredAt=undefined;}
 if(order.discountCents!==(original.discountCents||0)){order.discountBy=actor.id;order.discountByName=actor.name;order.discountAt=at;}
 return order;
}
