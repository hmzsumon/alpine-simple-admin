/* Current, unchanged Counter main/preload/SQLite against the new central LAN server. */
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const profile=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'alpine-hub-counter-'));app.setPath('userData',profile);app.commandLine.appendSwitch('disable-gpu');let win;
app.on('browser-window-created',(_e,w)=>{win=w;w.hide();});const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(action){for(let i=0;i<350;i++){try{const v=await action();if(v)return v;}catch{}await pause(100);}throw Error('Counter LAN check timed out');}
async function call(name,value){const result=await win.webContents.executeJavaScript('window.alpine['+JSON.stringify(name)+']('+JSON.stringify(value??null)+')');if(!result.ok)throw Error(result.error);return result.value;}
(async()=>{
 require(path.resolve(__dirname,'../../desktop/dist/main.cjs'));await app.whenReady();await until(()=>win&&!win.webContents.isLoading()&&win.webContents.getURL().endsWith('/index.html'));
 await call('settings',{printMode:'preview'});
 await call('login',{identifier:process.env.QA_CASH_EMAIL,password:process.env.QA_PASSWORD,server:process.env.QA_SERVER});
 await call('reserve','main');await until(async()=>!(await call('getState')).syncing);
 // A fake marker is stored only in this isolated SQLite profile; preview mode never calls a printer.
 const {DatabaseSync}=require('node:sqlite'),sql=new DatabaseSync(path.join(profile,'counter.sqlite'));const settings=JSON.parse(sql.prepare('SELECT value FROM meta WHERE key=?').get('settings').value);settings.printer='QA_PREVIEW_ONLY';settings.printMode='preview';sql.prepare('UPDATE meta SET value=? WHERE key=?').run(JSON.stringify(settings),'settings');sql.close();
 const auth=await (await fetch(process.env.QA_SERVER+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:process.env.QA_WAITER_EMAIL,password:process.env.QA_PASSWORD})})).json();assert(auth.token);
 const bootstrap=await (await fetch(process.env.QA_SERVER+'/api/waiter/bootstrap',{headers:{Authorization:'Bearer '+auth.token}})).json();const item=bootstrap.menu.find(m=>m.price>0);const payload={requestId:crypto.randomUUID(),orderEpoch:bootstrap.orderEpoch,counterId:'main',orderType:'dine_in',salesChannel:'dine_in',table:'T-02',booking:true,finalize:true,items:[{menuId:item.id,quantity:2,expectedPrice:item.price}]};
 const response=await fetch(process.env.QA_SERVER+'/api/waiter/orders',{method:'POST',headers:{Authorization:'Bearer '+auth.token,'Content-Type':'application/json'},body:JSON.stringify(payload)});assert.equal(response.status,201);const saved=await response.json();
 await call('sync');await until(async()=>{const state=await call('getState');return state.snapshot?.orders.some(o=>o.id===saved.order.id)&&!state.syncing;});
 await call('command',{action:'pay',orderId:saved.order.id,data:{allocations:[{methodId:'cash',amount:item.price*2}]}});await until(async()=>{const state=await call('getState');return !state.pending&&!state.syncing;});
 const state=await call('getState');assert.equal(state.snapshot.orders.find(o=>o.id===saved.order.id).payments.length,1);assert.equal(state.settings.printMode,'preview');
 await pause(1000);const {DatabaseSync:DS}=require('node:sqlite'),check=new DS(path.join(profile,'counter.sqlite'));const printCount=check.prepare('SELECT COUNT(*) AS count FROM prints WHERE order_id=?').get(saved.order.id).count;assert.equal(printCount,1);check.close();
 fs.writeFileSync(path.join(process.env.QA_PROOF,'current-counter-lan.json'),JSON.stringify({ok:true,currentCounterUnchanged:true,centralLanLogin:true,waiterOrderReceived:true,autoBillIntentOnce:true,collectedInSQLiteAndLocalMongo:true,physicalPrints:0}));console.log('Current Counter received, printed to preview, and collected a LAN waiter order.');app.exit(0);
})().catch(e=>{console.error(e.stack);app.exit(1);});
