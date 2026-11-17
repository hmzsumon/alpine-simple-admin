/* ── Component: typed item-name lookup with Arrow keys, Enter and Escape ── */
"use client";
import {isFishCategory} from "@/utils/fishPricing";
import {useId,useState,useEffect,type RefObject} from "react";
import {matchesMenuSearch} from "@/utils/menuSearch";
import {money} from "@/utils/format";
import type {MenuItem} from "@/types";
export default function CounterItemPicker({menu,value,onQuery,onChoose,inputRef,disabled}:{menu:MenuItem[];value:string;onQuery:(s:string)=>void;onChoose:(m:MenuItem)=>void;inputRef:RefObject<HTMLInputElement>;disabled:boolean}){
 const [open,setOpen]=useState(false),[active,setActive]=useState(0),id=useId();const matches=menu.filter(m=>m.active&&(m.price!==null||isFishCategory(m.category))&&matchesMenuSearch(m,value)).slice(0,60);
 useEffect(()=>{if(open)document.getElementById(id+"-"+active)?.scrollIntoView({block:"nearest"});},[id,active,open]);
 function choose(item:MenuItem){setOpen(false);onChoose(item);}
 return <div className="relative"><input ref={inputRef} id="counter-item-name" role="combobox" aria-label="Item name search" aria-expanded={open} aria-controls={id} aria-autocomplete="list" aria-activedescendant={open&&matches[active]?id+"-"+active:undefined} autoComplete="off" className="w-full" value={value} disabled={disabled} placeholder="Type a few letters or choose an item" onFocus={()=>{setOpen(true);setActive(0);}} onBlur={()=>setOpen(false)} onChange={e=>{onQuery(e.target.value);setOpen(true);setActive(0);}} onKeyDown={e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();setOpen(true);setActive(n=>Math.max(0,Math.min(matches.length-1,n+(e.key==="ArrowDown"?1:-1))));}else if(e.key==="Enter"){e.preventDefault();if(matches[active])choose(matches[active]);}else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();setOpen(false);}else if(e.key==="Tab")setOpen(false);}}/>{open&&!disabled&&<div id={id} role="listbox" aria-label="Matching menu items" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-white/15 bg-[#252536] shadow-xl">{matches.map((m,i)=><button key={m.id} id={id+"-"+i} type="button" role="option" aria-selected={active===i} className={`flex w-full justify-between gap-3 px-3 py-2 text-left text-xs ${active===i?"bg-emerald-500/20 text-emerald-200":"text-slate-200 hover:bg-white/5"}`} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(i)} onClick={()=>choose(m)}><span><strong>#{m.code} · {m.name}</strong><small className="mt-0.5 block text-[10px] text-slate-400">{m.category}{m.nameBn?" · "+m.nameBn:""}</small></span><span className="whitespace-nowrap">{money(m.price||0)}</span></button>)}{!matches.length&&<p className="p-3 text-xs text-slate-400">No available item matches.</p>}</div>}</div>;
}

