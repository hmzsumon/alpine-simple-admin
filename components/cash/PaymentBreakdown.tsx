/* ── Collections and platform receivables remain separate from drawer cash ── */
import {Banknote,Smartphone,Landmark,Truck} from 'lucide-react';
import type {CashMethod,DayReport} from '@/types/simpleCash';
import {paymentBreakdown} from '@/utils/paymentBreakdown';
import {taka} from '@/utils/cashFormat';
const labels={cash:'Cash',mobile:'Mobile banking',bank:'Bank / card',platform:'Platform receivable'};
const icons={cash:Banknote,mobile:Smartphone,bank:Landmark,platform:Truck};
export default function PaymentBreakdown({methods,totals}:{methods:CashMethod[];totals:DayReport['byMethod']}){
 const rows=paymentBreakdown(methods,totals),received=rows.filter(m=>m.kind!=='platform').reduce((s,m)=>s+m.cents,0),receivable=rows.filter(m=>m.kind==='platform').reduce((s,m)=>s+m.cents,0);
 return <section className="panel payment-breakdown"><header><div><h3>Payment methods</h3><p>Net collections after recorded refunds. Each method is shown separately.</p></div><span className="cash-section-chip">{rows.length} methods</span></header><div className="payment-method-grid">{rows.map(m=>{const Icon=icons[m.kind];return <article className={'payment-method-card method-'+m.kind} key={m.id}><span className="payment-method-icon"><Icon size={19}/></span><div><span>{m.name}</span><small>{labels[m.kind]}</small></div><strong>{taka(m.cents)}</strong></article>;})}</div>{!rows.length&&<p className="muted">No payment methods have been configured.</p>}<footer><span>Collected <strong>{taka(received)}</strong></span><span>Platform receivable <strong>{taka(receivable)}</strong></span></footer></section>;
}
