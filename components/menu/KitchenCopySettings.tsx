"use client";
import {useRef,useState} from "react";
import {useAdminContext} from "@/context/AdminContext";
import {useAuth} from "@/providers/AuthProvider";
import {matchesMenuSearch} from "@/utils/menuSearch";

export default function KitchenCopySettings({close}:{close:()=>void}){
  const {data,save,busy,mode,setNotice}=useAdminContext(),{can}=useAuth();
  const original=useRef(new Set(data.menu.filter(item=>item.kitchenCopy).map(item=>item.id)));
  const [selected,setSelected]=useState(()=>new Set(original.current)),[query,setQuery]=useState("");
  const visible=data.menu.filter(item=>matchesMenuSearch(item,query)).sort((a,b)=>(a.code||"").localeCompare(b.code||"","en",{numeric:true}));
  const disabled=busy||mode!=="database"||!can("menu:manage");
  return <section className="kitchen-copy-settings" aria-label="Kitchen copy items">
    <header><div><h3>Kitchen copy items</h3><p>Tick the items to include in one Bengali kitchen copy with the customer bill. Counters receive changes after syncing.</p></div><button type="button" className="secondary" disabled={busy} onClick={close}>Close</button></header>
    <label>Find items<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Item code, English or Bengali name…"/></label>
    <div className="kitchen-copy-actions"><strong>{selected.size} items selected</strong><button type="button" className="secondary" disabled={disabled} onClick={()=>setSelected(previous=>new Set([...previous,...visible.map(item=>item.id)]))}>Select visible</button><button type="button" className="secondary" disabled={disabled} onClick={()=>setSelected(previous=>new Set([...previous].filter(id=>!visible.some(item=>item.id===id))))}>Clear visible</button></div>
    <div className="kitchen-copy-item-list">{visible.map(item=><label key={item.id} className="kitchen-copy-item"><input type="checkbox" checked={selected.has(item.id)} disabled={disabled} onChange={event=>setSelected(previous=>{const next=new Set(previous);if(event.target.checked)next.add(item.id);else next.delete(item.id);return next;})}/><span><strong>#{item.code||"—"} · {item.name}</strong><small>{item.nameBn||item.category}</small></span></label>)}{!visible.length&&<p>No matching items.</p>}</div>
    <footer><p>The kitchen copy lists selected items, prices, quantities, waiter, date/time and their total. Parcel token and tea-only slips are disabled.</p><button type="button" className="primary" disabled={disabled} onClick={async()=>{
      const menu=data.menu.map(item=>original.current.has(item.id)===selected.has(item.id)?item:{...item,kitchenCopy:selected.has(item.id)});
      if(await save({...data,menu})){setNotice("Kitchen copy items saved. Sync the counters to receive the selection.");close();}
    }}>Save kitchen items</button></footer>
  </section>;
}
