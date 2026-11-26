'use client';
import {useState} from 'react';
import {notify} from '@/lib/feedback';
export default function SendStationOrder({orderId,epoch}:{orderId:string;epoch?:number}){
 const [busy,setBusy]=useState(false),[request]=useState(()=>crypto.randomUUID());
 return <button type="button" className="secondary" disabled={busy} onClick={async()=>{setBusy(true);try{const response=await fetch('/api/orders/'+encodeURIComponent(orderId)+'/kitchen',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:request,...(epoch!==undefined?{orderEpoch:epoch}:{})})});const result=await response.json();if(!response.ok)throw Error(result.error||'কিচেনে পাঠানো যায়নি।');notify(result.duplicate?'এই অর্ডারটি আগে কিচেনে পাঠানো হয়েছে।':result.stationCount+'টি স্টেশনের কপি কাউন্টারের প্রিন্ট কিউতে পাঠানো হয়েছে।','success');}catch(error){notify(error instanceof Error?error.message:'কিচেনে পাঠানো যায়নি।','error');}finally{setBusy(false);}}}>{busy?'পাঠানো হচ্ছে…':'কিচেনে অর্ডার পাঠান'}</button>;
}
