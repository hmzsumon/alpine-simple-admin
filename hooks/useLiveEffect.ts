/* ────────── repeat data reads without remounting forms or replacing typed inputs ────────── */
"use client";
import {useEffect,useState,type EffectCallback,type DependencyList} from "react";
export function useLiveEffect(effect:EffectCallback,deps:DependencyList){const [revision,setRevision]=useState(0);useEffect(()=>{const update=()=>setRevision(value=>value+1);window.addEventListener("alpine:data-changed",update);return()=>window.removeEventListener("alpine:data-changed",update);},[]);useEffect(effect,[...deps,revision]);}
