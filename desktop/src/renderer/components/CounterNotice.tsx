/* ── Keep connection diagnostics available without displacing the order table ── */
import React from 'react';
export function CounterNotice({message,kind='warning',label}:{message:string;kind?:'warning'|'error';label:string}){
 return <details className={'counter-notice '+kind}><summary><span className="notice-dot" aria-hidden="true"/><strong>{label}</strong><span className="notice-preview">{message}</span><span className="notice-more">Details</span></summary><p>{message}</p></details>;
}
