import React,{useState} from 'react';
import {api} from '../helpers';
import {notify} from './Notifications';
export function SendToStations({orderId,disabled=false,sent=false}:{orderId:string;disabled?:boolean;sent?:boolean}){
 const [working,setWorking]=useState(false),[saved,setSaved]=useState(sent);
 async function send(reprint=false){if(working)return;setWorking(true);try{if(reprint){if(!window.confirm('কিচেনের কপি আবার প্রিন্ট করবেন? আগে পাঠানো অর্ডারটি দেখে নিন।'))return;await api('stationReprint',orderId);notify('success','স্টেশনের কপি আবার প্রিন্টের কিউতে দেওয়া হয়েছে।');}else{const result=await api<{duplicate:boolean;stationCount:number}>('stationSend',orderId);setSaved(true);notify('success',result.duplicate?'এই অর্ডারটি আগে কিচেনে পাঠানো হয়েছে।':result.stationCount+'টি স্টেশনের জন্য আলাদা কপি পাঠানো হয়েছে।');}}catch(error){notify('error',error instanceof Error?error.message:'কিচেনে পাঠানো যায়নি।');}finally{setWorking(false);}}
 return <><button type="button" className="primary" disabled={disabled||working} onClick={()=>void send()}>{working?'পাঠানো হচ্ছে…':'কিচেনে অর্ডার পাঠান'}</button>{(saved||sent)&&<button type="button" className="secondary" disabled={disabled||working} onClick={()=>void send(true)}>কিচেন কপি আবার প্রিন্ট</button>}</>;
}
