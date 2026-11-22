/* Stream release assets with bounded timeouts; tokens are never written or logged. */
const https=require('node:https'),{Readable}=require('node:stream');
function uploadAsset(url,headers,bytes){return new Promise((resolve,reject)=>{
 let finished=false,progress=0;const source=Readable.from((function*(){for(let i=0;i<bytes.length;i+=65536)yield bytes.subarray(i,i+65536);})());
 const request=https.request(url,{method:'POST',headers:{...headers,'User-Agent':'Alpine-release','Content-Length':String(bytes.length)}},response=>{const chunks=[];response.on('data',b=>chunks.push(b));response.on('end',()=>{finished=true;clearTimeout(total);resolve({ok:response.statusCode>=200&&response.statusCode<300,status:response.statusCode});});});
 const fail=error=>{if(finished)return;finished=true;clearTimeout(total);source.destroy();request.destroy();reject(error);};const total=setTimeout(()=>fail(Error('Release upload timed out')),180000);
 request.setTimeout(45000,()=>fail(Error('Release upload stalled')));request.on('error',e=>fail(Error('Release upload failed: '+(e.code||'network'))));
 source.on('data',chunk=>{progress+=chunk.length;if(progress%(32*1024*1024)===0)console.log('Release upload: '+Math.round(progress/1024/1024)+' MB');});source.pipe(request);
});}
module.exports={uploadAsset};
