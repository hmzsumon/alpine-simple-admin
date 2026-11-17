/* ── Account forms open beside the directory; live refresh never replaces typed values ── */
'use client';
import {useCallback,useEffect,useRef} from 'react';
import {X,UserPlus,Pencil} from 'lucide-react';
import type {AuthUser,StaffRole} from '@/types/auth';
import StaffAccountForm from './StaffAccountForm';
export default function StaffEditorPanel({staff,roles,busy,error,close,save}:{staff?:AuthUser;roles:StaffRole[];busy:boolean;error?:string;close:()=>void;save:(body:unknown)=>Promise<boolean>}){
 const root=useRef<HTMLElement>(null),dismiss=useCallback(()=>{if(!busy)close();},[busy,close]);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';(root.current?.querySelector<HTMLElement>('input')||root.current?.querySelector<HTMLElement>('button'))?.focus();return()=>{document.body.style.overflow=overflow;previous?.focus();};},[]);
 return <div className="staff-editor-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)dismiss();}}><section ref={root} className="staff-editor" role="dialog" aria-modal="true" aria-labelledby="staff-editor-title" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();dismiss();}if(e.key==='Tab'){const nodes=root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
 <header className="staff-editor-heading"><div className="staff-editor-icon">{staff?<Pencil size={20}/>:<UserPlus size={20}/>}</div><div><p>{staff?'MANAGE ACCOUNT':'GROW YOUR TEAM'}</p><h2 id="staff-editor-title">{staff?staff.name:'New employee'}</h2></div><button type="button" className="staff-row-button" aria-label="Close employee form" disabled={busy} onClick={dismiss}><X size={20}/></button></header>
 <div className="staff-editor-content account-card"><p className="staff-editor-note">{staff?'Update contact, role and order routing here. Sales history stays with this employee.':'Create a staff login using their mobile number, then choose the right role.'}</p>{error&&<div className="staff-alert is-error" role="alert">{error}</div>}<StaffAccountForm staff={staff} roles={roles} busy={busy} cancel={dismiss} save={save}/></div></section></div>;
}
