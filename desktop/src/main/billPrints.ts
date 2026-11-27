/* ── Explicit tablet customer copies reuse the first-copy identity of automatic printing. ── */
import type {DatabaseSync} from 'node:sqlite';import type {Snapshot} from '../../shared/desktop/contracts';import type {Order} from '../../shared/types/workspace';
export interface CustomerPrint{_id:string;counterId:string;targetDeviceId:string;epoch:number;at:string;initial:boolean;order:Order;}
export class BillPrints{
 constructor(private db:DatabaseSync){db.exec('CREATE TABLE IF NOT EXISTS customer_print_requests(id TEXT PRIMARY KEY,json TEXT NOT NULL)');}
 receive(s:Snapshot,job:CustomerPrint){if(job.counterId!==s.catalog.counter.id||job.targetDeviceId!==s.catalog.deviceId||job.epoch!==s.catalog.epoch||(job.order.simpleCounterId||'main')!==job.counterId)throw Error('Customer copy belongs to another Counter PC.');if(this.db.prepare('SELECT id FROM customer_print_requests WHERE id=?').get(job._id))return {duplicate:true};
  if(job.order.status==='Cancelled'||job.order.bookingState==='booking')throw Error('Choose a confirmed bill.');
  const first=job.initial&&job.order.salesChannel!=='foodpanda'&&job.order.handoffPrintId,id=first?(s.catalog.mode==='assistant'?'assistant-':'')+first+':bill':'manual-'+job._id+':bill',cleared=this.db.prepare("SELECT value FROM meta WHERE key='printQueueClearedAt'").get(),skip=cleared&&Date.parse(job.at)<=Date.parse(JSON.parse(String(cleared.value)));
  this.db.prepare('INSERT INTO customer_print_requests VALUES(?,?)').run(job._id,JSON.stringify(job));this.db.prepare('INSERT OR IGNORE INTO prints VALUES(?,?,?,?,?,?,?)').run(id,job.order.id,JSON.stringify(job.order),'bill',skip?'cancelled':'queued',skip?'Print queue cleared before this saved request arrived.':null,job.at);return {duplicate:false};
 }
}
