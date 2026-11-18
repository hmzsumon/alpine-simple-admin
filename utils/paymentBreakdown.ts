/* ── Include configured zero-sale methods and retain historical payment snapshots ── */
import type {CashMethod,DayReport} from '@/types/simpleCash';
export function paymentBreakdown(methods:CashMethod[],totals:DayReport['byMethod']){
 const rows=new Map(totals.map(m=>[m.id,{...m}]));
 for(const m of methods)if(m.active&&!m.deleted&&!rows.has(m.id))rows.set(m.id,{id:m.id,name:m.name,kind:m.kind,cents:0});
 const order={cash:0,mobile:1,bank:2,platform:3};
 return [...rows.values()].sort((a,b)=>order[a.kind]-order[b.kind]||a.name.localeCompare(b.name));
}
