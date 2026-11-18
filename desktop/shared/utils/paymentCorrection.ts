/* ── Corrections append a balanced ledger entry; original money receipts and bill state stay intact ── */
import {randomUUID} from 'node:crypto';
import type {Order} from '../types/workspace';
import type {CashMethod} from '../types/simpleCash';
import type {AuthUser} from '../types/auth';
import {ApiError} from './ApiError';
import {orderFingerprint} from './orderAdjustment';
import {cents,text} from './simpleCash';
import {paymentMethodBalances} from './paymentBalances';
export function correctPaymentMethod(original:Order,input:Record<string,unknown>,methods:CashMethod[],actor:AuthUser,at:string,id?:string):Order{
 if(original.status==='Cancelled'||original.bookingState==='booking')throw new ApiError(409,'Only a finalised, non-cancelled bill can have its payment method corrected.');
 if(input.fingerprint!==orderFingerprint(original))throw new ApiError(409,'This bill changed. Reload the latest payment details before correcting it.');
 const reason=text(input.reason,'Correction reason',300);if(reason.length<3)throw new ApiError(400,'Enter a correction reason of at least 3 characters.');
 if(input.confirmed!==true)throw new ApiError(400,'Confirm that you checked the actual customer payment.');
 if((original.payments||[]).filter(p=>p.correction).length>=100)throw new ApiError(409,'Payment correction limit reached.');
 const source=paymentMethodBalances(original.payments||[]).find(a=>a.methodId===input.fromMethodId&&a.kind===input.fromKind),target=methods.find(m=>m.id===input.toMethodId&&m.active&&!m.deleted);
 if(!source)throw new ApiError(409,'The selected method has no remaining collection to correct.');
 if(!target)throw new ApiError(409,'Select an active replacement payment method.');
 if(source.methodId===target.id)throw new ApiError(400,'Choose a different payment method.');
 if(target.kind==='platform'&&original.salesChannel!=='foodpanda')throw new ApiError(403,'Platform receivables are only allowed for Foodpanda bills.');
 const amount=cents(input.amount,false);if(amount>source.cents)throw new ApiError(400,'Correction exceeds the amount currently recorded under the original method.');
 const from={methodId:source.methodId,name:source.name,kind:source.kind},to={methodId:target.id,name:target.name,kind:target.kind};
 const order=structuredClone(original);order.payments=[...(order.payments||[]),{id:id||randomUUID(),at,by:actor.id,byName:actor.name,reason,totalCents:0,correction:{from,to,cents:amount},allocations:[{...from,cents:-amount},{...to,cents:amount}]}];
 return order;
}
