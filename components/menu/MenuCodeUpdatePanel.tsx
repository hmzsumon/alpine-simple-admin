/* ────────── review and save one atomic batch through the existing workspace API ────────── */
'use client';
import {useState} from 'react';
import {useAdminContext} from '@/context/AdminContext';
import {applyMenuCodeChanges,parseMenuCodeChanges,type CodeChange} from '@/utils/menuCodeChanges';
export default function MenuCodeUpdatePanel({close}:{close:()=>void}){
 const {data,save,busy,setNotice}=useAdminContext(),[text,setText]=useState(''),[changes,setChanges]=useState<CodeChange[]>(),[error,setError]=useState('');
 const preview=()=>{try{const rows=parseMenuCodeChanges(data.menu,text);setChanges(rows.filter(r=>r.oldCode!==r.code));setError('');}catch(e){setChanges(undefined);setError((e as Error).message);}};
 const commit=async()=>{if(!changes?.length)return;try{const menu=applyMenuCodeChanges(data.menu,changes);if(await save({...data,menu})){setNotice(`${changes.length}টি আইটেমের কোড আপডেট হয়েছে।`);close();}}catch(e){setError((e as Error).message);setChanges(undefined);}};
 return <section className="panel" aria-label="একসঙ্গে আইটেম কোড আপডেট"><div className="panel-title"><div><h3>একসঙ্গে আইটেম কোড আপডেট</h3><p>প্রতি লাইনে বর্তমান কোড ও নতুন কোড দিন। সব পরিবর্তন একবারে সংরক্ষণ হবে।</p></div><button type="button" disabled={busy} onClick={close}>বন্ধ করুন</button></div>
  <label>বর্তমান কোড ও নতুন কোড<textarea aria-label="বর্তমান কোড ও নতুন কোড" rows={8} value={text} disabled={busy} placeholder={'13\t14\n14\t16'} onChange={e=>{setText(e.target.value);setChanges(undefined);setError('');}}/></label>
  <button type="button" className="secondary" disabled={busy||!text.trim()} onClick={preview}>কোড পরিবর্তন যাচাই করুন</button>
  {error&&<p role="alert" className="danger-text">{error}</p>}
  {changes&&<><p>{changes.length}টি কোড পরিবর্তন হবে। নাম, দাম ও অন্যান্য তথ্য একই থাকবে।</p><div className="table-scroll"><table><thead><tr><th>আইটেম</th><th>বর্তমান কোড</th><th>নতুন কোড</th></tr></thead><tbody>{changes.map(row=>{const item=data.menu.find(i=>i.id===row.id)!;return <tr key={row.id}><td>{item.nameBn||item.name}<small className="item-note">{item.name}</small></td><td>{row.oldCode}</td><td>{row.code}</td></tr>;})}</tbody></table></div><button type="button" className="primary" disabled={busy||!changes.length} onClick={()=>void commit()}>{busy?'সংরক্ষণ হচ্ছে…':`${changes.length}টি কোড সংরক্ষণ করুন`}</button></>}
 </section>;
}
