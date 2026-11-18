/* ── Separate local drafts for dine-in, parcel and Foodpanda; switching never moves items between bills ── */
import React,{useRef,useState} from 'react';
import type {Snapshot} from '../../../shared/desktop/contracts';
import {OrderEntry} from './OrderEntry';
const channels=[{id:'dine_in',name:'Dine-in'},{id:'takeaway',name:'Parcel'},{id:'foodpanda',name:'Foodpanda'}];
export function OrderWorkspace({snapshot,initial,locked,saveDraft,submit}:{snapshot:Snapshot;initial:any;locked:boolean;saveDraft:(value:any)=>void;submit:(value:any,collect?:boolean)=>void}){
 const drafts=useRef<Record<string,any>>(initial?.kind==='order-tabs'?{...initial.channels}:initial?.items?.length?{[initial.salesChannel||'dine_in']:initial}:{});
 const [active,setActive]=useState<string>(initial?.kind==='order-tabs'?initial.activeChannel:initial?.salesChannel||'dine_in'),[,setRevision]=useState(0);
 const persist=(channel:string)=>saveDraft(Object.keys(drafts.current).length?{kind:'order-tabs',activeChannel:channel,channels:{...drafts.current}}:null);
 const choose=(channel:string)=>{if(locked||!channels.some(c=>c.id===channel))return;setActive(channel);persist(channel);};
 return <><div className="order-tabs" role="tablist" aria-label="Order types">{channels.map((channel,index)=>{const count=(drafts.current[channel.id]?.items||[]).reduce((n:number,item:{quantity:number})=>n+item.quantity,0);return <button type="button" role="tab" id={'order-tab-'+channel.id} aria-controls="order-tab-panel" aria-selected={active===channel.id} tabIndex={active===channel.id?0:-1} disabled={locked} key={channel.id} onClick={()=>choose(channel.id)} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const next=channels[(index+(e.key==='ArrowRight'?1:2))%channels.length];choose(next.id);document.getElementById('order-tab-'+next.id)?.focus();}}}>{channel.name}{count>0&&<span>{count}</span>}</button>;})}</div><div role="tabpanel" id="order-tab-panel" aria-labelledby={'order-tab-'+active}><OrderEntry key={active} snapshot={snapshot} initial={drafts.current[active]||{salesChannel:active}} locked={locked} switchChannel={choose} saveDraft={value=>{if(value)drafts.current[active]=value;else delete drafts.current[active];setRevision(revision=>revision+1);persist(active);}} submit={submit}/></div></>;
}
