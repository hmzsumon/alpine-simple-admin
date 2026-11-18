/* ── Tell the cashier which browser profile owns automatic printing ── */
'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
export default function AutoPrintSetup(){const [enabled,setEnabled]=useState(false);useEffect(()=>{const read=()=>{try{setEnabled(localStorage.getItem('alpine:auto-print-enabled')==='1');}catch{setEnabled(false);}};read();window.addEventListener('alpine:printer-status',read);window.addEventListener('storage',read);return()=>{window.removeEventListener('alpine:printer-status',read);window.removeEventListener('storage',read);};},[]);return <Link href="/guide/printing" className="secondary" prefetch={false}>{enabled?'Auto print on · Printer setup':'Auto-print setup'}</Link>;}
