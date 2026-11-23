/* ── Shared counter navigation; collapse is a preference on this PC only ── */
import React,{useEffect,useState} from 'react';
import type {Catalog} from '../../../shared/desktop/contracts';

export function useCounterSidebar(){
 const [collapsed,setCollapsed]=useState(()=>{try{const saved=localStorage.getItem('alpine.counter.sidebar');return saved?saved==='collapsed':window.innerWidth<1100;}catch{return window.innerWidth<1100;}});
 const toggle=()=>setCollapsed(value=>{const next=!value;try{localStorage.setItem('alpine.counter.sidebar',next?'collapsed':'expanded');}catch{/* Storage failure must not prevent navigation. */}return next;});
 return {collapsed,toggle};
}

export function useCounterOrderShortcut(enabled:boolean,navigate:(page:string)=>void){
 useEffect(()=>{const key=(event:KeyboardEvent)=>{if(!enabled||event.repeat||event.isComposing||document.querySelector('[role=dialog]')||!['F1','F2'].includes(event.key))return;event.preventDefault();navigate('New order');requestAnimationFrame(()=>{if(document.querySelector('[role=dialog]'))return;const input=document.querySelector<HTMLInputElement>('#entry-item-code');input?.focus();input?.select();});};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[enabled,navigate]);
}

function NavIcon({name}:{name:string}){
 const paths:Record<string,React.ReactNode>={
  Overview:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  'New order':<><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 7v10M7 12h10"/></>,
  Orders:<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 7h6M9 11h6M9 15h3"/></>,
  'Petty cash':<><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18m-5 4h5M7 3v4"/></>,
  Reports:<><path d="M4 3v17h17M8 15V9m5 6V5m5 10v-4"/></>,
  Settings:<><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></>,
 };
 return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function CounterSidebar({catalog,version,page,pages,collapsed,toggle,navigate,logout,busy,onOrderMenu,activeOrders=0,assistant=false}:{catalog:Catalog;version:string;page:string;pages:string[];collapsed:boolean;toggle:()=>void;navigate:(page:string)=>void;logout:()=>void;busy:boolean;onOrderMenu:()=>void;activeOrders?:number;assistant?:boolean}){
 return <aside className="counter-sidebar" aria-label="Counter navigation">
  <div className="sidebar-brand"><img src="brand.png" alt="Alpine"/><div><strong>ALPINE</strong><small>{assistant?'Order & print PC':'Cash Counter'}</small></div></div>
  <button type="button" className="sidebar-toggle" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} title={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={toggle}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/><path d={collapsed?'m13 9 3 3-3 3':'m16 9-3 3 3 3'}/></svg><span>{collapsed?'Expand':'Collapse sidebar'}</span></button>
  <div className="counter-name"><span className="sidebar-counter-code">{catalog.counter.code}</span><strong>{catalog.counter.name}</strong><small>{catalog.user.name}</small></div>
  <nav>{pages.map(name=><button type="button" key={name} aria-label={name} title={collapsed?name:undefined} aria-current={page===name?'page':undefined} className={page===name?'active':''} onClick={()=>navigate(name)} onContextMenu={e=>{if(name==='New order'){e.preventDefault();onOrderMenu();}}}><NavIcon name={name}/><span className="sidebar-label">{name}</span>{name==='Orders'&&activeOrders>0&&<span className="sidebar-count">{activeOrders}</span>}</button>)}</nav>
  <footer><button type="button" className="sidebar-signout" aria-label="Sign out" title={collapsed?'Sign out':undefined} disabled={busy} onClick={logout}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 5H4v14h5m5-14 7 7-7 7m-6-7h13"/></svg><span>Sign out</span></button><span className="sidebar-version">Windows · v{version}<br/>Local database · automatic sync</span></footer>
 </aside>;
}
