const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const flush=()=>new Promise(r=>setImmediate(r));
function harness({enabled=true,query='',success=true}={}){
 let effect,timer,fetches=0,claims=0;const claimed=new Set(),printed=[],waits=[],notices=[],storage=new Map(enabled?[['alpine:auto-print-enabled','1']]:[]),live={};
 const component={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/orders/ParcelHandoffPrinter.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:component.exports,URLSearchParams,Event,crypto:{randomUUID:()=> 'device'},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},window:{location:{search:query},dispatchEvent(){},addEventListener(){},removeEventListener(){}},document:{addEventListener(){},removeEventListener(){}},EventSource:class{addEventListener(n,f){live[n]=f;}close(){}},setInterval:f=>(timer=f,1),clearInterval(){},fetch:async(url,options)=>{fetches++;return {ok:true,json:async()=>{if(url.endsWith('claim')){claims++;const job=JSON.parse(options.body),first=!claimed.has(job.orderId);claimed.add(job.orderId);return {...job,claimed:first};}return {jobs:[{orderId:'dine',jobId:'first'},{orderId:'parcel',jobId:'second'}]};}};},require:p=>p==='react'?{useEffect:f=>effect=f}:p.includes('AuthProvider')?{useAuth:()=>({user:{id:'cashier',permissions:['cash:operate','payments:collect']}})}:p.includes('billPrinting')?{printBill:(...args)=>{printed.push(args);return new Promise(resolve=>waits.push(()=>resolve(success)));}}:{notify:text=>notices.push(text)}});
 component.exports.default();const cleanup=effect();return {storage,printed,waits,notices,cleanup,live,tick:()=>timer?.(),get fetches(){return fetches;},get claims(){return claims;}};
}
test('ordinary browser profiles do not claim jobs; Auto Print shortcut enables its own profile',async()=>{
 const off=harness({enabled:false});await flush();assert.equal(off.fetches,0);
 const on=harness({enabled:false,query:'?autoPrint=1'});await flush();assert.equal(on.storage.get('alpine:auto-print-enabled'),'1');assert.equal(on.printed.length,1);on.cleanup();on.waits[0]();await flush();
});
test('printer waits for one complete bill/token before claiming another and live events do not duplicate it',async()=>{
 const h=harness();await flush();assert.equal(h.claims,1);assert.equal(h.printed.length,1);assert.equal(h.printed[0][4],true);
 h.live.changed();await h.tick();await flush();assert.equal(h.claims,1);
 h.waits[0]();await flush();assert.equal(h.claims,2);assert.equal(h.printed.length,2);
 h.waits[1]();await flush();assert.equal(h.printed.length,2);h.cleanup();
});
test('a failed print pauses automatic claiming instead of consuming the rest of the backlog',async()=>{
 const h=harness({success:false});await flush();h.waits[0]();await flush();await h.tick();h.live.changed();await flush();assert.equal(h.claims,1);assert.equal(h.printed.length,1);assert.ok(h.notices.some(n=>n.includes('Auto-print paused')));h.cleanup();
});
