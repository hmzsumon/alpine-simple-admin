/* ── Print confirmed receipts in a separate document; never repeat a payment ── */
import {notify} from "@/lib/feedback";
const jobs=new Map<string,HTMLIFrameElement>();
export function printBill(orderId:string,confirmationId?:string){
 if(typeof window==="undefined")return;
 const jobId=confirmationId||crypto.randomUUID(),key=orderId+":"+jobId;if(jobs.has(key))return;
 const frame=document.createElement("iframe");frame.title="Customer bill printing";frame.setAttribute("aria-hidden","true");frame.tabIndex=-1;Object.assign(frame.style,{position:"fixed",left:"-10000px",top:"0",width:"80mm",height:"1000px",border:"0"});jobs.set(key,frame);
 const cleanup=()=>{window.removeEventListener("message",message);clearTimeout(timeout);jobs.delete(key);frame.remove();};
 const message=(event:MessageEvent)=>{if(event.origin!==window.location.origin||event.source!==frame.contentWindow||event.data?.type!=="alpine:bill-print"||event.data.jobId!==jobId)return;if(event.data.status==="error")notify("Payment is saved. Printing could not start. Use Reprint bill; do not collect the payment again.","error");if(event.data.status!=="started")setTimeout(cleanup,1000);};
 const timeout=setTimeout(()=>{notify("The print request could not be verified. Check the printer, then use Reprint bill if needed.","error");cleanup();},120000);
 window.addEventListener("message",message);
 frame.onload=()=>{try{if(!frame.contentDocument?.querySelector(".bill-receipt")){notify("The saved bill is unavailable for printing. Sign in again or use Bill preview / print.","error");cleanup();}}catch{notify("Bill could not be opened for printing.","error");cleanup();}};
 frame.onerror=()=>{notify("Bill could not load for printing. Use Reprint bill.","error");cleanup();};
 frame.src=`/bill/${encodeURIComponent(orderId)}?printJob=${encodeURIComponent(jobId)}${confirmationId?"&payment="+encodeURIComponent(confirmationId):""}`;document.body.appendChild(frame);
}
export function printConfirmedPayment(body:{action?:unknown;orderId?:unknown},result:{ok?:boolean;kind?:string;ref?:string}){if(body.action==="pay"&&result.ok&&result.kind==="pay"&&typeof body.orderId==="string"&&result.ref)printBill(body.orderId,result.ref);}
