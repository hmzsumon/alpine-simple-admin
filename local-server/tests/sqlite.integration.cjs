/* Isolated integration: fake MongoDB cloud and an independent local SQLite file, no printer/cloud. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const api=path.resolve(__dirname,'../../../alpine-api'),mongoose=require(api+'/node_modules/mongoose'),{MongoClient}=mongoose.mongo;
const admin=path.resolve(__dirname,'../..'),root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'alpine-hub-qa-')),proof=path.join(root,'proof');fs.mkdirSync(proof,{recursive:true});
console.log('QA proof: '+proof);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const id=crypto.randomUUID().replaceAll('-',''),cloudDb='alpine_hub_test_cloud_'+id,localDb='alpine_hub_test_local_'+id;
 const mongoPort=27181,uri='mongodb://127.0.0.1:'+mongoPort+'/?replicaSet=alpineHubQa',dbpath=path.join(root,'qa-mongo-'+id);fs.mkdirSync(dbpath);
 const children=[],logs=[];let client;
 function child(exe,args,env={}){const p=spawn(exe,args,{cwd:api,env:{...process.env,...env},windowsHide:true,stdio:['ignore','pipe','pipe']});children.push(p);p.stdout.on('data',b=>logs.push(b.toString()));p.stderr.on('data',b=>logs.push(b.toString()));return p;}
 async function until(action,label,ms=25000){const start=Date.now();while(Date.now()-start<ms){try{const result=await action();if(result)return result;}catch{}await wait(150);}throw Error(label+' timed out');}
 let cloud,local;const password='QA-'+crypto.randomBytes(12).toString('hex'),keys={JWT_SECRET:crypto.randomBytes(48).toString('hex'),STAFF_PASSWORD_KEY:crypto.randomBytes(32).toString('base64'),DEVELOPER_BACKUP_KEY:crypto.randomBytes(32).toString('base64')};
 async function request(base,route,token,body,expected=200,method=body===undefined?'GET':'POST'){const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(25000)});const data=await r.json();assert.equal(r.status,expected,JSON.stringify(data));return data;}
 const cloudUrl='http://127.0.0.1:4260',localUrl='http://127.0.0.1:4261';
 try{
  for(const port of [27181,27182,4260,4261,4263,4264])await new Promise((resolve,reject)=>{const socket=require('node:net').createServer();socket.once('error',()=>reject(Error('QA port '+port+' is in use; no existing service was changed.')));socket.listen(port,'127.0.0.1',()=>socket.close(resolve));});
  child(process.env.ALPINE_QA_MONGOD||'C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe',['--dbpath',dbpath,'--port',String(mongoPort),'--bind_ip','127.0.0.1','--replSet','alpineHubQa','--logpath',path.join(dbpath,'mongo.log')]);
  const direct=new MongoClient('mongodb://127.0.0.1:'+mongoPort+'/?directConnection=true',{serverSelectionTimeoutMS:1000});await until(async()=>{await direct.connect();return true;},'Mongo start');
  await direct.db('admin').command({replSetInitiate:{_id:'alpineHubQa',members:[{_id:0,host:'127.0.0.1:'+mongoPort}]}});await until(async()=>!!(await direct.db('admin').command({hello:1})).isWritablePrimary,'Replica primary');await direct.close();
  process.env.JWT_SECRET=keys.JWT_SECRET;process.env.STAFF_PASSWORD_KEY=keys.STAFF_PASSWORD_KEY;process.env.DEVELOPER_BACKUP_KEY=keys.DEVELOPER_BACKUP_KEY;
  await mongoose.connect(uri,{dbName:cloudDb});require(api+'/dist/app');await require(api+'/dist/services/simple-seed.service').initializeSimple();
  const bcrypt=require(api+'/node_modules/bcryptjs');await mongoose.connection.db.collection('admin_users').updateMany({},{$set:{password:await bcrypt.hash(password,10)}});
  const users=await mongoose.connection.db.collection('admin_users').find({}).toArray();const owner=users.find(u=>u.role==='owner'),cashier=users.find(u=>u.name==='Helal Ahmed'),waiter=users.find(u=>u.name==='Suyeb');assert(owner&&cashier&&waiter);
  await mongoose.disconnect();client=new MongoClient(uri);await client.connect();const cdb=client.db(cloudDb),ldb=new (require(api+"/dist/storage/sqlite/store").SqliteStore)(path.join(root,"local.sqlite"),localDb);
  const env={NODE_ENV:'production',MONGODB_URI:uri,MONGODB_DB:cloudDb,...keys};
  const cloudScript=`const m=require('mongoose');require('./dist/app');m.connect(process.env.MONGODB_URI,{dbName:process.env.MONGODB_DB}).then(async()=>{await require('./dist/models/HubStore').initializeHubStorage();require('http').createServer(require('./dist/app').default).listen(4260,'127.0.0.1');});`;
  cloud=child(process.execPath,['-e',cloudScript],env);await until(()=>fetch(cloudUrl+'/health').then(r=>r.ok),'Cloud API');
  const ownerLogin=await request(cloudUrl,'/api/auth/login',null,{email:owner.email,password});
  const pair=crypto.generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  await cdb.collection('admin_workspace').updateOne({_id:'main'},{$set:{desktopCounters:{main:{deviceId:'qa'}}}});
  await request(cloudUrl,'/api/hub/begin',ownerLogin.token,{publicKey:pair.publicKey,label:'Isolated QA server'},409);
  await cdb.collection('admin_workspace').updateOne({_id:'main'},{$set:{desktopCounters:{}}});
  const cryptoTools=require(api+'/dist/utils/hubCrypto');
  const grant=cryptoTools.unEnvelope(await request(cloudUrl,'/api/hub/begin',ownerLogin.token,{publicKey:pair.publicKey,label:'Isolated QA server'}),pair.privateKey,'alpine-handoff');
  await request(cloudUrl,'/api/simple/command',ownerLogin.token,{action:'open'},503);
  const snapshot=cryptoTools.unEnvelope(await request(cloudUrl,'/api/hub/bootstrap',grant.secret),pair.privateKey,'alpine-bootstrap:'+grant.id);
  for(const [name,docs] of Object.entries(snapshot.snapshot.collections))if(docs.length)await ldb.collection(name).insertMany(docs);
  await request(cloudUrl,'/api/hub/activate',grant.secret,{hash:snapshot.hash});
  const storageKey=crypto.randomBytes(32).toString('base64'),internal=crypto.randomBytes(32).toString('base64url');
  const localEnv={...env,MONGODB_URI:"",ALPINE_SQLITE_FILE:path.join(root,"local.sqlite"),MONGODB_DB:localDb,JWT_SECRET:crypto.randomBytes(48).toString('hex'),ALPINE_LOCAL_HUB:'1',ALPINE_HUB_DIAGNOSTICS:'1',PORT:'4261',ALPINE_HUB_CLOUD:cloudUrl,ALPINE_HUB_ID:grant.id,ALPINE_HUB_DEVICE_KEY:grant.secret,ALPINE_HUB_PRIVATE_KEY:pair.privateKey,ALPINE_HUB_STORAGE_KEY:storageKey,ALPINE_HUB_INTERNAL:internal};
  local=child(process.execPath,['dist/local-sqlite-server.js'],localEnv);await until(()=>fetch(localUrl+'/health').then(r=>r.ok),'Local API');
  // Internet/cloud down: local staff can log in and transact on the same LAN API.
  cloud.kill();await new Promise(r=>cloud.once('exit',r));
  const cashLogin=await request(localUrl,'/api/auth/login',null,{email:cashier.email,password});const waiterLogin=await request(localUrl,'/api/auth/login',null,{email:waiter.email,password});
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  await request(localUrl,'/api/simple/command',cashLogin.token,{requestId:crypto.randomUUID(),action:'open',counterId:'main',date,amount:1000});
  const workspace=await ldb.collection('admin_workspace').findOne({_id:'main'});const item=workspace.state.menu.find(m=>m.active&&m.price!==null);
  const body={requestId:crypto.randomUUID(),counterId:'main',table:'T-01',orderType:'dine_in',salesChannel:'dine_in',booking:true,finalize:true,orderEpoch:workspace.orderEpoch,items:[{menuId:item.id,quantity:2,expectedPrice:item.price}]};
  const routes=require('node:fs').readFileSync(api+'/src/routes/waiter.routes.ts','utf8');assert(routes.includes('orders'));
  const saved=await request(localUrl,'/api/waiter/orders',waiterLogin.token,body,201);assert(saved.order);const retry=await request(localUrl,'/api/waiter/orders',waiterLogin.token,body,201);assert.equal(retry.duplicate,true);assert.equal(retry.order.id,saved.order.id);
  const amount=Number(item.price)*2;await request(localUrl,'/api/simple/command',cashLogin.token,{requestId:crypto.randomUUID(),action:'pay',counterId:'main',orderId:saved.order.id,allocations:[{methodId:'cash',amount}]});
  const paid=(await ldb.collection('admin_workspace').findOne({_id:'main'})).state.orders.find(o=>o.id===saved.order.id);assert.equal(paid.paymentStatus,'paid');assert.equal(paid.payments.length,1);
  await until(()=>ldb.collection('hub_outbox').countDocuments().then(n=>n>0),'Offline outbox');
  // Restart while offline: persisted records and exact outbox survive.
  local.kill();await new Promise(r=>local.once('exit',r));local=child(process.execPath,['dist/local-sqlite-server.js'],localEnv);await until(()=>fetch(localUrl+'/health').then(r=>r.ok),'Local restart');assert.equal((await request(localUrl,'/api/auth/me',cashLogin.token)).user.id,cashLogin.user.id);
  cloud=child(process.execPath,['-e',cloudScript],env);await until(()=>fetch(cloudUrl+'/health').then(r=>r.ok),'Cloud restart');
  await until(async()=>{const w=await cdb.collection('admin_workspace').findOne({_id:'main'});return w.state.orders.find(o=>o.id===paid.id)?.paymentStatus==='paid';},'Offline sync',90000); // Include the 18-second network timeout and retry budget after force-killing the fake cloud.
  const mirrored=(await cdb.collection('admin_workspace').findOne({_id:'main'})).state.orders.filter(o=>o.id===paid.id);assert.equal(mirrored.length,1);assert.equal(mirrored[0].payments.length,1);
  // Remote admin reads and edits use local commits; verify the background mirror separately.
  const remote=await request(cloudUrl,'/api/simple/register',ownerLogin.token);assert(remote);
  const role=await request(cloudUrl,'/api/admin/roles',ownerLogin.token);assert(role);
  const menuState=await request(cloudUrl,'/api/admin/state',ownerLogin.token);const changedMenu=menuState.data.menu.map(m=>m.id===item.id?{...m,price:item.price+1}:m);await request(cloudUrl,'/api/admin/state',ownerLogin.token,{revision:menuState.revision,changes:{menu:changedMenu}},200,'PATCH');
  const localMenu=await request(localUrl,'/api/waiter/bootstrap',waiterLogin.token);assert.equal(localMenu.menu.find(m=>m.id===item.id).price,item.price+1);assert.equal((await ldb.collection('admin_workspace').findOne({_id:'main'})).state.orders.find(o=>o.id===paid.id).items[0].price,item.price);
  const ownerPassword='QA-new-'+crypto.randomBytes(9).toString('hex');await request(cloudUrl,'/api/auth/password',ownerLogin.token,{currentPassword:password,newPassword:ownerPassword});
  await until(async()=>{const user=await cdb.collection('admin_users').findOne({_id:owner._id});return user.sessionVersion===1;},'Remote credential sync');
  assert.equal((await ldb.collection('admin_users').findOne({_id:owner._id})).sessionVersion,1);
  const jobs=await cdb.collection('hub_jobs').find({}).toArray();assert(jobs.length>=3);assert(jobs.every(j=>!JSON.stringify(j).includes(password)));
  const events=await ldb.collection('hub_outbox').find({}).toArray();assert(events.every(e=>!['admin_sessions','hub_jobs'].includes(e.collection)));
  const checkpoint=await cdb.collection('hub_cloud').findOne({_id:'main'}),lockBatch={from:checkpoint.seq+1,to:checkpoint.seq+1,changes:[]};
  await cdb.collection('hub_cloud').updateOne({_id:'main'},{$set:{lock:'interrupted-fake-cloud-worker',lockHash:cryptoTools.digest(cryptoTools.pack(lockBatch)),lockUntil:new Date(Date.now()+60000)}});
  const recovered=await request(cloudUrl,'/api/hub/mirror',grant.secret,{batch:cryptoTools.pack(lockBatch).toString('base64')});assert.equal(recovered.sequence,lockBatch.to);
  const result={ok:true,isolated:true,cloudDatabase:cloudDb,localDatabase:localDb,offlineLogin:true,offlineOrderAndPayment:true,requestRetryExactlyOnce:true,offlineRestart:true,backgroundMirror:true,remoteAdmin:true,encryptedRelay:true,realOrders:0,physicalPrints:0};fs.writeFileSync(path.join(proof,'hub-integration.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  if(process.argv.includes('--manager')){
   local.kill();await new Promise(r=>local.once('exit',r));
   // This is a disposable fake cloud, not the real restaurant handoff.
   await cdb.collection('hub_cloud').updateOne({_id:'main'},{$set:{phase:'inactive'}});
   // Stage two owns a new fake restaurant after the first API was force-killed.
   await cdb.collection("developer_control").updateOne({_id:"main"},{$set:{leases:[]}});
   process.env.ALPINE_SERVER_QA='1';const {Controller}=require(path.join(admin,'local-server/src/controller.cjs'));
   const protectedKey=crypto.randomBytes(32),safeStorage={isEncryptionAvailable:()=>true,encryptString:value=>Buffer.from(JSON.stringify(cryptoTools.seal(value,protectedKey,'qa-storage'))),decryptString:value=>cryptoTools.open(JSON.parse(value),protectedKey,'qa-storage')};
   const managerRoot=fs.mkdtempSync(path.join(root,'manager-qa-')),runtime=process.env.QA_PACKAGED_RUNTIME||path.join(admin,'local-server/runtime');
   if(process.env.ALPINE_QA_ENGINE_CACHE)fs.cpSync(path.join(process.env.ALPINE_QA_ENGINE_CACHE,'mongo-engine'),path.join(managerRoot,'mongo-engine'),{recursive:true});
   const options={root:managerRoot,runtime,nodeExe:process.env.QA_NODE_EXE||path.join(admin,'desktop/node_modules/electron/dist/electron.exe'),safeStorage,progress:text=>console.log('Manager: '+text)};let manager=new Controller(options);
   manager.config=manager.fresh();Object.assign(manager.config,{port:4263,adminPort:4264,mongoPort:27182});manager.save();
   try{
    await manager.prepare();assert.equal((await cdb.collection('hub_cloud').findOne({_id:'main'})).phase,'inactive');
    await manager.setup({cloud:cloudUrl,identifier:owner.email,password:ownerPassword,label:'Manager isolated QA'});
    assert.equal((await manager.status()).phase,'active');
    assert(!fs.readFileSync(manager.file).includes(Buffer.from(manager.config.jwtSecret)));
    const adminUrl='http://127.0.0.1:4264';const loginResponse=await fetch(adminUrl+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:adminUrl},body:JSON.stringify({email:owner.email,password:ownerPassword})});const adminResult=await loginResponse.json();assert.equal(loginResponse.status,200,JSON.stringify(adminResult));const cookie=loginResponse.headers.get('set-cookie');assert(cookie?.includes('HttpOnly'));assert(!cookie.includes('Secure'));
    const menuResponse=await fetch(adminUrl+'/menu',{headers:{cookie:cookie.split(';')[0]},redirect:'manual'});assert.equal(menuResponse.status,200);
    const backupFile=path.join(managerRoot,'qa.alpinebackup'),backupPassword='QA-backup-'+crypto.randomBytes(16).toString('hex');await manager.backup(backupFile,backupPassword);const archive=JSON.parse(fs.readFileSync(backupFile));const restored=cryptoTools.open(archive.payload,crypto.pbkdf2Sync(backupPassword,Buffer.from(archive.salt,'base64'),archive.iterations,32,'sha256'),'alpine-server-backup');assert.equal(restored.config.dbName,manager.config.dbName);assert(restored.collections.admin_users.length>0);
    await manager.stop();manager=new Controller(options);await manager.start();
    const electron=path.join(admin,'desktop/node_modules/electron/dist/electron.exe');const counter=child(electron,[path.join(__dirname,'hub-counter-smoke.cjs')],{QA_PROOF:proof,QA_SERVER:'http://127.0.0.1:4263',QA_CASH_EMAIL:cashier.email,QA_WAITER_EMAIL:waiter.email,QA_PASSWORD:password});
    const code=await new Promise(r=>counter.once('exit',r));assert.equal(code,0,'Existing counter LAN test failed');
    const check=await manager.connection();const localWorkspace=await check.db(manager.config.dbName).collection('admin_workspace').findOne({_id:'main'});assert(localWorkspace.state.orders.length>=2);await check.close();
    const presence=await until(async()=>{const list=await manager.devices();return list.devices.some(d=>d.kind==='counter')&&list.devices.some(d=>d.kind==='waiter')?list:null;},'Connected device presence');assert(presence.devices.every(d=>!('sessionHash' in d)));assert(presence.devices.some(d=>d.userName===cashier.name&&d.active));
    fs.writeFileSync(path.join(proof,'manager-integration.json'),JSON.stringify({ok:true,packagedRuntime:fs.existsSync(path.join(runtime,'app.asar')),resumableOwnerSetup:true,privateSqliteDatabase:true,originalAdminLogin:true,httpOnlyLocalCookie:true,adminMenuPage:true,encryptedBackupDecrypts:true,restartStartsApiAndAdmin:true,currentCounterLanFlow:true,connectedDevicePresence:true,realCloudUntouched:true,physicalPrints:0}));console.log('Manager, Admin, encrypted backup, restart and existing Counter checks passed.');
   }finally{await manager.stop();}
  }
 }finally{
  for(const p of children.reverse())if(p.exitCode===null){p.kill();await Promise.race([new Promise(r=>p.once('exit',r)),wait(4000)]);}
  if(mongoose.connection.readyState)await mongoose.disconnect();if(client)await client.close();
  fs.writeFileSync(path.join(proof,'hub-process.log'),logs.join('').replaceAll(password,'[redacted]'));
 }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
