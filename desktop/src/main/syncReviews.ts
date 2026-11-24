/* ── Move a rejected command into durable review storage only with a matching server receipt. ── */
import type {DatabaseSync} from 'node:sqlite';
import type {DesktopCommand,Snapshot,SyncReviewSummary} from '../../shared/desktop/contracts';
import type {Order} from '../../shared/types/workspace';
import {fingerprint} from '../../shared/desktop/core';
import {isIsolatableConflict} from '../../shared/desktop/reviewRules';
export interface LocalSyncReview extends SyncReviewSummary {order?:Order;awaitingServer?:boolean;}
export class SyncReviews {
 constructor(private db:DatabaseSync,private current:()=>Snapshot|undefined,private save:(snapshot:Snapshot)=>void,private origin:()=>string){db.exec('CREATE TABLE IF NOT EXISTS sync_reviews(id TEXT PRIMARY KEY,json TEXT NOT NULL)');}
 private scope(s:Snapshot){return fingerprint([this.origin(),s.catalog.counter.id,s.catalog.epoch]);}
 blockingError(){const rows=this.db.prepare('SELECT json,error FROM outbox WHERE error IS NOT NULL ORDER BY seq').all();return String(rows.find(row=>!isIsolatableConflict(JSON.parse(String(row.json)),String(row.error)))?.error||'');}
 list():LocalSyncReview[]{const s=this.current();if(!s)return [];const scope=this.scope(s),local=this.db.prepare('SELECT json FROM sync_reviews ORDER BY rowid DESC').all().map(row=>JSON.parse(String(row.json))).filter(row=>row.scope===scope);const summaries=new Map((s.syncReviews||[]).map(row=>[row.id,row]));const saved:LocalSyncReview[]=[...local.map(row=>{const summary=summaries.get(row.summary.id)||row.summary;summaries.delete(row.summary.id);return {...summary,order:row.order};}),...summaries.values()];
  for(const row of this.db.prepare('SELECT json,error FROM outbox WHERE error IS NOT NULL ORDER BY seq').all()){const event=JSON.parse(String(row.json)) as DesktopCommand;if(!isIsolatableConflict(event,String(row.error))||saved.some(review=>review.id===event.id))continue;const orderId=event.action==='create'?'DS-'+event.id:String(event.orderId||'');saved.push({id:event.id,orderId,counterId:event.counterId,counterName:s.catalog.counter.name,userName:s.catalog.user.name,epoch:event.epoch,sequence:event.sequence,action:event.action,reason:String(row.error),at:event.at,status:'pending',externalOrderId:typeof event.data.externalOrderId==='string'?event.data.externalOrderId:undefined,order:s.orders.find(order=>order.id===orderId),awaitingServer:true});}return saved;}
 needsReview(orderId:string){return this.list().some(row=>row.status==='pending'&&row.orderId===orderId);}
 acknowledge(event:DesktopCommand,grant:string,review:SyncReviewSummary,currentOrder:Order|null){
  const s=this.current(),orderId=event.action==='create'?'DS-'+event.id:event.orderId;
  if(!s||review.id!==event.id||review.sequence!==event.sequence||review.action!==event.action||review.orderId!==orderId||review.counterId!==event.counterId||review.epoch!==event.epoch||!['create','pay','edit','cancel','correct'].includes(event.action)||!['pending','dismissed','restored'].includes(review.status)||typeof review.reason!=='string'||(currentOrder!==null&&(!currentOrder||currentOrder.id!==orderId||(currentOrder.simpleCounterId||'main')!==event.counterId)))throw Error('Server review receipt does not match the saved bill.');
  const order=s.orders.find(row=>row.id===orderId)||this.list().find(row=>row.orderId===orderId&&row.order)?.order;
  this.db.prepare('INSERT INTO sync_reviews VALUES(?,?)').run(event.id,JSON.stringify({scope:this.scope(s),summary:review,event,grant,order}));
  // Financial totals use the server's bill; the rejected local version remains in review evidence.
  s.orders=s.orders.filter(row=>row.id!==orderId);if(currentOrder)s.orders.unshift(currentOrder);
  if(event.action==='create'&&!currentOrder&&s.day)s.day.orderSequence=Math.max(0,s.day.orderSequence-1);
  s.syncReviews=[...(s.syncReviews||[]).filter(row=>row.id!==review.id),review];this.save(s);
  this.db.prepare("UPDATE prints SET status='reviewed',error='This bill needs sync review. Check the saved review before printing again.' WHERE order_id=? AND status IN ('queued','failed')").run(orderId!);
 }
}
