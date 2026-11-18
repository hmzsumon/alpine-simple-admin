/* ────────── pure financial rules: sales, physical cash and platform receivables never mix ────────── */
import {ApiError} from "./ApiError";
import type {Order} from "../types/workspace";
import type {Allocation,CashDay,CashMethod,CashMovement,CashHandover} from "../types/simpleCash";
export const today=()=>new Date(Date.now()+21600000).toISOString().slice(0,10);
export function cents(value:unknown,allowZero=true):number {
  if((typeof value!=="number"&&typeof value!=="string")||!/^\d+(?:\.\d{1,2})?$/.test(String(value))||!Number.isFinite(Number(value)))throw new ApiError(400,"টাকার পরিমাণ দিন, সর্বোচ্চ দুই দশমিক পর্যন্ত।");
  const n=Math.round(Number(value)*100);if(!Number.isSafeInteger(n)||n>10000000000||n<(allowZero?0:1))throw new ApiError(400,"টাকার পরিমাণ সঠিক নয়।");return n;
}
export const grossBillCents=(o:Order)=>o.items.reduce((s,l)=>s+cents(l.price)*l.quantity,0)+cents(o.packingCharge||0);
export const billCents=(o:Order)=>Math.max(0,grossBillCents(o)-(o.discountCents||0));
export const paidCents=(o:Order)=>(o.payments||[]).reduce((s,p)=>s+p.totalCents,0);
export const dueCents=(o:Order)=>Math.max(0,billCents(o)-paidCents(o));
export function dayReport(day:CashDay,orders:Order[]) {
  const valid=orders.filter(o=>o.simpleDayId===day.id&&(o.simpleCounterId||"main")===(day.counterId||"main")&&o.status!=="Cancelled"&&o.bookingState!=="booking");
  const allocations=valid.flatMap(o=>(o.payments||[]).flatMap(p=>p.allocations));
  const byMethod=[...new Set(allocations.map(a=>a.methodId))].map(id=>{const rows=allocations.filter(a=>a.methodId===id);return {id,name:rows[0].name,kind:rows[0].kind,cents:rows.reduce((s,a)=>s+a.cents,0)};});
  const cashReceived=allocations.filter(a=>a.kind==="cash").reduce((s,a)=>s+a.cents,0),digitalReceived=allocations.filter(a=>a.kind!=="cash"&&a.kind!=="platform").reduce((s,a)=>s+a.cents,0),platformReceivable=allocations.filter(a=>a.kind==="platform").reduce((s,a)=>s+a.cents,0);
  const cashIn=day.movements.filter(m=>m.kind==="in").reduce((s,m)=>s+m.cents,0),cashOut=day.movements.filter(m=>m.kind==="out").reduce((s,m)=>s+m.cents,0),handoverDifference=day.handovers.filter(h=>h.acceptedAt).reduce((s,h)=>s+h.differenceCents,0);
  const bookCash=day.openingCents+cashReceived+cashIn-cashOut,expectedCash=bookCash+handoverDifference;
  const sales=valid.reduce((s,o)=>s+billCents(o),0),due=valid.reduce((s,o)=>s+dueCents(o),0);
  return {sales,discounts:valid.reduce((s,o)=>s+(o.discountCents||0),0),orders:valid.length,cancelled:orders.filter(o=>o.simpleDayId===day.id&&(o.simpleCounterId||"main")===(day.counterId||"main")&&o.status==="Cancelled").length,cashReceived,digitalReceived,platformReceivable,cashIn,cashOut,bookCash,handoverDifference,expectedCash,due,byMethod,channels:["dine_in","takeaway","foodpanda"].map(channel=>({channel,orders:valid.filter(o=>(o.salesChannel||o.orderType||"dine_in")===channel).length,cents:valid.filter(o=>(o.salesChannel||o.orderType||"dine_in")===channel).reduce((s,o)=>s+billCents(o),0)})),closingDifference:day.differenceCents??null,totalDifference:day.closedAt?handoverDifference+(day.differenceCents||0):null};
}
export function text(value:unknown,name:string,max=200) {if(typeof value!=="string"||!value.trim()||value.trim().length>max)throw new ApiError(400,name+" লিখুন।");return value.trim();}
export function paymentAllocations(value:unknown,methods:CashMethod[],remaining:number):Allocation[] {
  if(!Array.isArray(value)||!value.length||value.length>10)throw new ApiError(400,"পেমেন্ট মাধ্যম ও পরিমাণ দিন।");
  const rows=value.map(v=>{const method=methods.find(m=>m.id===v?.methodId&&m.active&&!m.deleted);if(!method)throw new ApiError(409,"পেমেন্ট মাধ্যম বন্ধ বা পাওয়া যাচ্ছে না।");return {methodId:method.id,name:method.name,kind:method.kind,cents:cents(v.amount,false)};});
  if(new Set(rows.map(a=>a.methodId)).size!==rows.length)throw new ApiError(400,"একই মাধ্যম একবার দিন।");
  if(rows.reduce((s,a)=>s+a.cents,0)>remaining)throw new ApiError(409,"বিলের বাকি টাকার বেশি নেওয়া যাবে না।");return rows;
}
export function canOperate(day:CashDay,user:{id:string}) {if(day.closedAt)throw new ApiError(409,"দিন বন্ধ হয়েছে।");if(day.custodianId!==user.id)throw new ApiError(403,"এখন ক্যাশের দায়িত্ব আপনার নয়। হস্তান্তরের মাধ্যমে দায়িত্ব নিন।");if(day.pending)throw new ApiError(409,"ক্যাশ হস্তান্তর গ্রহণ বা বাতিল না হওয়া পর্যন্ত লেনদেন বন্ধ।");}
export function movement(day:CashDay,orders:Order[],input:Record<string,unknown>,actor:{id:string;name:string},id:string,at:string):CashMovement {
  canOperate(day,actor);if(!["in","out"].includes(String(input.kind)))throw new ApiError(400,"টাকা দেওয়া না জমা বাছুন।");const amount=cents(input.amount,false),before=dayReport(day,orders).expectedCash;
  if(input.kind==="out"&&amount>before)throw new ApiError(409,"ক্যাশে থাকা টাকার বেশি দেওয়া যাবে না।");
  return {id,no:`${input.kind==="out"?"OUT":"IN"}-${day.id.replace(/-/g,"")}-${String(day.sequence+1).padStart(4,"0")}`,kind:input.kind as "in"|"out",cents:amount,party:text(input.party,"প্রাপক / জমাদাতার নাম",100),purpose:text(input.purpose,"কারণ",100),note:typeof input.note==="string"?input.note.slice(0,300):"",at,by:actor.id,byName:actor.name,balanceAfterCents:before+(input.kind==="out"?-amount:amount)};
}
export function acceptHandover(day:CashDay,actorId:string,at:string) {
  const handover=day.pending;if(!handover||handover.toId!==actorId)throw new ApiError(403,"হস্তান্তরটি আপনার জন্য নয়।");
  return {...day,custodianId:handover.toId,custodianName:handover.toName,pending:undefined,handovers:[...day.handovers,{...handover,acceptedAt:at}]};
}
export function closeDay(day:CashDay,orders:Order[],counted:unknown,reason:unknown,actor:{id:string;name:string},at:string) {
  canOperate(day,actor);if(orders.some(o=>o.simpleDayId===day.id&&(o.simpleCounterId||"main")===(day.counterId||"main")&&o.bookingState==="booking"&&o.status!=="Cancelled"))throw new ApiError(409,"Finalize or cancel all bookings before closing.");const report=dayReport(day,orders);if(report.due>0)throw new ApiError(409,"বাকি বিল মেটান। ভুল অর্ডার হলে বাতিল করুন। তারপর দিন বন্ধ করুন।");
  const amount=cents(counted),difference=amount-report.expectedCash;
  return {...day,closedAt:at,closedBy:actor.name,countedCents:amount,differenceCents:difference,closeReason:difference?text(reason,"ঘাটতি / বাড়তির কারণ",300):typeof reason==="string"?reason.slice(0,300):""};
}

