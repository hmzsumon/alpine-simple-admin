"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAdminContext} from "@/context/AdminContext";
import {useAuth} from "@/providers/AuthProvider";
import {renameCategory} from "@/utils/renameCategory";
import {categoryName,moveCategoryItems,sameCategory,UNCATEGORIZED} from "@/utils/categoryItems";
import {matchesMenuSearch} from "@/utils/menuSearch";

export default function CategoryEditor({name}:{name:string}){
  const {data,categories,save,busy,mode,setNotice}=useAdminContext(),{can}=useAuth(),router=useRouter();
  const [query,setQuery]=useState(""),[selected,setSelected]=useState(new Set<string>()),[destination,setDestination]=useState(""),[rename,setRename]=useState(name),[error,setError]=useState("");
  const uncategorized=sameCategory(name,UNCATEGORIZED),items=data.menu.filter(item=>sameCategory(item.category,name)),visible=items.filter(item=>matchesMenuSearch(item,query));
  const disabled=busy||mode!=="database"||!can("menu:manage");
  async function move(target:string,ids=selected){setError("");try{if(await save(moveCategoryItems(data,name,target,ids))){setSelected(new Set());setNotice(target===UNCATEGORIZED?"Items moved to Uncategorized.":"Items moved to "+target+".");}}catch(cause){setError(cause instanceof Error?cause.message:"Could not move items.");}}
  return <section className="panel category-editor" aria-label="Category items editor">
    <header><div><Link href="/menu">← Menu &amp; categories</Link><h2>{uncategorized?"Uncategorized items":name}</h2><p>{items.length} items · Remove keeps an item in Uncategorized. Transfer moves it to another category.</p></div></header>
    {!uncategorized&&<form className="category-editor-rename" onSubmit={async event=>{event.preventDefault();setError("");try{const next=renameCategory(data,name,rename);if(await save(next)){setNotice("Category renamed.");router.replace('/menu/categories/'+encodeURIComponent(rename.trim()));}}catch(cause){setError(cause instanceof Error?cause.message:"Could not rename category.");}}}><label>Category name<input value={rename} maxLength={100} required disabled={disabled} onChange={event=>setRename(event.target.value)}/></label><button className="secondary" disabled={disabled}>Save name</button></form>}
    <div className="category-editor-controls"><label>Find items<input type="search" placeholder="Item code or name…" value={query} onChange={event=>setQuery(event.target.value)}/></label><strong>{selected.size} selected</strong><button type="button" className="secondary" disabled={disabled} onClick={()=>setSelected(previous=>new Set([...previous,...visible.map(item=>item.id)]))}>Select visible</button><button type="button" className="secondary" disabled={disabled} onClick={()=>setSelected(new Set())}>Clear selection</button></div>
    <div className="category-editor-transfer"><label>Destination category<select value={destination} onChange={event=>setDestination(event.target.value)} disabled={disabled}><option value="">Choose category</option>{categories.filter(category=>!sameCategory(category,name)&&!sameCategory(category,UNCATEGORIZED)).map(category=><option key={category} value={category}>{category}</option>)}</select></label><button type="button" className="primary" disabled={disabled||!selected.size||!destination} onClick={()=>void move(destination)}>{uncategorized?"Add to category":"Transfer selected"}</button>{!uncategorized&&<button type="button" className="secondary" disabled={disabled||!selected.size} onClick={()=>void move(UNCATEGORIZED)}>Remove selected from category</button>}</div>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="table-scroll"><table><thead><tr><th>Select</th><th>Code</th><th>Item name</th><th>Category</th><th/></tr></thead><tbody>{visible.map(item=><tr key={item.id}><td><input aria-label={'Select '+item.name} type="checkbox" checked={selected.has(item.id)} disabled={disabled} onChange={event=>setSelected(previous=>{const next=new Set(previous);if(event.target.checked)next.add(item.id);else next.delete(item.id);return next;})}/></td><td>{item.code||"—"}</td><td><strong>{item.name}</strong>{item.nameBn&&<small className="item-note">{item.nameBn}</small>}</td><td>{categoryName(item.category)}</td><td>{!uncategorized&&<button type="button" className="secondary" disabled={disabled} onClick={()=>void move(UNCATEGORIZED,new Set([item.id]))}>Remove from category</button>}</td></tr>)}</tbody></table>{!visible.length&&<p className="category-editor-empty">{query?"No matching items.":"No items in this category."}</p>}</div>
  </section>;
}
