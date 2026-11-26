/* A dedicated preparation copy; parcel tokens and automatic tea slips are retired. */
interface KitchenLine {kitchenCopy?:boolean;quantity:number;price:number;name:string;nameBn?:string;}
export function kitchenItems<T extends KitchenLine>(order:{items:T[]}):T[]{return order.items.filter(line=>line.kitchenCopy===true&&line.quantity>0);}
export const hasKitchenCopy=(order:{items:KitchenLine[]})=>kitchenItems(order).length>0;
export const kitchenTotal=(order:{items:KitchenLine[]})=>kitchenItems(order).reduce((sum,line)=>sum+Math.round(line.price*100)*line.quantity,0);
export const bengaliNumber=(value:number)=>value.toLocaleString('bn-BD',{useGrouping:false});
export const bengaliMoney=(cents:number)=>(cents/100).toLocaleString('bn-BD',{minimumFractionDigits:2,maximumFractionDigits:2});
export const kitchenTime=(value:string)=>new Date(value).toLocaleString('bn-BD',{timeZone:'Asia/Dhaka',hour12:false});
