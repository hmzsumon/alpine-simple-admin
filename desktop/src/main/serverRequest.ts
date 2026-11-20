/* ── Fresh, direct LAN sockets avoid proxy/pool failures; mutations are never automatically replayed ── */
import {request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {isLocalServer,validServer} from './serverAddress';
export interface JsonReply {ok:boolean;status:number;data:any;}
const MAX_REPLY=32*1024*1024;
const failure=(code:string)=>Object.assign(new Error('Restaurant server connection failed.'),{code});
export function connectionMessage(server:string,error:unknown){const code=String((error as {code?:string;cause?:{code?:string}})?.code||(error as {cause?:{code?:string}})?.cause?.code||'UNAVAILABLE');const safe=/^[A-Z_0-9]{1,40}$/.test(code)?code:'UNAVAILABLE';return isLocalServer(server)?'LAN server '+server+' could not complete the connection ('+safe+'). Check the server PC and LAN, then try again.':'The cloud server could not be reached ('+safe+'). Check internet access and try again.';}
export async function serverRequest(server:string,route:string,body?:unknown,token?:string,timeout=20000):Promise<JsonReply>{
 const origin=validServer(server);if(!route.startsWith('/api/')||route.startsWith('//')||route.includes('#'))throw Error('Invalid server operation.');
 const headers:Record<string,string>={'Content-Type':'application/json','x-alpine-language':'en',Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{})};
 if(!isLocalServer(origin)){const response=await fetch(origin+route,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(timeout)});return {ok:response.ok,status:response.status,data:await response.json().catch(()=>({error:'Invalid server response'}))};}
 const data=body===undefined?undefined:Buffer.from(JSON.stringify(body));
 return new Promise((resolve,reject)=>{
  let settled=false;let timer:ReturnType<typeof setTimeout>;
  const finish=(error?:Error,value?:JsonReply)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value!);};
  const request=(origin.startsWith('https:')?httpsRequest:httpRequest)(origin+route,{method:data?'POST':'GET',agent:false,headers:{...headers,Connection:'close','Accept-Encoding':'identity',...(data?{'Content-Length':String(data.length)}:{})}},response=>{
   const chunks:Buffer[]=[];let size=0;
   response.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>MAX_REPLY){finish(failure('RESPONSE_TOO_LARGE'));request.destroy();return;}chunks.push(chunk);});
   response.once('aborted',()=>finish(failure('ECONNRESET')));response.once('error',error=>finish(error));
   response.once('end',()=>{if(settled)return;const status=response.statusCode||502;try{const raw=Buffer.concat(chunks).toString('utf8'),value=raw?JSON.parse(raw):{};finish(undefined,{ok:status>=200&&status<300,status,data:value});}catch{finish(failure('INVALID_JSON'));}});
  });
  timer=setTimeout(()=>{const error=failure('ETIMEDOUT');finish(error);request.destroy(error);},timeout);timer.unref();
  request.once('error',error=>finish(error));request.end(data);
 });
}
