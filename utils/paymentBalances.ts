/* ── Remaining method balances include refunds and zero-net method corrections ── */
import type {BillPayment,Allocation} from '@/types/simpleCash';
export function paymentMethodBalances(payments:BillPayment[]):Allocation[]{
 const rows=new Map<string,Allocation>();
 for(const p of payments)for(const a of p.allocations){const key=a.methodId+'|'+a.kind,old=rows.get(key);rows.set(key,{...a,cents:(old?.cents||0)+a.cents});}
 return Array.from(rows.values()).filter(a=>a.cents>0);
}
