/* ── Secondary-PC editor exposes item changes, never collections or refunds ── */
import React,{useEffect,useRef,useState} from 'react';
import type {Order} from '../../../shared/types/workspace';
import type {Snapshot} from '../../../shared/desktop/contracts';
import type {EntryLine} from '../model';
import {money} from '../helpers';
import {ItemPicker} from './ItemPicker';import {LineTable} from './LineTable';import {OrderReason,defaultOrderReason} from './OrderReason';
export function UnpaidOrderEditor({order,catalog,busy,submit}:{order:Order;catalog:Snapshot['catalog'];busy:boolean;submit:(value:{items:EntryLine[];reason:string})=>void}){
 const form=useRef<HTMLFormElement>(null),[lines,setLines]=useState<EntryLine[]>(order.items.map((line,index)=>({menuId:line.menuId,quantity:line.quantity,lineIndex:index,...(line.unitPrice!==undefined?{unitPrice:line.unitPrice}:{})}))),[reason,setReason]=useState(defaultOrderReason);
 useEffect(()=>{const key=(event:KeyboardEvent)=>{if(busy||event.repeat||event.isComposing||!['F1','F2'].includes(event.key))return;event.preventDefault();const input=form.current?.querySelector<HTMLInputElement>('.item-search input');input?.focus();input?.select();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[busy]);
 const total=lines.reduce((sum,line)=>sum+Math.round((line.unitPrice??(line.lineIndex!==undefined?order.items[line.lineIndex]?.price:catalog.menu.find(item=>item.id===line.menuId)?.price)??0)*100)*line.quantity,0)+Math.round((order.packingCharge||0)*100)-(order.discountCents||0);
 return <form ref={form} className="unpaid-order-editor" onSubmit={event=>{event.preventDefault();if(!busy&&lines.length&&reason.trim()&&total>=0)submit({items:lines,reason:reason.trim()});}}><p className="muted">Edit items on this unpaid bill. Payments and refunds stay on the main counter.</p><fieldset disabled={busy}><ItemPicker inputId="revision-item-code" menu={catalog.menu} lines={lines} setLines={setLines}/><LineTable lines={lines} menu={catalog.menu} change={setLines} order={order}/><OrderReason value={reason} onChange={setReason}/><div className="revision-footer"><div><small>Revised total</small><strong>{money(total)}</strong></div><button className="primary" disabled={busy||!lines.length||!reason.trim()||total<0}>{busy?'Saving…':'Save item changes'}</button></div></fieldset></form>;
}
