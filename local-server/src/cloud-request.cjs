/* ── One request only: interrupted setup responses must never be replayed automatically. ── */
async function cloudRequest(fetcher,url,token,body,diagnostic=()=>{}){
 let response;
 try{response=await fetcher(url,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(120000),redirect:'error'});}
 catch(error){
  const raw=String(error?.cause?.code||error?.code||error?.message||'NETWORK_ERROR'),code=(raw.match(/\b(?:ERR_[A-Z_]+|E[A-Z_]{3,50}|UND_ERR_[A-Z_]+|CERT_[A-Z_]+|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN)\b/)||[])[0]||'NETWORK_ERROR';
  diagnostic('Cloud request failed: '+new URL(url).pathname+' ['+code+']');
  throw Error('ক্লাউড সংযোগ সম্পূর্ণ হয়নি ('+code+')। এই PC-তে ইন্টারনেট, Windows-এর তারিখ/সময় ও proxy পরীক্ষা করুন। ব্রাউজারে /health খুললেও app-এর সংযোগ আলাদা করে ব্যর্থ হতে পারে। আবার চেষ্টা করুন; অসম্পূর্ণ setup থাকলে নিচের বাটন ব্যবহার করুন।');
 }
 let value;try{value=await response.json();}catch{diagnostic('Cloud response was unreadable: HTTP '+response.status);throw Error('ক্লাউড থেকে সঠিক উত্তর আসেনি (HTTP '+response.status+')। অনুরোধ আবার পাঠানোর আগে সেটআপের অবস্থা দেখুন।');}
 if(!response.ok)throw Error(value.error||'The cloud request could not be completed (HTTP '+response.status+').');return value;
}
module.exports={cloudRequest};

