/* ── Kitchen slips are only for parcel orders containing tea; never infer tea from a category shared with coffee ── */
interface ParcelOrder {orderType?:string;salesChannel?:string;items:{name:string;nameBn?:string;quantity:number}[];}
export function hasParcelTea(order:ParcelOrder):boolean{return (order.orderType==='takeaway'||order.salesChannel==='takeaway'||order.salesChannel==='foodpanda')&&order.items.some(item=>item.quantity>0&&(/(?:^|[^a-z])tea(?:$|[^a-z])/i.test(item.name)||/(?:^|[\s(])চা(?:$|[\s),])/u.test(item.nameBn||item.name)));}
