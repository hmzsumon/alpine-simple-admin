const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const flush=()=>new Promise(r=>setImmediate(r));
function harness(saved,options={}){let index=0,boot=true,states=[],effects=[],sent=[];const storage=new Map(saved?[['alpine-simple-order-pending:cashier',JSON.stringify(saved)]]:[]),data={menu:[{id:'tea',name:'Tea',code:'2',category:'Drinks',price:20}],orders:[],tables:[{id:'T-01',hallId:'ground'}],halls:[{id:'ground',counterId:'main'}]};
 const box={exports:{},crypto:{randomUUID:()=> 'new-request'},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},require:p=>{
  if(p==='react')return {useState:v=>{const i=index++;if(!(i in states))states[i]=v;return [states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},useRef:v=>{const i=index++;if(!(i in states))states[i]={current:v};return states[i];},useEffect:f=>{if(boot)effects.push(f);}};
  if(p.includes('useLiveEffect'))return {useLiveEffect:f=>{if(boot)effects.push(f);}};
  if(p.includes('adminFetch'))return {adminFetch:async(url,requestOptions)=>{if(url.includes('order-waiters'))return {ok:true,json:async()=>({waiters:[]})};if(url.includes('counters'))return {ok:true,json:async()=>({counters:options.counters||[{id:'main',active:true}],defaultCounterId:'main'})};sent.push(JSON.parse(requestOptions.body));return {ok:true,json:async()=>({order:{id:'saved-bill'}})};}};
  if(p.includes('feedback'))return {notify(){}};if(p.includes('AuthProvider'))return {useAuth:()=>({user:{id:'cashier',name:'Cashier',counterId:options.preferredCounter||'main'}})};if(p.includes('AdminContext'))return {useAdminContext:()=>({data,orderEpoch:7,refreshWorkspace:async()=>{}})};if(p.includes('hallRouting'))return {operatingCounter:()=>({id:'main'})};if(p.includes('counterEntry'))return {counterTotal:rows=>rows.reduce((n,l)=>n+l.price*l.quantity,0)};return require(p);
 }};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../hooks/useCounterOrder.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,box);
 const render=()=>{index=0;return box.exports.useCounterOrder();};let hook=render();return {sent,render,async ready(){boot=false;effects.forEach(f=>f());await flush();hook=render();return hook;}};
}
test('new counter parcel and Foodpanda orders submit without waiter selection or stale attribution',async()=>{for(const channel of ['takeaway','foodpanda']){const h=harness();let c=await h.ready();c.setChannel(channel);c.setWaiterId('previous-dine-in-waiter');c.setExternal('FP-123');c.setLines([{menuId:'tea',price:20,quantity:1}]);c=h.render();assert.ok(await c.submit());assert.equal(h.sent.length,1);assert.equal(h.sent[0].table,'PARCEL');assert.equal(h.sent[0].waiterId,undefined);assert.equal(h.sent[0].salesChannel,channel);}});
test('dine-in still requires a waiter or explicit counter-sale choice',async()=>{const h=harness();let c=await h.ready();c.setTable('T-01');c.setLines([{menuId:'tea',price:20,quantity:1}]);c=h.render();assert.equal(await c.submit(),null);assert.equal(h.sent.length,0);});
test('an already-pending parcel request keeps its exact original waiter and request identity',async()=>{const original={path:'/api/waiter/orders',body:{requestId:'old-request',orderEpoch:6,salesChannel:'takeaway',table:'PARCEL',waiterId:'original-waiter',items:[{menuId:'tea',quantity:1,expectedPrice:20}]}};const h=harness(original);const c=await h.ready();assert.ok(await c.submit());assert.equal(JSON.stringify(h.sent[0]),JSON.stringify(original.body));});

test('parcel and Foodpanda use the held counter returned by the server when the profile counter is unavailable',async()=>{
 for(const channel of ['takeaway','foodpanda']){
  const h=harness(undefined,{preferredCounter:'second-floor'});let c=await h.ready();assert.equal(c.counterId,'main');
  c.setChannel(channel);c.setExternal('FP-456');c.setLines([{menuId:'tea',price:20,quantity:1}]);c=h.render();
  assert.ok(await c.submit());assert.equal(h.sent[0].counterId,'main');
 }
});
test('a missing counter cannot silently submit behind a native dropdown fallback',async()=>{
 const h=harness();let c=await h.ready();c.setChannel('takeaway');c.setCounterId('second-floor');c.setLines([{menuId:'tea',price:20,quantity:1}]);c=h.render();
 assert.equal(await c.submit(),null);assert.equal(h.sent.length,0);
});
test('new counter discovery never rewrites an uncertain request to another drawer',async()=>{
 const original={path:'/api/waiter/orders',body:{requestId:'old-counter-request',counterId:'second-floor',orderEpoch:6,salesChannel:'takeaway',table:'PARCEL',items:[{menuId:'tea',quantity:1,expectedPrice:20}]}};
 const h=harness(original,{preferredCounter:'second-floor'}),c=await h.ready();assert.equal(c.counterId,'second-floor');
 assert.ok(await c.submit());assert.equal(JSON.stringify(h.sent[0]),JSON.stringify(original.body));
});
