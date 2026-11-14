/* Live document previews refresh between print jobs, never during a print dialog. */
"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
export default function LiveDocument(){const router=useRouter();useEffect(()=>{let pending=false;const update=()=>{if(window.matchMedia("print").matches){pending=true;return;}router.refresh();};const finish=()=>{if(pending){pending=false;router.refresh();}};window.addEventListener("alpine:data-changed",update);window.addEventListener("afterprint",finish);return()=>{window.removeEventListener("alpine:data-changed",update);window.removeEventListener("afterprint",finish);};},[router]);return null;}
