import {isFishCategory} from "./fishPricing";
/* ────────── deterministic counter lines: exact codes, integer units and paisa totals ────────── */
import type {MenuItem} from "@/types";
import {normalizeItemCode} from "./menuSearch";
export interface CounterLine {unitPrice?:number;menuId:string;code:string;name:string;category:string;quantity:number;price:number;}
export function counterItemByCode(menu:MenuItem[],input:string){const code=normalizeItemCode(input);return menu.find(m=>m.active&&m.price!==null&&normalizeItemCode(m.code||"")===code&&!!code);}
export function addCounterLine(lines:CounterLine[],item:MenuItem,quantity:number):CounterLine[]{
 if(!item.active||(item.price===null&&!isFishCategory(item.category)))throw Error("This item is unavailable.");if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw Error("Quantity must be a whole number from 1 to 99.");const old=lines.find(l=>l.menuId===item.id);if(old&&old.quantity+quantity>99)throw Error("One item can have at most 99 units. Edit its quantity below.");if(!old&&lines.length>=80)throw Error("One order can contain at most 80 different items.");return old?lines.map(l=>l.menuId===item.id?{...l,quantity:l.quantity+quantity}:l):[...lines,{menuId:item.id,code:item.code||"",name:item.name,category:item.category,quantity,price:item.price??0}];
}
export const counterTotal=(lines:CounterLine[])=>lines.reduce((sum,l)=>sum+Math.round(l.price*100)*l.quantity,0)/100;

/* Existing counter IDs keep their initial floor until an owner edits the mapping. */
export function counterFloor(counter?:{id:string;floor?:string}){return counter?.floor??(counter?.id==="main"?"Ground floor":counter?.id==="second-floor"?"Second floor":"");}
export function tablesForCounter<T extends {floor:string}>(tables:T[],counter?:{id:string;floor?:string}):T[]{const floor=counterFloor(counter).trim().toLowerCase();return floor?tables.filter(t=>t.floor.trim().toLowerCase()===floor):tables;}
