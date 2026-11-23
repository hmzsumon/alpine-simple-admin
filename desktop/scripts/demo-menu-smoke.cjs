/* Real native developer demo with a disposable profile; no restaurant account or printer. */
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'alpine-demo-menu-native-'));app.setPath('userData',profile);app.commandLine.appendSwitch('disable-gpu');process.argv.push('--lan-demo');let main;
app.on('browser-window-created',(_event,win)=>{if(!main)main=win;win.hide();});
const wait=async fn=>{for(let i=0;i<300;i++){const value=await fn();if(value)return value;await new Promise(resolve=>setTimeout(resolve,50));}throw Error('Demo screen timed out');};
const call=async(name,value)=>{const result=await main.webContents.executeJavaScript('window.alpine['+JSON.stringify(name)+']('+JSON.stringify(value??null)+')');if(!result.ok)throw Error(result.error);return result.value;};
(async()=>{
 require(process.env.ALPINE_QA_ASAR||'../dist/main.cjs');await app.whenReady();await wait(()=>main&&!main.webContents.isLoading()&&main.webContents.getURL().endsWith('/index.html'));
 let state=await call('getState');assert.equal(state.demo,true);assert.equal(state.requiresLogin,false);assert.equal(state.settings.printMode,'preview');assert.equal(state.snapshot.catalog.menu.length,100);assert.equal(state.pending,0);assert.equal(app.getPath('userData'),path.join(profile,'home-demo'));
 const items=state.snapshot.catalog.menu.slice(0,40).map(item=>({menuId:item.id,quantity:1}));const result=await call('command',{action:'create',data:{salesChannel:'takeaway',items}});assert.equal(result.order.items.length,40);
 const amount=result.order.items.reduce((sum,item)=>sum+Math.round(item.price*100)*item.quantity,0);await call('command',{action:'pay',orderId:result.order.id,data:{allocations:[{methodId:'cash',amount:(amount/100).toFixed(2)}]}});
 await wait(async()=>{state=await call('getState');return state.snapshot.orders[0].payments?.length===1&&!state.prints.length;});assert.equal(state.pending,0);assert.equal(state.snapshot.orders.length,1);assert.equal(state.report.sales,amount);assert.equal(state.report.expectedCash,100000+amount);
 assert.equal(await main.webContents.executeJavaScript('typeof window.alpine.startDemo'),'undefined');await main.webContents.executeJavaScript("[...document.querySelectorAll('nav button')].find(button=>button.getAttribute('aria-label')==='New order').click()");await wait(()=>main.webContents.executeJavaScript("!!document.querySelector('#entry-item-code')"));assert.equal(await main.webContents.executeJavaScript("/Home Wi-Fi demo/.test(document.body.innerText)"),false);
 console.log(JSON.stringify({passed:true,menuItems:100,orderLines:40,realMain:true,realPreload:true,realSqlite:true,separateProfile:true,pendingUploads:0,physicalPrints:0,developerLaunchOnly:true}));app.exit(0);
})().catch(error=>{console.error(error.stack);app.exit(1);});
