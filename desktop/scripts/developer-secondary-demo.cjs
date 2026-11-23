/* Developer-only two-PC simulation: temporary SQLite API and a simulated primary heartbeat. */
const {app,dialog}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const qa=process.argv.includes('--verify-secondary-demo'),apiRoot=path.resolve(__dirname,'../../../alpine-api'),from=file=>require(path.join(apiRoot,file));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'alpine-developer-second-pc-'));
process.env.NODE_ENV='test';process.env.JWT_SECRET=crypto.randomBytes(48).toString('hex');
from('dist/storage/sqlite/driver').installSqliteDriver();const mongoose=from('node_modules/mongoose');
app.setPath('userData',path.join(profile,'counter'));app.commandLine.appendSwitch('disable-gpu');
let win,server,heartbeat,closing=false;
app.on('browser-window-created',(_event,window)=>{if(!win)win=window;window.hide();});
const wait=async fn=>{for(let i=0;i<500;i++){try{const value=await fn();if(value)return value;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}throw Error('The developer demo took too long to start.');};
async function call(name,value,assistant=false){const result=await win.webContents.executeJavaScript('window.'+(assistant?'counterAssistant':'alpine')+'['+JSON.stringify(name)+']('+JSON.stringify(value??null)+')');if(!result.ok)throw Error(result.error);return result.value;}
async function stop(){if(closing)return;closing=true;if(heartbeat)clearInterval(heartbeat);if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await mongoose.disconnect();}
app.on('before-quit',()=>{if(heartbeat)clearInterval(heartbeat);});
(async()=>{
 const demoFile=path.join(profile,'sample-menu.cjs');require('esbuild').buildSync({entryPoints:[path.resolve(__dirname,'../src/main/demo.ts')],outfile:demoFile,bundle:true,platform:'node',format:'cjs',target:'node24'});
 const sample=require(demoFile).demoSnapshot(crypto.randomUUID());assert.equal(sample.catalog.menu.length,100);
 await mongoose.connect('sqlite:'+path.join(profile,'sample-server.sqlite'));
 const api=from('dist/app').default;await from('dist/services/simple-seed.service').initializeSimple();
 const Workspace=from('dist/models/AdminWorkspace.model').default,User=from('dist/models/AdminUser.model').default,stored=await Workspace.findById('main').lean();
 const counters=stored.simpleCash.counters.map(counter=>counter.id==='main'?{...counter,code:'DEMO',name:'DEVELOPER DEMO - Second PC'}:counter);
 await Workspace.updateOne({_id:'main'},{$set:{'state.menu':sample.catalog.menu,'state.halls':sample.catalog.halls.map(hall=>({...hall,counterId:'main'})),'state.tables':sample.catalog.tables.map((table,index)=>({...table,id:'T-'+String(index+1).padStart(2,'0')})),'simpleCash.counters':counters}});
 await User.updateOne({email:'jalal-ahmed@staff.alpine.local'},{$set:{name:'DEMO Cashier'}});
 const auth=from('dist/services/auth.service'),desktop=from('dist/desktop/service'),primary=await auth.loginAdmin('helal-ahmed@staff.alpine.local','123456','127.0.0.1'),primaryId=crypto.randomUUID();
 const identity={counterId:'main',deviceId:primaryId},primarySnapshot=await desktop.desktopSnapshot(primary.user,auth.tokenHash(primary.token),identity,true);
 await desktop.desktopPush(primary.user,{grant:primarySnapshot.grant,event:{protocol:1,id:crypto.randomUUID(),sequence:1,deviceId:primaryId,counterId:'main',epoch:primarySnapshot.catalog.epoch,catalogId:primarySnapshot.catalog.id,at:new Date().toISOString(),action:'open',data:{amount:'1000'}}});
 heartbeat=setInterval(()=>void desktop.desktopSnapshot(primary.user,auth.tokenHash(primary.token),identity).catch(error=>console.error('Demo primary: '+error.message)),10000);heartbeat.unref();
 server=await new Promise(resolve=>{const listener=api.listen(0,'127.0.0.1',()=>resolve(listener));});const origin='http://127.0.0.1:'+server.address().port;
 require('../dist/main.cjs');await app.whenReady();await wait(()=>win&&!win.webContents.isLoading()&&win.webContents.getURL().endsWith('/index.html'));
 await call('login',{identifier:'jalal-ahmed@staff.alpine.local',password:'123456',server:origin,mode:'assistant'});await call('join',{counterId:'main'},true);await wait(async()=>!(await call('getState')).syncing);await call('settings',{printMode:'preview',waiterAutoPrint:false});
 let state=await call('getState');assert.equal(state.mode,'assistant');assert.equal(state.snapshot.catalog.menu.length,100);assert(state.snapshot.catalog.canEditUnpaidOrders);
 const data={salesChannel:'dine_in',table:state.snapshot.catalog.tables[0].id,waiterId:state.snapshot.catalog.waiters[0].id,items:[{menuId:'home-sample-801',quantity:2},{menuId:'demo-paratha',quantity:1}]};
 await call('create',data,true);await call('sync');await wait(async()=>!(await call('getState')).syncing);
 await wait(()=>win.webContents.executeJavaScript("!!document.querySelector('.entry-summary')"));
 await win.webContents.executeJavaScript("document.querySelector('nav button[aria-label=\"Orders\"]').click()");await wait(()=>win.webContents.executeJavaScript("[...document.querySelectorAll('button')].some(button=>button.textContent==='Edit items')"));
 win.setTitle('DEVELOPER DEMO - Second Counter - Sample data only');
 if(qa){
  state=await call('getState');const order=state.snapshot.orders[0];await call('edit',{order,changes:{items:order.items.map((line,index)=>({menuId:line.menuId,lineIndex:index,quantity:index===0?3:line.quantity})),reason:'Developer demo quantity check'}},true);await call('sync');
  state=await call('getState');assert.equal(state.snapshot.orders[0].items[0].quantity,3);assert.equal(state.snapshot.orders[0].adjustments.length,1);assert.equal(state.pending,0);assert.equal(state.settings.printMode,'preview');await assert.rejects(call('command',{action:'pay',data:{}}),/orders and print only/);
  assert.equal(await win.webContents.executeJavaScript("[...document.querySelectorAll('button')].some(button=>/collect bill|confirm payment/i.test(button.textContent))"),false);
  console.log(JSON.stringify({passed:true,secondaryDemo:true,menuItems:100,sampleOrders:1,itemEdit:true,paymentBlocked:true,previewPrinting:true,apiOrigin:origin,isolatedProfile:true,restaurantConnections:0,physicalPrints:0}));await stop();app.exit(0);
 }else{win.show();win.focus();win.on('closed',()=>void stop());console.log('Developer second-PC demo ready. Sample data only.');}
})().catch(async error=>{console.error(error.stack);await stop().catch(()=>{});if(!qa)dialog.showErrorBox('Developer demo could not start',error.message);app.exit(1);});
