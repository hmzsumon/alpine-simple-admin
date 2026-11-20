/* ────────── loopback readiness uses direct HTTP, independent of Windows proxy settings ────────── */
const http=require('node:http');
function localResponse(address,{headers={},timeout=2000,maxBytes=1024*1024}={}){
 const url=new URL(address);if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.username||url.password)throw Error('Only the local server can be checked.');
 return new Promise((resolve,reject)=>{
  const request=http.get(url,{headers:{...headers,Connection:'close'},agent:false},response=>{let size=0;const chunks=[];response.on('data',chunk=>{size+=chunk.length;if(size>maxBytes){response.destroy(Error('Local response is too large.'));return;}chunks.push(chunk);});response.once('error',reject);response.once('end',()=>{const body=Buffer.concat(chunks).toString();resolve({ok:response.statusCode>=200&&response.statusCode<300,status:response.statusCode,body,json(){return JSON.parse(body);}});});});
  request.setTimeout(timeout,()=>request.destroy(Error('Local server is still starting.')));request.once('error',reject);
 });
}
module.exports={localResponse};
