/* ── Customer bill, kitchen copy and token are separate driver documents; never repeat a payment ── */
import {notify} from "@/lib/feedback";
type Part="bill"|"kitchen"|"token";
interface Job {orderId:string;jobId:string;confirmationId?:string;first:Part;key:string;automatic:boolean;done:Promise<boolean>;complete:(success:boolean)=>void;}
const jobs=new Map<string,Job>(),queue:Job[]=[];let active=false;
function pump(){if(active)return;const job=queue.shift();if(!job)return;active=true;run(job,job.first);}
function run(job:Job,part:Part){
 const frame=document.createElement("iframe");frame.title=part==="token"?"Customer parcel token printing":part==="kitchen"?"Parcel kitchen copy printing":"Customer bill printing";frame.setAttribute("aria-hidden","true");frame.tabIndex=-1;
 Object.assign(frame.style,{position:"fixed",left:"-10000px",top:"0",width:"80mm",height:"1000px",border:"0"});let settled=false;
 const cleanup=()=>{window.removeEventListener("message",message);clearTimeout(timeout);frame.remove();};
 const finish=(next:Part|null=null,success=true)=>{if(settled)return;settled=true;cleanup();if(next){setTimeout(()=>run(job,next),0);return;}jobs.delete(job.key);job.complete(success);active=false;pump();};
 const fail=(text:string)=>{notify(text,"error");finish(null,false);};
 const message=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==frame.contentWindow||event.data?.type!=="alpine:bill-print"||event.data.jobId!==job.jobId||(event.data.part||"bill")!==part)return;
  if(event.data.status==="started")return;
  if(event.data.status==="error"){fail(job.confirmationId?"The payment is saved. Printing could not start. Use Reprint bill or Token only; do not collect payment again.":"The order is saved. Printing could not start. Use Reprint bill or Token only and check the saved payment status.");return;}
  if(event.data.status==="finished"||event.data.status==="skipped")finish(part==="bill"&&event.data.hasKitchen===true?"kitchen":null);
 };
 const timeout=setTimeout(()=>fail("Printing could not be verified. Check the printer before requesting another copy."),120000);
 window.addEventListener("message",message);
 frame.onload=()=>{try{if(!frame.contentDocument?.querySelector(".bill-receipt"))fail("The saved print document is unavailable. Sign in again or use Bill preview / print.");}catch{fail("The bill could not be opened for printing.");}};
 frame.onerror=()=>fail("The print document could not load. Use Reprint bill or Token only.");
 frame.src=`/bill/${encodeURIComponent(job.orderId)}?printJob=${encodeURIComponent(job.jobId)}&part=${part}${job.confirmationId?"&payment="+encodeURIComponent(job.confirmationId):""}${job.automatic?"&auto=1":""}`;
 document.body.appendChild(frame);
}
export function printBill(orderId:string,confirmationId?:string,first:Part="bill",printKey?:string,automatic=false):Promise<boolean>{
 if(typeof window==="undefined")return Promise.resolve(false);const jobId=printKey||confirmationId||crypto.randomUUID(),key=orderId+":"+jobId;
 const existing=jobs.get(key);if(existing)return existing.done;let complete!:(success:boolean)=>void;const done=new Promise<boolean>(resolve=>{complete=resolve;});const job={orderId,jobId,confirmationId,first,key,automatic,done,complete};jobs.set(key,job);queue.push(job);pump();return done;
}
// Payment confirmation only wakes the existing order queue; it never creates a second copy.
export function printConfirmedPayment(body:{action?:unknown;orderId?:unknown},result:{ok?:boolean;kind?:string;ref?:string}){if(body.action==="pay"&&result.ok&&result.kind==="pay"&&typeof body.orderId==="string"&&result.ref)window.dispatchEvent(new Event("alpine:data-changed"));}
