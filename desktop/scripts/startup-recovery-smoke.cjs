/* ── Actual Electron, preload, saved DPAPI login and renderer; fake loopback server, no live data ── */
const {app,BrowserWindow,ipcMain}=require('electron'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const profile=process.env.ALPINE_STARTUP_QA_PROFILE,stage=process.env.ALPINE_STARTUP_QA_STAGE;
process.on('uncaughtException',error=>{console.error(error.stack);app.exit(1);});
if(!profile||!path.basename(profile).startsWith('alpine-startup-qa-')||!['interrupted','restored','render'].includes(stage))throw Error('An isolated startup QA profile and stage are required.');
app.setPath('userData',profile);app.commandLine.appendSwitch('disable-gpu');let win,server,loginPosts=0,counterReads=0,broken=stage==='interrupted',renderFault=stage==='render';
const originalFetch=global.fetch;global.fetch=(input,options)=>{if(!String(input).startsWith('http://127.0.0.1:'))return Promise.reject(Error('QA blocks external network'));return originalFetch(input,options);};
app.on('browser-window-created',(_event,w)=>{if(!win)win=w;w.hide();});
const originalHandle=ipcMain.handle.bind(ipcMain);ipcMain.handle=(channel,listener)=>originalHandle(channel,async(event,...args)=>{const result=await listener(event,...args);if(channel==='counter:call'&&args[0]==='state'&&renderFault&&result.ok)return {ok:true,value:{...result.value,requiresLogin:false,choices:undefined}};return result;});
const wait=async fn=>{const end=Date.now()+30000;while(Date.now()<end){const value=await fn();if(value)return value;await new Promise(resolve=>setTimeout(resolve,75));}throw Error('Startup QA timed out: '+stage);};
const call=async(name,value)=>{const r=await win.webContents.executeJavaScript('window.alpine['+JSON.stringify(name)+']('+JSON.stringify(value??null)+')');if(!r.ok)throw Error(r.error);return r.value;};
const text=()=>win.webContents.executeJavaScript('document.body.innerText');
const listen=port=>new Promise(resolve=>{server=http.createServer((req,res)=>{if(req.url==='/api/auth/login'){loginPosts++;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({token:'QA-ONLY-NOT-A-REAL-TOKEN',user:{id:'qa-cashier',name:'QA cashier',permissions:['cash:operate','cash:read','orders:create','payments:collect']},expiresAt:new Date(Date.now()+3600000).toISOString()}));}else if(req.url==='/api/simple/counters'){counterReads++;if(broken){req.socket.destroy();return;}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({counters:[{id:'qa',name:'QA recovery counter',code:'C01'}]}));}else if(req.url==='/api/auth/logout'&&broken){req.socket.destroy();}else {res.setHeader('Content-Type','application/json');res.end('{}');}}).listen(port||0,'127.0.0.1',()=>resolve(server.address().port));});
(async()=>{fs.mkdirSync(profile,{recursive:true});const port=await listen(stage==='restored'?JSON.parse(fs.readFileSync(path.join(profile,'qa-port.json'))).port:0);fs.writeFileSync(path.join(profile,'qa-port.json'),JSON.stringify({port}));require(process.env.ALPINE_QA_ASAR||'../dist/main.cjs');await app.whenReady();await wait(()=>win&&!win.webContents.isLoading()&&win.webContents.getURL().endsWith('/index.html'));
 if(stage==='interrupted'){
  await wait(async()=>(await text()).includes('Sign in to your counter'));
  await call('login',{identifier:'qa@alpine.local',password:'QA-NOT-A-REAL-PASSWORD',server:'http://127.0.0.1:'+port});
  await wait(async()=>(await text()).includes('Retry connection'));
  let state=await call('getState');assert.equal(state.requiresLogin,false);assert.equal(state.snapshot,undefined);assert.deepEqual(state.choices,[]);assert.match(state.problem,/Offline/);assert.equal(state.pending,0);assert.equal(loginPosts,1);
  const {DatabaseSync}=require('node:sqlite'),db=new DatabaseSync(path.join(profile,'counter.sqlite'));db.prepare('INSERT INTO meta VALUES(?,?)').run('startupQaPreserved',JSON.stringify('keep-this-record'));db.close();
  fs.writeFileSync(path.join(profile,'interrupted.txt'),await text());
 }else if(stage==='restored'){
  await wait(async()=>(await text()).includes('QA recovery counter'));const state=await call('getState');assert.equal(state.requiresLogin,false);assert.equal(loginPosts,0);assert.ok(counterReads>0);assert.equal(state.choices[0].id,'qa');assert.equal(state.pending,0);
  const {DatabaseSync}=require('node:sqlite'),db=new DatabaseSync(path.join(profile,'counter.sqlite'));assert.equal(JSON.parse(db.prepare('SELECT value FROM meta WHERE key=?').get('startupQaPreserved').value),'keep-this-record');db.close();
  fs.writeFileSync(path.join(profile,'restored.txt'),await text());
  broken=true;await call('logout');assert.equal((await call('getState')).requiresLogin,true);await wait(async()=>(await text()).includes('Sign in to your counter'));
 }else{
  await wait(async()=>(await text()).includes('COUNTER-SCREEN-01'));assert.equal(loginPosts,0);fs.writeFileSync(path.join(profile,'recovery.txt'),await text());renderFault=false;await win.webContents.executeJavaScript("document.querySelector('.login-card button').click()");await wait(async()=>(await text()).includes('Sign in to your counter'));
  const target=path.join(profile,'missing-bundle');fs.mkdirSync(target,{recursive:true});for(const file of ['index.html','style.css','startup.js'])fs.copyFileSync(path.resolve(__dirname,'../dist',file),path.join(target,file));const fallback=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});await fallback.loadFile(path.join(target,'index.html'));await wait(()=>fallback.webContents.executeJavaScript("!document.getElementById('startup-refresh').hidden"));assert.match(await fallback.webContents.executeJavaScript('document.body.innerText'),/Refresh screen/);fallback.destroy();
 }
 console.log(JSON.stringify({ok:true,stage,loginPosts,counterReads,physicalPrints:0,liveRequests:0}));server.closeAllConnections();await new Promise(resolve=>server.close(resolve));app.exit(0);
})().catch(e=>{console.error(e.stack);server?.closeAllConnections();server?.close();app.exit(1);});
