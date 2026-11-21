/* Actual Electron Chromium transport; loopback fixture only, no real Owner login. */
const {app,net}=require('electron'),http=require('node:http'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'alpine-cloud-network-qa-'));app.setPath('userData',root);app.disableHardwareAcceleration();
const {cloudRequest}=require('../src/cloud-request.cjs');let server;
(async()=>{await app.whenReady();let posts=0;server=http.createServer((req,res)=>{posts++;let body='';req.on('data',v=>body+=v);req.on('end',()=>{assert.equal(JSON.parse(body).fixture,'QA');res.setHeader('Content-Type','application/json');res.end('{"ok":true}');});});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/api/auth/login';
assert.equal((await cloudRequest((url,opts)=>net.fetch(url,opts),url,'',{fixture:'QA'})).ok,true);assert.equal(posts,1);
await new Promise(r=>server.close(r));server=null;const logs=[];await assert.rejects(cloudRequest((url,opts)=>net.fetch(url,opts),url,'',{fixture:'QA'},text=>logs.push(text)),/ERR_CONNECTION_REFUSED/);assert.equal(logs.length,1);console.log(JSON.stringify({ok:true,actualElectronNetwork:true,onePostOnly:true,failureCodeVisible:true,realCloudUntouched:true}));app.exit(0);
})().catch(error=>{console.error(error.message);server?.close();app.exit(1);});
