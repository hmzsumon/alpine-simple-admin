/* ── Warn early, but never mistake an offline check for a unique platform reference. ── */
import {useEffect,useState} from 'react';
import type {Snapshot} from '../../shared/desktop/contracts';
import {api} from './helpers';
export function useFoodpandaReference(channel:string,reference:string,snapshot:Snapshot){
 const key=reference.trim().toUpperCase(),localDuplicate=channel==='foodpanda'&&!!key&&snapshot.orders.some(order=>String(order.externalOrderId||'').trim().toUpperCase()===key);
 const [result,setResult]=useState<{key:string;checked:boolean;duplicate:boolean;checking:boolean}>({key:'',checked:false,duplicate:false,checking:false});
 useEffect(()=>{if(channel!=='foodpanda'||!key){setResult({key,checked:false,duplicate:false,checking:false});return;}if(localDuplicate){setResult({key,checked:true,duplicate:true,checking:false});return;}let active=true;setResult({key,checked:false,duplicate:false,checking:true});const timer=setTimeout(()=>{void api<{checked:boolean;duplicate:boolean}>('foodpandaReference',{reference:key}).then(value=>{if(active)setResult({key,checked:value?.checked===true,duplicate:value?.duplicate===true,checking:false});}).catch(()=>{if(active)setResult({key,checked:false,duplicate:false,checking:false});});},350);return()=>{active=false;clearTimeout(timer);};},[channel,key,localDuplicate]);
 return {duplicate:localDuplicate||(result.key===key&&result.duplicate),checking:result.key===key&&result.checking,checked:result.key===key&&result.checked};
}
