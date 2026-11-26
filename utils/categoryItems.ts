import type {AppData} from "@/types";
import {canSetOrderPrice} from "@/utils/orderPricing";
export const UNCATEGORIZED="Uncategorized";
export function categoryFromPath(value:string){try{return decodeURIComponent(value);}catch{return value;}}
export const categoryName=(value:unknown)=>typeof value==="string"&&value.trim()?value.trim():UNCATEGORIZED;
export const sameCategory=(left:unknown,right:unknown)=>categoryName(left).toLowerCase()===categoryName(right).toLowerCase();

/* Removing from a category keeps the menu item; bill snapshots retain their saved category. */
export function moveCategoryItems(data:AppData,from:string,to:string,ids:Set<string>):AppData {
  if(!ids.size)throw Error("Select at least one item.");
  if(!to.trim())throw Error("Choose an existing destination category.");
  const target=sameCategory(to,UNCATEGORIZED)?UNCATEGORIZED:[...(data.categories||[]),...data.menu.map(item=>item.category)].find(name=>sameCategory(name,to));
  if(!target)throw Error("Choose an existing destination category.");
  if(sameCategory(from,target))throw Error("Choose a different category.");
  if([...ids].some(id=>!data.menu.some(item=>item.id===id&&sameCategory(item.category,from))))throw Error("The selected items changed. Refresh and select them again.");
  return {...data,menu:data.menu.map(item=>{
    if(!ids.has(item.id))return item;
    const next={...item,category:target};
    if(next.active&&next.price===null&&!canSetOrderPrice(next))throw Error("Set a price for "+item.name+" before moving it out of its price-adjustable category.");
    return next;
  })};
}
