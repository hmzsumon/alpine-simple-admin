/* ────────── deterministic counter lines: exact codes, integer units and paisa totals ────────── */
import type {MenuItem} from "@/types";
import {normalizeItemCode} from "./menuSearch";
export interface CounterLine {menuId:string;code:string;name:string;category:string;quantity:number;price:number;}
export function counterItemByCode(menu:MenuItem[],input:string){const code=normalizeItemCode(input);return menu.find(m=>m.active&&m.price!==null&&normalizeItemCode(m.code||"")===code&&!!code);}
export function addCounterLine(lines:CounterLine[],item:MenuItem,quantity:number):CounterLine[]{
 if(!item.active||item.price===null)throw Error("This item is unavailable.");if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw Error("Quantity must be a whole number from 1 to 99.");const old=lines.find(l=>l.menuId===item.id);if(old&&old.quantity+quantity>99)throw Error("One item can have at most 99 units. Edit its quantity below.");if(!old&&lines.length>=80)throw Error("One order can contain at most 80 different items.");return old?lines.map(l=>l.menuId===item.id?{...l,quantity:l.quantity+quantity}:l):[...lines,{menuId:item.id,code:item.code||"",name:item.name,category:item.category,quantity,price:item.price}];
}
export const counterTotal=(lines:CounterLine[])=>lines.reduce((sum,l)=>sum+Math.round(l.price*100)*l.quantity,0)/100;
