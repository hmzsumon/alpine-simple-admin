/* â”€â”€ Private-LAN transport; never exposes cloud tokens or arbitrary desktop commands â”€â”€ */
import {createServer,type Server} from 'node:http';
import {networkInterfaces} from 'node:os';
import {randomBytes,randomInt,createHash,timingSafeEqual} from 'node:crypto';
export const localHash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function privateAddress(raw:string){const ip=raw.replace(/^::ffff:/,'');const p=ip.split('.').map(Number);return p.length===4&&p.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(p[0]===10||p[0]===127||p[0]===192&&p[1]===168||p[0]===172&&p[1]>=16&&p[1]<=31);}
interface Options {demo:boolean;info:()=>Promise<any>;pair:(ticket:string,parcel?:boolean)=>Promise<any>;call:<T=any>(method:string,value?:unknown)=>Promise<T>;changed:()=>void;}
export class LocalNetwork {
 private server?:Server;private code=String(randomInt(100000,1000000));private codeUntil=Date.now()+300000;private attempts=new Map<string,{at:number;count:number}>();private port=4317;error='';
 constructor(private options:Options){}
 private notify(){try{this.options.changed();}catch{/* UI refresh cannot turn a committed order into a rejection. */}}
 details(){const rank=(name:string)=>/vethernet|virtual|docker|wsl|loopback/i.test(name)?3:/wi.?fi|wireless|wlan/i.test(name)?0:/ethernet/i.test(name)?1:2;const urls=Object.entries(networkInterfaces()).flatMap(([name,rows])=>(rows||[]).filter(n=>!n.internal&&n.family==='IPv4'&&privateAddress(n.address)).map(n=>({name,address:n.address}))).sort((a,b)=>rank(a.name)-rank(b.name)).map(n=>'http://'+n.address+':'+this.port);return {enabled:!!this.server,urls,code:this.code,codeExpiresAt:new Date(this.codeUntil).toISOString(),demo:this.options.demo,error:this.error};}
 renew(){this.code=String(randomInt(100000,1000000));this.codeUntil=Date.now()+300000;return this.details();}
 async start(port=4317){if(this.server)return this.details();this.port=port;this.error='';const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
  try{
   if(!privateAddress(req.socket.remoteAddress||'')||req.headers.origin)throw Error('Private restaurant Wi-Fi only.');
   const host=new URL('http://'+(req.headers.host||'')).hostname;if(!privateAddress(host))throw Error('Use the counter IP address.');
   const path=(req.url||'').split('?')[0];const isGet=req.method==='GET';if(!isGet&&req.method!=='POST')throw Error('Unsupported operation.');
   let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>65536)throw Error('Request is too large.');}let body:any;try{body=raw?JSON.parse(raw):undefined;}catch{throw Error('Invalid request JSON.');}
   if(path==='/local/info'&&isGet){const info=await this.options.info();res.end(JSON.stringify({...info,demo:this.options.demo,protocol:1}));return;}
   if(path==='/local/pair'&&!isGet){
    const ip=req.socket.remoteAddress||'';let attempts=this.attempts.get(ip);if(!attempts||Date.now()-attempts.at>60000){attempts={at:Date.now(),count:0};this.attempts.set(ip,attempts);}if(++attempts.count>6)throw Error('Wait one minute before pairing again.');if(this.attempts.size>1000)this.attempts.clear();
    const actual=Buffer.from(String(body?.code||'')),expected=Buffer.from(this.code);if(actual.length!==expected.length||!timingSafeEqual(actual,expected)||Date.now()>this.codeUntil)throw Error('Pairing code expired or incorrect. Ask the cashier for a new code.');
    const actor=await this.options.pair(String(body?.ticket||''),body?.demoParcel===true),token=randomBytes(32).toString('base64url');await this.options.call('localPair',{hash:localHash(token),actor});this.renew();this.notify();res.end(JSON.stringify({token,user:actor.user,expiresAt:actor.expiresAt,demo:this.options.demo}));return;
   }
   const bearer=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];if(!bearer){res.statusCode=401;throw Error('Connect this phone to the local counter first.');}
   res.statusCode=401;const actor=await this.options.call('localAuth',{hash:localHash(bearer)});res.statusCode=200;let result;
   if(isGet&&path==='/api/waiter/bootstrap')result=await this.options.call('localBootstrap',{actor});
   else if(isGet&&/^\/api\/waiter\/orders\/[^/]+$/.test(path))result=await this.options.call('localReceipt',{actor,id:decodeURIComponent(path.split('/').at(-1)!)});
   else if(!isGet&&(/^\/api\/waiter\/orders$/.test(path)||/^\/api\/waiter\/orders\/[^/]+\/items$/.test(path))){result=await this.options.call('localSubmit',{actor,path,body});this.notify();}
   else throw Error('This action needs the online restaurant server.');
   res.end(JSON.stringify(result));
  }catch(e){if(res.headersSent)return;if(res.statusCode===200)res.statusCode=409;res.end(JSON.stringify({error:e instanceof Error?e.message:'Local request failed'}));}
 });server.requestTimeout=12000;server.headersTimeout=8000;server.maxConnections=50;
 try{await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(port,'0.0.0.0',()=>resolve());});this.server=server;this.port=Number((server.address() as any).port);server.on('error',e=>{this.error=e.message;this.notify();});}catch(e){server.close();this.error=e instanceof Error?e.message:'Local network unavailable';throw e;}return this.details();}
 async stop(){const s=this.server;this.server=undefined;if(s){s.closeAllConnections();await new Promise<void>(resolve=>s.close(()=>resolve()));}this.notify();}
}
