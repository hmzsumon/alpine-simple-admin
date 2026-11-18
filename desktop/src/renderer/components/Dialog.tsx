/* ── Dialog ── */
import React,{useEffect,useRef,useState} from 'react';
import type {Snapshot} from '../../../shared/desktop/contracts';import type {Order,MenuItem} from '../../../shared/types/workspace';import type {CashMethod} from '../../../shared/types/simpleCash';import type {State,EntryLine} from '../model';
import {api,money,number,gross,paid,bill,due,fish,balances,reportFor} from '../helpers';
export function Dialog({title,children,close}:{title:string;children:React.ReactNode;close:()=>void}){return <div className="overlay"><section className="dialog"><header><h2>{title}</h2><button className="icon" onClick={close}>×</button></header>{children}</section></div>;}
