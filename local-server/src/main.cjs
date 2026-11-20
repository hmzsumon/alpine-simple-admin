/* ────────── server manager shell; closing the window keeps restaurant service in the tray ────────── */
const {app,BrowserWindow,ipcMain,safeStorage,dialog,shell,Tray,Menu,nativeImage,powerSaveBlocker}=require('electron');
const path=require('node:path'),fs=require('node:fs');const {Controller}=require('./controller.cjs');const {ps,psQuote}=require('./engine.cjs');
const {adapters,scanNetwork}=require('./network.cjs');
let win,controller,tray,quitting=false,statusText='Ready for setup',timer,awake;const root=process.env.ALPINE_SERVER_QA_PROFILE||app.getPath('userData');
if(process.env.ALPINE_SERVER_QA_PROFILE)app.setPath('userData',root);
if(!app.requestSingleInstanceLock())app.quit();else app.on('second-instance',()=>{win?.show();win?.focus();});
function createWindow(){win=new BrowserWindow({width:1080,height:820,minWidth:850,minHeight:650,title:'Alpine Local Server',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});win.loadFile(path.join(__dirname,'index.html'));win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.on('close',event=>{if(!quitting){event.preventDefault();win.hide();}});}
function checked(event){if(event.sender!==win?.webContents||!event.senderFrame?.url.startsWith('file:'))throw Error('Invalid manager window.');}
function handler(name,action){ipcMain.handle(name,async(event,...args)=>{checked(event);try{return {ok:true,value:await action(...args)};}catch(error){return {ok:false,error:error.message||'The action could not be completed.'};}});}
app.whenReady().then(async()=>{
 const runtime=process.env.ALPINE_SERVER_QA_RUNTIME||(app.isPackaged?process.resourcesPath:path.join(__dirname,'../runtime'));
 controller=new Controller({root,runtime,nodeExe:process.execPath,safeStorage,progress:text=>{statusText=text;}});createWindow();
 tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'brand.png')).resize({width:20,height:20}));tray.setToolTip('Alpine Local Server');tray.setContextMenu(Menu.buildFromTemplate([{label:'Open server',click:()=>win.show()},{type:'separator'},{label:'Stop and exit',click:async()=>{const result=await dialog.showMessageBox(win,{type:'warning',buttons:['Keep running','Stop server'],defaultId:0,cancelId:0,message:'Stop the restaurant server?',detail:'Local waiter login, orders and counter synchronization will be unavailable until this server is started again.'});if(result.response===1){quitting=true;app.quit();}}}]));tray.on('double-click',()=>win.show());
 handler('server:status',async()=>({...await controller.status(),message:statusText,autoStart:app.getLoginItemSettings().openAtLogin}));
 handler('server:devices',()=>controller.devices());
 handler('server:network',()=>adapters());handler('server:scan-network',index=>scanNetwork(index));handler('server:network-settings',()=>shell.openExternal('ms-settings:network-status'));
 handler('server:setup',async input=>{if(!input||typeof input.password!=='string'||input.password.length>128||!input.confirmReleased)throw Error('Confirm that all counters have synced and signed out.');const result=await controller.setup(input);app.setLoginItemSettings({openAtLogin:input.autoStart!==false});return result;});
 handler('server:resume',()=>controller.setup({}));handler('server:cancel',()=>controller.cancel());
 handler('server:open-admin',async()=>{const status=await controller.status();if(status.phase!=='active')throw Error('Finish setup first.');await shell.openExternal(status.admin);});
 handler('server:autostart',value=>{app.setLoginItemSettings({openAtLogin:!!value});return true;});
 handler('server:firewall',async()=>{
  const port=controller.config?.port||4250;const command="New-NetFirewallRule -DisplayName 'Alpine Local Server - Private LAN' -Direction Inbound -Action Allow -Protocol TCP -LocalPort "+port+" -RemoteAddress LocalSubnet -Profile Private -ErrorAction Stop | Out-Null";
  const script=path.join(root,'allow-private-lan.ps1');fs.writeFileSync(script,command+'\r\n');
  await ps('Start-Process -FilePath powershell.exe -ArgumentList '+psQuote('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "'+script+'"')+' -Verb RunAs -WindowStyle Hidden -Wait');return true;
 });
 handler('server:backup',async password=>{if(typeof password!=='string'||password.length<12)throw Error('Use a backup password with at least 12 characters.');const result=await dialog.showSaveDialog(win,{title:'Save encrypted restaurant backup',defaultPath:'Alpine-server-backup-'+new Date().toISOString().slice(0,10)+'.alpinebackup',filters:[{name:'Encrypted Alpine backup',extensions:['alpinebackup']}]});if(result.canceled)return false;await controller.backup(result.filePath,password);return true;});
 handler('server:folder',()=>shell.openPath(root));
 awake=powerSaveBlocker.start('prevent-app-suspension');
 if(controller.config?.phase==='active'){try{await controller.start();statusText='Restaurant server running';}catch(error){statusText=error.message;}}
 let watching=false;timer=setInterval(async()=>{if(watching||controller.busy||quitting||controller.config?.phase!=='active')return;watching=true;try{if(controller.children.some(p=>p.exitCode!==null)){await controller.stopApps();await controller.start();statusText='Server restarted; saved records retained.';}}catch(error){statusText=error.message;}finally{watching=false;}},10000);
}).catch(error=>{if(process.env.ALPINE_SERVER_QA_PROFILE)console.error(error.stack);dialog.showErrorBox('Alpine Local Server','The server manager could not start. Check its installation and Windows profile encryption.');app.exit(1);});
app.on('window-all-closed',()=>{});let stopping=false;app.on('before-quit',event=>{quitting=true;if(stopping)return;event.preventDefault();stopping=true;clearInterval(timer);void controller?.stop().finally(()=>{if(awake!==undefined&&powerSaveBlocker.isStarted(awake))powerSaveBlocker.stop(awake);app.quit();});});
