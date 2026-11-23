/* ── Counter order entry: hall follows the drawer; searchable tables and staff ── */
import React,{useEffect,useRef,useState} from 'react';
import type {Snapshot} from '../../../shared/desktop/contracts';import type {EntryLine} from '../model';
import {WaiterDraftList,type SavedWaiterDraft} from './WaiterDraftList';
import {notify} from './Notifications';
import {api,money,number} from '../helpers';import {counterOptions} from '../orderOptions';
import {ItemPicker} from './ItemPicker';import {LineTable} from './LineTable';import {SearchSelect} from './SearchSelect';import {SaveShortcut} from './SaveShortcut';
export function OrderEntry({snapshot,initial,locked,saveDraft,submit,switchChannel,allowCollection=true,preferredHallId}:{preferredHallId?:string;allowCollection?:boolean;snapshot:Snapshot;initial:any;locked:boolean;saveDraft:(v:any)=>void;switchChannel?:(channel:string)=>void;submit:(v:any,collect?:boolean)=>void}){
 const c=snapshot.catalog,options=counterOptions(c),root=useRef<HTMLElement>(null);const [channel,setChannel]=useState(initial?.salesChannel||'dine_in'),[table,setTable]=useState(initial?.table||''),[waiter,setWaiter]=useState(initial?.waiterId||''),[lines,setLines]=useState<EntryLine[]>(initial?.items||[]),[packing,setPacking]=useState(initial?.packingCharge&&Number(initial.packingCharge)?String(initial.packingCharge):''),[customer,setCustomer]=useState(initial?.customerName||''),[phone,setPhone]=useState(initial?.customerPhone||''),[external,setExternal]=useState(initial?.externalOrderId||''),[error,setError]=useState(''),[hallFilter,setHallFilter]=useState(options.tables.find(t=>t.id===initial?.table)?.hallId||options.halls.find(h=>h.id===preferredHallId)?.id||options.halls[0]?.id||'');
 const [named,setNamed]=useState<{namedDraftId?:string;namedDraftRevision?:number}>({namedDraftId:initial?.namedDraftId,namedDraftRevision:initial?.namedDraftRevision}),[savedDrafts,setSavedDrafts]=useState<SavedWaiterDraft[]>([]),[draftBusy,setDraftBusy]=useState(false);const draftFlight=useRef(false);
 const data={...named,salesChannel:channel,table:channel==='dine_in'?table:undefined,waiterId:channel==='dine_in'?waiter:undefined,items:lines,packingCharge:channel==='foodpanda'?'0':packing.trim()||'0',customerName:channel==='foodpanda'?undefined:customer,customerPhone:channel==='foodpanda'?undefined:phone,externalOrderId:external.trim()};
 useEffect(()=>{saveDraft(lines.length?data:null);},[channel,table,waiter,lines,packing,customer,phone,external,named]);
 const resetEntry=()=>{setHallFilter(options.halls.find(h=>h.id===preferredHallId)?.id||options.halls[0]?.id||'');setLines([]);setTable('');setWaiter('');setPacking('');setCustomer('');setPhone('');setExternal('');setNamed({});setSavedDrafts([]);setError('');saveDraft(null);};
 const restore=async(id:string)=>{const draft=await api('waiterDraftLoad',{id});setNamed({namedDraftId:draft.namedDraftId,namedDraftRevision:draft.namedDraftRevision});setWaiter(draft.waiterId);setTable(draft.table);setHallFilter(options.tables.find(t=>t.id===draft.table)?.hallId||'');setLines(draft.items);setPacking(draft.packingCharge||'');setCustomer(draft.customerName||'');setPhone(draft.customerPhone||'');setSavedDrafts([]);setError('');notify('info','Saved waiter draft opened · review and save the order when ready.');setTimeout(()=>focus('item'),0);};
 const draftAction=async(fn:()=>Promise<void>)=>{if(draftFlight.current||locked)return;draftFlight.current=true;setDraftBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'Could not open draft.');}finally{draftFlight.current=false;setDraftBusy(false);}};
 const chooseWaiter=(id:string)=>{if(lines.length){if(waiter&&id!==waiter){setError('Save or clear the current draft before choosing another waiter.');return;}setWaiter(id);return;}if(!id){setWaiter('');setNamed({});setSavedDrafts([]);return;}void draftAction(async()=>{setWaiter(id);setNamed({});setSavedDrafts([]);const rows=await api<SavedWaiterDraft[]>('waiterDraftList',{waiterId:id});if(rows.length===1)await restore(rows[0].id);else setSavedDrafts(rows);});};
 const parkDraft=()=>void draftAction(async()=>{await api('waiterDraftSave',{data});const name=c.waiters.find(w=>w.id===waiter)?.name;resetEntry();notify('success','Draft saved for '+name+' · select this waiter to reopen.');});
 const clearEntry=()=>{if(!window.confirm(named.namedDraftId?'Delete this saved draft and clear the entry?':'Clear this unsaved draft?'))return;void draftAction(async()=>{if(named.namedDraftId)await api('waiterDraftDelete',{id:named.namedDraftId,revision:named.namedDraftRevision});resetEntry();});};
 const focus=(field:'item'|'table'|'waiter'|'channel')=>{const el=field==='channel'?root.current?.closest('.order-workspace')?.querySelector<HTMLButtonElement>('[role=tab][aria-selected=true]'):root.current?.querySelector<HTMLInputElement>(field==='item'?'.item-search input':field==='table'?'#entry-table':'#entry-waiter');el?.focus();if(el instanceof HTMLInputElement)el.select();};
 useEffect(()=>{if(!locked&&!document.querySelector('[role=dialog]')&&!document.activeElement?.closest('.order-tabs')){const frame=requestAnimationFrame(()=>{if(!document.querySelector('[role=dialog]'))focus('item');});return()=>cancelAnimationFrame(frame);}},[locked]);
 const send=(collect=false)=>{if(locked||draftBusy)return;if(!lines.length){setError('Add an item first.');focus('item');return;}if(channel==='dine_in'&&!options.tables.some(t=>t.id===table)){setError('Choose a table for this counter.');focus('table');return;}if(channel==='dine_in'&&waiter&&!options.waiters.some(w=>w.id===waiter)){setError('Choose an available waiter.');focus('waiter');return;}if(channel==='foodpanda'&&!external.trim()){setError('Enter the Foodpanda reference.');root.current?.querySelector('details')?.setAttribute('open','');root.current?.querySelector<HTMLInputElement>('#entry-external')?.focus();return;}if(channel!=='foodpanda'&&!Number.isFinite(number(packing.trim()||'0'))){setError('Enter a valid packing charge.');return;}setError('');submit(data,allowCollection&&(collect||channel==='foodpanda'));};
 const activeHallFilter=options.halls.some(h=>h.id===hallFilter)?hallFilter:'',selectedTable=options.tables.find(t=>t.id===table),tableContext=channel==='dine_in'?(selectedTable?selectedTable.label:'Table not selected'):channel==='foodpanda'?'Foodpanda':'Parcel';
 const subtotal=lines.reduce((sum,line)=>sum+Math.round((line.unitPrice??c.menu.find(item=>item.id===line.menuId)?.price??0)*100)*line.quantity,0),packingCents=channel==='foodpanda'?0:number(packing)||0,totalQuantity=lines.reduce((sum,line)=>sum+line.quantity,0);
 return <section className="counter-entry" ref={root} aria-label="New order entry">
  <fieldset disabled={locked||draftBusy} className="order-entry-fields">
   <div className={'entry-context '+(channel==='dine_in'?'':'entry-context-parcel')}>
    {channel==='dine_in'?<>
     <SearchSelect label="Waiter" shortcut="F9" inputId="entry-waiter" options={options.waiters} value={waiter} onChange={chooseWaiter} placeholder="Search waiter or choose…" onSelected={()=>focus('table')}/>
     <label className="entry-hall">Hall<select aria-label="Hall" value={activeHallFilter} onChange={event=>{const id=event.target.value;setHallFilter(id);if(id&&selectedTable?.hallId!==id)setTable('');setError('');}}><option value="">All halls</option>{options.halls.map(hall=><option key={hall.id} value={hall.id}>{hall.name}</option>)}</select></label>
     <SearchSelect label="Table" shortcut="F8" inputId="entry-table" options={activeHallFilter?options.tables.filter(item=>item.hallId===activeHallFilter):options.tables} value={table} onChange={value=>{setTable(value);setError('');}} placeholder="Search table number…" onSelected={()=>focus('item')}/>
    </>:<><div className="entry-channel-heading"><strong>{channel==='foodpanda'?'Foodpanda order':'Parcel order'}</strong><small>{channel==='foodpanda'?'Add the platform reference before saving.':'Add items, then save or collect the bill.'}</small></div>{channel==='foodpanda'&&<label>Foodpanda reference<input id="entry-external" required value={external} placeholder="Enter reference number" onChange={event=>{setExternal(event.target.value);setError('');}}/></label>}</>}
   </div>
   {channel==='dine_in'&&!options.tables.length&&<p className="payment-error">No tables are routed to this counter. Ask Admin to check hall routing, then sync.</p>}
   {channel==='dine_in'&&<WaiterDraftList rows={savedDrafts} catalog={c} busy={draftBusy} open={id=>void draftAction(()=>restore(id))} remove={row=>{if(window.confirm('Delete this saved waiter draft?'))void draftAction(async()=>{await api('waiterDraftDelete',{id:row.id,revision:row.revision});setSavedDrafts(rows=>rows.filter(item=>item.id!==row.id));});}}/>}
   {named.namedDraftId&&<div className="entry-draft-notice"><span>Saved draft · {c.waiters.find(item=>item.id===waiter)?.name}</span><button type="button" className="secondary" onClick={()=>{if(window.confirm('Discard entry changes and reopen the latest saved draft?'))void draftAction(()=>restore(named.namedDraftId!));}}>Reload saved draft</button></div>}
   <ItemPicker menu={c.menu} lines={lines} setLines={setLines}/>
   <div className="order-entry-body">
    <section className="entry-lines" aria-label="Order items">
     <div className="entry-list-heading"><h2>Order items</h2><span>{lines.length} {lines.length===1?'item':'items'}</span></div>
     <LineTable lines={lines} menu={c.menu} change={setLines}/>
     <div className="entry-list-footer"><span>Total quantity <strong>{totalQuantity}</strong></span><span>Amounts in BDT · Rate × quantity</span></div>
    </section>
    <section className="entry-summary" aria-label="Bill summary">
     <div className="entry-summary-heading"><h2>Bill summary</h2><span className="bill-state">Unsaved</span></div>
     <p className="entry-summary-context" title={c.counter.name+' · '+tableContext}>{channel==='dine_in'?(c.waiters.find(item=>item.id===waiter)?.name||'Counter sale')+' · ':''}{tableContext}</p>
     <div className="entry-summary-options">
      <div className="entry-summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
      {packingCents!==0&&<div className="entry-summary-row"><span>Packing</span><strong>{money(packingCents)}</strong></div>}
      {channel!=='foodpanda'&&<details className="entry-customer-details"><summary>Customer / parcel details</summary><label>Customer name<input value={customer} onChange={event=>setCustomer(event.target.value)}/></label><label>Mobile<input value={phone} onChange={event=>setPhone(event.target.value)}/></label><label>Packing charge<input placeholder="Optional" inputMode="decimal" onFocus={event=>event.currentTarget.select()} value={packing} onChange={event=>setPacking(event.target.value)}/></label></details>}
      {error&&<p className="payment-error" role="alert">{error}</p>}
     </div>
     <div className="entry-payable" aria-live="polite"><span>Total payable</span><strong>{money(subtotal+packingCents)}</strong></div>
     <div className="entry-save-actions">
      {allowCollection&&channel!=='foodpanda'&&<button type="button" className="primary payment-action" disabled={!lines.length} onClick={()=>send(true)}>Save &amp; collect bill <kbd>F6</kbd></button>}
      <button type="button" className={allowCollection&&channel!=='foodpanda'?'secondary save-order-action':'primary save-order-action'} disabled={!lines.length} onClick={()=>send()}>{channel==='foodpanda'?'Save Foodpanda bill':'Save order · auto print'} <kbd>F5</kbd></button>
      <div className="entry-draft-actions">{channel==='dine_in'&&<button type="button" className="secondary" disabled={!lines.length||!waiter||!table} onClick={parkDraft} title="Keep this bill for the selected waiter without recording a sale">Save draft <kbd>F4</kbd></button>}<button type="button" className="secondary clear-draft" onClick={clearEntry}>Clear draft</button></div>
     </div>
    </section>
   </div>
  </fieldset>
  <p className="keyboard-help"><span><kbd>F1</kbd> Item code</span><span><kbd>F9</kbd> Waiter</span><span><kbd>F8</kbd> Table</span><span><kbd>F7</kbd> Channel</span><span><kbd>Enter</kbd> Select / add</span><span><kbd>Ctrl S</kbd> Draft</span><span>Tab / Shift Tab to move</span></p>
  <SaveShortcut saveDraft={()=>{if(channel==='dine_in')parkDraft();else setError('Waiter drafts are for dine-in orders.');}} submit={collect=>send(collect)} focus={focus}/>
 </section>;
}
