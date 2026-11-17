/* ── Bill and customer token are separate driver documents; never repeat a payment ── */
import {notify} from "@/lib/feedback";
type Part="bill"|"token";
interface Job {orderId:string;jobId:string;confirmationId?:string;first:Part;key:string;}
const jobs=new Map<string,Job>(),queue:Job[]=[];let active=false;
function pump(){if(active)return;const job=queue.shift();if(!job)return;active=true;run(job,job.first);}
function run(job:Job,part:Part){
 const frame=document.createElement("iframe");frame.title=part==="token"?"Customer parcel token printing":"Customer bill printing";frame.setAttribute("aria-hidden","true");frame.tabIndex=-1;
 Object.assign(frame.style,{position:"fixed",left:"-10000px",top:"0",width:"80mm",height:"1000px",border:"0"});let settled=false;
 const cleanup=()=>{window.removeEventListener("message",message);clearTimeout(timeout);frame.remove();};
 const finish=(token=false)=>{if(settled)return;settled=true;cleanup();if(token){setTimeout(()=>run(job,"token"),0);return;}jobs.delete(job.key);active=false;pump();};
 const fail=(text:string)=>{notify(text,"error");finish();};
 const message=(event:MessageEvent)=>{
  if(event.origin!==window.location.origin||event.source!==frame.contentWindow||event.data?.type!=="alpine:bill-print"||event.data.jobId!==job.jobId||(event.data.part||"bill")!==part)return;
  if(event.data.status==="started")return;
  if(event.data.status==="error"){fail("The payment is saved. Printing could not start. Use Reprint bill or Token only; do not collect payment again.");return;}
  if(event.data.status==="finished"||event.data.status==="skipped")finish(part==="bill"&&event.data.hasToken===true);
 };
 const timeout=setTimeout(()=>fail("Printing could not be verified. Check the printer before requesting another copy."),120000);
 window.addEventListener("message",message);
 frame.onload=()=>{try{if(!frame.contentDocument?.querySelector(".bill-receipt"))fail("The saved print document is unavailable. Sign in again or use Bill preview / print.");}catch{fail("The bill could not be opened for printing.");}};
 frame.onerror=()=>fail("The print document could not load. Use Reprint bill or Token only.");
 frame.src=`/bill/${encodeURIComponent(job.orderId)}?printJob=${encodeURIComponent(job.jobId)}&part=${part}${job.confirmationId?"&payment="+encodeURIComponent(job.confirmationId):""}`;
 document.body.appendChild(frame);
}
export function printBill(orderId:string,confirmationId?:string,first:Part="bill",printKey?:string){
 if(typeof window==="undefined")return;const jobId=printKey||confirmationId||crypto.randomUUID(),key=orderId+":"+jobId;
 if(jobs.has(key))return;const job={orderId,jobId,confirmationId,first,key};jobs.set(key,job);queue.push(job);pump();
}
export function printConfirmedPayment(body:{action?:unknown;orderId?:unknown},result:{ok?:boolean;kind?:string;ref?:string}){if(body.action==="pay"&&result.ok&&result.kind==="pay"&&typeof body.orderId==="string"&&result.ref)printBill(body.orderId,result.ref);}
