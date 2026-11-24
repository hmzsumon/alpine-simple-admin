/* ── Counter-only drafts; never enter sales, the outbox or the print queue ── */
import type {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import type {Snapshot} from '../../shared/desktop/contracts';
import {canSetOrderPrice} from '../../shared/utils/orderPricing';
interface DraftLine {menuId:string;quantity:number;unitPrice?:number;}
interface DraftData {salesChannel:'dine_in';waiterId:string;table:string;items:DraftLine[];packingCharge:string;discount?:string;customerName:string;customerPhone:string;namedDraftId?:string;namedDraftRevision?:number;}
export interface WaiterDraft {id:string;revision:number;updatedAt:string;data:DraftData;}
export class WaiterDrafts {
 constructor(private db:DatabaseSync,private context:()=>{scope:string;snapshot:Snapshot}){db.exec('CREATE TABLE IF NOT EXISTS waiter_drafts(id TEXT PRIMARY KEY,scope TEXT NOT NULL,json TEXT NOT NULL)');}
 private current(){const c=this.context();if(Date.now()>Date.parse(c.snapshot.catalog.expiresAt))throw Error('Sign in again before changing drafts.');return c;}
 private record(id:string,scope:string):WaiterDraft{const row=this.db.prepare('SELECT json FROM waiter_drafts WHERE id=? AND scope=?').get(id,scope);if(!row)throw Error('This draft was already saved as an order or deleted. Refresh the draft list.');return JSON.parse(String(row.json));}
 list(waiterId?:string){const {scope,snapshot}=this.current();return this.db.prepare('SELECT json FROM waiter_drafts WHERE scope=? ORDER BY rowid DESC').all(scope).map(r=>JSON.parse(String(r.json)) as WaiterDraft).filter(r=>(!waiterId||r.data.waiterId===waiterId)&&snapshot.catalog.waiters.some(w=>w.id===r.data.waiterId));}
 load(id:string){const {scope}=this.current(),row=this.record(id,scope);return {...row.data,namedDraftId:row.id,namedDraftRevision:row.revision};}
 save(value:DraftData){
  const {scope,snapshot:s}=this.current(),c=s.catalog;
  if(!value||value.salesChannel!=='dine_in'||!c.waiters.some(w=>w.id===value.waiterId))throw Error('Select a waiter to save this draft.');
  const table=c.tables.find(t=>t.id===value.table);if(!table||!c.halls.some(h=>h.id===table.hallId&&h.counterId===c.counter.id))throw Error('Select a table for this counter.');
  if(!Array.isArray(value.items)||!value.items.length||value.items.length>80)throw Error('Add 1–80 items before saving a draft.');
  const items=value.items.map(l=>{const m=c.menu.find(i=>i.id===l.menuId&&i.active);if(!m||!Number.isSafeInteger(l.quantity)||l.quantity<1)throw Error('Check draft items and quantities.');if(l.unitPrice!==undefined&&(!canSetOrderPrice(m)||!Number.isFinite(l.unitPrice)||l.unitPrice<=0||l.unitPrice>1000000||Math.abs(l.unitPrice*100-Math.round(l.unitPrice*100))>0.000001))throw Error('Check the price entered for this order.');return {menuId:l.menuId,quantity:l.quantity,...(l.unitPrice===undefined?{}:{unitPrice:l.unitPrice})};});
  const previous=value.namedDraftId?this.record(value.namedDraftId,scope):undefined;
  if(previous&&(previous.revision!==value.namedDraftRevision||previous.data.waiterId!==value.waiterId))throw Error('This draft changed in another window. Reopen its latest version.');
  if(!previous&&this.list().length>=500)throw Error('Finish or delete old drafts before saving more.');
  const packing=String(value.packingCharge||'0');if(!/^\d+(?:\.\d{1,2})?$/.test(packing)||Number(packing)>10000)throw Error('Check the packing charge.');
  const discount=String(value.discount||'0'),gross=items.reduce((sum,line)=>sum+Math.round((line.unitPrice??c.menu.find(item=>item.id===line.menuId)?.price??0)*100)*line.quantity,Math.round(Number(packing)*100));if(!/^\d+(?:\.\d{1,2})?$/.test(discount)||!Number.isSafeInteger(Math.round(Number(discount)*100))||Number(discount)>100000000||Math.round(Number(discount)*100)>gross)throw Error('Discount cannot exceed the bill total and must have up to two decimals.');if(Number(discount)>0&&(!c.orderEntryDiscount||c.mode!=='assistant'&&!c.user.permissions.includes('payments:collect')))throw Error('Connect the updated server before applying an order discount.');
  const row:WaiterDraft={id:previous?.id||randomUUID(),revision:(previous?.revision||0)+1,updatedAt:new Date().toISOString(),data:{salesChannel:'dine_in',waiterId:value.waiterId,table:value.table,items,packingCharge:packing,discount,customerName:String(value.customerName||'').slice(0,100),customerPhone:String(value.customerPhone||'').slice(0,30)}};
  this.db.prepare('INSERT INTO waiter_drafts VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').run(row.id,scope,JSON.stringify(row));return row;
 }
 remove(id:string,revision:number){const {scope}=this.current();if(!this.db.prepare('SELECT id FROM waiter_drafts WHERE id=? AND scope=?').get(id,scope))return;const row=this.record(id,scope);if(row.revision!==revision)throw Error('This draft changed. Reopen its latest version.');this.db.prepare('DELETE FROM waiter_drafts WHERE id=? AND scope=?').run(id,scope);}
 consume(value:Record<string,unknown>){if(!value.namedDraftId)return;const {scope}=this.current(),row=this.record(String(value.namedDraftId),scope);if(row.revision!==value.namedDraftRevision||row.data.waiterId!==value.waiterId||value.salesChannel!=='dine_in')throw Error('This draft changed in another window. Reopen its latest version.');this.remove(row.id,row.revision);}
}
