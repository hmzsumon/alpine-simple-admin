/* Shared, deterministic order-only engine. A helper never receives drawer or payment authority. */
import type {Catalog,DesktopCommand} from './contracts';import type {CashDay} from '../types/simpleCash';import {applyCommand} from './core';import {ApiError} from '../utils/ApiError';import {isRecord} from '../utils/authValidation';import {cents} from '../utils/simpleCash';
export interface AssistantOrderPermit {catalog:Catalog;dayId:string;openedAt:string;approvalAt:string;primaryLease:string;sessionVersion:number;}
export function readAssistantOrderPermit(grant:string):AssistantOrderPermit {try{const [body,signature,extra]=grant.split('.');if(!body||!signature||extra||grant.length>400000)throw Error();return JSON.parse(Buffer.from(body,'base64url').toString('utf8'));}catch{throw new ApiError(400,'Connect this second PC to prepare offline orders.');}}
export function prepareAssistantOrder(permit:AssistantOrderPermit,event:DesktopCommand){
 const c=permit.catalog;if(c.mode!=='assistant'||event.action!=='create'||event.orderId)throw new ApiError(403,'This PC can save orders only. Collect payment on the main PC.');if(!isRecord(event.data)||!Number.isSafeInteger(event.sequence)||event.sequence<1)throw new ApiError(400,'Invalid saved order.');
 for(const key of ['localWaiter','payments','allocations','discountCents','tenderedCash','action'])if(event.data[key]!==undefined)throw new ApiError(403,'This PC can save orders only. Collect payment on the main PC.');
 const day:CashDay={id:permit.dayId,counterId:c.counter.id,counterCode:c.counter.code,counterName:c.counter.name,openedAt:permit.openedAt,openedBy:c.user.name,openingCents:0,openingCustodianId:c.user.id,openingCustodianName:c.user.name,custodianId:c.user.id,custodianName:c.user.name,sequence:0,orderSequence:0,movements:[],handovers:[],commands:[]};
 const discount=event.data.discount===undefined?0:cents(event.data.discount);if(discount>0&&!c.orderEntryDiscount)throw new ApiError(403,'This cashier cannot apply an order discount.');
 /* The signed discount capability applies only to create; payment commands remain forbidden. */
 const catalog={...c,user:{...c.user,permissions:[...new Set([...c.user.permissions,'cash:operate' as const,...(c.orderEntryDiscount?['payments:collect' as const]:[])])]}};
 const next=applyCommand({catalog,grant:'',day,orders:[],lastSequence:event.sequence-1,serverTime:event.at},event),order=next.orders[0];
 order.id='AS-'+event.id;order.simpleBillNo='O-'+permit.dayId.replace(/-/g,'')+'-'+c.counter.code+'-'+c.deviceId.slice(0,8)+'-'+event.sequence;order.enteredBy=c.user.id;order.enteredByName=c.user.name;order.handoffPrintId=event.id;order.handoffPrintClaim={by:c.user.id,at:event.at,deviceId:c.deviceId};
 if(order.orderType==='takeaway')order.parcelToken=(order.salesChannel==='foodpanda'?'FP-':'P-')+c.deviceId.slice(0,8)+'-'+event.sequence;return order;
}
