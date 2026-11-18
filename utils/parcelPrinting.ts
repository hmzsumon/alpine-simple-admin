/* ── Tea matching uses item names, never the category shared with coffee ── */
interface TeaItem {name:string;nameBn?:string;quantity:number;}
interface ParcelOrder {orderType?:string;salesChannel?:string;items:TeaItem[];}
export function isTeaItem(item:TeaItem):boolean{return item.quantity>0&&(/(?:^|[^a-z])tea(?:$|[^a-z])/i.test(item.name)||/(?:^|[\s(])চা(?:$|[\s),])/u.test(item.nameBn||item.name));}
export function hasParcelTea(order:ParcelOrder):boolean{return order.salesChannel!=='foodpanda'&&(order.orderType==='takeaway'||order.salesChannel==='takeaway')&&order.items.some(isTeaItem);}
