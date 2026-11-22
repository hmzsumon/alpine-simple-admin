const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn,spawnSync}=require('node:child_process');const {nativeHost,recoverInstance}=require('../src/manager-instance.cjs');
test('stalled-manager recovery verifies executable and exact process birth before stopping its own process',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'alpine-manager-rescue-')),child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'}),other=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});
 try{const inspected=spawnSync(nativeHost(),['--manager-birth',String(child.pid),process.execPath],{encoding:'utf8',windowsHide:true});assert.equal(inspected.status,0);const born=inspected.stdout.trim(),file=path.join(root,'manager-heartbeat.json'),base={pid:child.pid,birth:born,executable:process.execPath,startedAt:Date.now()-60000,at:Date.now()-40000,screenAt:Date.now()-40000};
 fs.writeFileSync(file,JSON.stringify({...base,at:Date.now(),screenAt:Date.now()}));assert.equal(recoverInstance(root,process.execPath),false);
 fs.writeFileSync(file,JSON.stringify({...base,birth:String(BigInt(born)+1n)}));assert.equal(recoverInstance(root,process.execPath),false);assert.equal(child.exitCode,null);
 fs.writeFileSync(file,JSON.stringify({...base,executable:process.execPath+'.unrelated'}));assert.equal(recoverInstance(root,process.execPath),false);assert.equal(child.exitCode,null);
 fs.writeFileSync(file,JSON.stringify(base));const exited=new Promise(r=>child.once('exit',r));assert.equal(recoverInstance(root,process.execPath),true);await exited;assert.equal(other.exitCode,null);
 }finally{if(child.exitCode===null)child.kill();other.kill();}
});
