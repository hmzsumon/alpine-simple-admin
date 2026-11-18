/* ── SaveShortcut ── */
import React,{useEffect,useRef,useState} from 'react';
import type {Snapshot} from '../../../shared/desktop/contracts';import type {Order,MenuItem} from '../../../shared/types/workspace';import type {CashMethod} from '../../../shared/types/simpleCash';import type {State,EntryLine} from '../model';
import {api,money,number,gross,paid,bill,due,fish,balances,reportFor} from '../helpers';
export function SaveShortcut({submit}:{submit:()=>void}){useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='F5'){e.preventDefault();submit();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[submit]);return null;}
