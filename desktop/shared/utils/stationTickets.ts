/* Print-only snapshots never mutate the saved bill or its payment fingerprint. */
import {createHash} from 'node:crypto';
import type {Order,Kitchen,MenuItem} from '../types/workspace';
export const UNASSIGNED_STATION='Unassigned';
export const unassignedStation:Kitchen={id:UNASSIGNED_STATION,name:'স্টেশন ছাড়া',nameBn:'স্টেশন ছাড়া',floor:'—'};
export const stationBengali=(station:Kitchen)=>station.nameBn||(/[\u0980-\u09ff]/.test(station.name)?station.name:({'Main Kitchen':'প্রধান কিচেন',BBQ:'বারবিকিউ',Drinks:'জুস ও পানীয়'} as Record<string,string>)[station.id]||'প্রস্তুতির স্টেশন');
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function kitchenContent(order:Order){return hash([order.waiter,order.note||'',order.items.filter(line=>line.station&&line.station!==UNASSIGNED_STATION).map(line=>[line.menuId,line.station,line.name,line.nameBn||'',line.quantity,line.price,line.fulfillment||'',line.note||''])]);}
export interface StationPrintOrder extends Order{stationTicket:{id:string;stationId:string;name:string;nameBn:string;requestedAt:string;revised:boolean;cancelled?:boolean};}
export interface StationDispatch{id:string;contentHash:string;sourceContentHash?:string;orderId:string;orderKey:string;counterId:string;epoch:number;dayId:string;targetDeviceId:string;at:string;tickets:{id:string;order:StationPrintOrder}[];}
export function makeStationDispatch(order:Order,kitchens:Kitchen[],epoch:number,at:string,targetDeviceId:string,previous?:StationDispatch,menu?:Pick<MenuItem,'id'|'station'>[]):StationDispatch{
 const sourceContentHash=kitchenContent(order);
 // Resolve preparation routing at the explicit send, leaving the saved bill and prices untouched.
 // Unassigned or retired stations are simply skipped; one such item never blocks the others.
 if(menu){const assignments=new Map(menu.map(item=>[item.id,item.station])),valid=new Set(kitchens.filter(station=>station.id!==UNASSIGNED_STATION).map(station=>station.id));order={...order,items:order.items.map(line=>{const station=assignments.has(line.menuId)?assignments.get(line.menuId):line.station;return {...line,station:station&&valid.has(station)?station:UNASSIGNED_STATION};})};}
 const contentHash=kitchenContent(order),orderKey=order.kitchenOrderId||order.id;
 if(previous?.contentHash===contentHash)return previous;
 const id=hash([epoch,order.simpleCounterId||'main',orderKey,contentHash,order.kitchenVersion||'legacy']);
 const stations=[...new Set(order.items.filter(line=>line.station&&line.station!==UNASSIGNED_STATION).map(line=>line.station))];
 const tickets:StationDispatch['tickets']=stations.map(stationId=>{const station=kitchens.find(value=>value.id===stationId)||{id:stationId,name:stationId,floor:''},ticketId='station-'+id+'-'+hash(stationId).slice(0,16);return {id:ticketId,order:{...order,items:order.items.filter(line=>line.station===stationId).map(line=>({...line,kitchenCopy:true})),stationTicket:{id:ticketId,stationId,name:station.name,nameBn:stationBengali(station),requestedAt:at,revised:!!previous}}};});
 for(const old of previous?.tickets||[]){if(stations.includes(old.order.stationTicket.stationId))continue;const stationId=old.order.stationTicket.stationId,ticketId='station-'+id+'-'+hash(stationId).slice(0,16);tickets.push({id:ticketId,order:{...order,items:[],stationTicket:{...old.order.stationTicket,id:ticketId,requestedAt:at,revised:true,cancelled:true}}});}
 return {id,contentHash,sourceContentHash,orderId:order.id,orderKey,counterId:order.simpleCounterId||'main',epoch,dayId:order.simpleDayId||'',targetDeviceId,at,tickets};
}
