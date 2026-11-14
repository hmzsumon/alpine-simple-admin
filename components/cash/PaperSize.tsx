/* ────────── printer media and compact PDF pages are deliberately separate ────────── */
"use client";
import {useEffect,useRef} from "react";
// A custom short CSS page can be centred by Windows on its longer driver sheet.
// Physical printing therefore uses the selected printer media; PDF can size to content.
export function printDocument(compactPdf=false){window.dispatchEvent(new CustomEvent("alpine:print-mode",{detail:{compactPdf}}));window.print();}
export default function PaperSize({paper}:{paper:"a4"|"thermal"}){
 const sheet=useRef<HTMLStyleElement>(null);
 useEffect(()=>{
  if(paper!=="thermal")return;
  const receipt=document.querySelector<HTMLElement>(".bill-receipt");if(!receipt)return;
  const printerRule="@media print{@page{size:portrait;margin:0;}}";
  const prepare=(event:Event)=>{if(!sheet.current)return;const compact=(event as CustomEvent<{compactPdf:boolean}>).detail?.compactPdf;if(!compact){sheet.current.textContent=printerRule;return;}const style=getComputedStyle(receipt);const content=receipt.getBoundingClientRect().height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);const height=Math.max(40,Math.ceil(content*25.4/96+5));sheet.current.textContent=`@media print{@page{size:80mm ${height}mm;margin:0;}}`;};
  const restore=()=>{if(sheet.current)sheet.current.textContent=printerRule;};
  window.addEventListener("alpine:print-mode",prepare);window.addEventListener("afterprint",restore);
  return()=>{window.removeEventListener("alpine:print-mode",prepare);window.removeEventListener("afterprint",restore);};
 },[paper]);
 return <style ref={sheet}>{paper==="a4"?"@media print{@page{size:A4;margin:12mm;}}":"@media print{@page{size:portrait;margin:0;}}"}</style>;
}
