/* ────────── resumable Owner handoff, local runtimes and encrypted backup ────────── */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os'),net=require('node:net'),{spawn}=require('node:child_process'),{createRequire}=require('node:module');
const {MongoEngine}=require('./engine.cjs');const {localResponse}=require('./localHttp.cjs');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const {SqliteEngine}=require('./sqlite-engine.cjs');const {ConfigStore}=require('./config-store.cjs');const {protectedStorage}=require('./protected-storage.cjs');
const {cloudRequest}=require('./cloud-request.cjs');
const secret=()=>crypto.randomBytes(48).toString('base64url');
function processHost(){const directory=__dirname.replace(/app\.asar([\\/])/,'app.asar.unpacked$1'),installed=path.join(directory,'server-process-host.exe');return fs.existsSync(installed)?installed:path.join(__dirname,'../dist/server-process-host.exe');}
function addresses(port){const entries=Object.entries(os.networkInterfaces()).flatMap(([name,items])=>(items||[]).map(item=>({...item,name}))).filter(n=>n.family==='IPv4'&&!n.internal&&(/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address)));const physical=entries.filter(n=>!/vEthernet|VMware|VirtualBox|WSL|docker|Tailscale|WireGuard|OpenVPN|vbox/i.test(n.name));return (physical.length?physical:entries).map(n=>'http://'+n.address+':'+port);}
async function freePort(port){await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',()=>reject(Error('Port '+port+' is already in use. Stop the other server first.')));server.listen(port,'127.0.0.1',()=>server.close(resolve));});}
class Controller{
 constructor({root,runtime,nodeExe,safeStorage,progress=()=>{},startupTimeout=120000,cloudFetch=fetch,diagnostic=()=>{}}){
  this.cloudFetch=cloudFetch;this.diagnostic=diagnostic;
  this.root=root;this.runtime=runtime;this.nodeExe=nodeExe;this.safeStorage=safeStorage;this.progress=progress;this.startupTimeout=startupTimeout;this.busy=false;this.children=[];this.error='';
  fs.mkdirSync(root,{recursive:true});this.require=createRequire(path.join(runtime,'api/package.json'));this.MongoClient=this.require('mongoose').mongo.MongoClient;this.crypto=this.require('./dist/utils/hubCrypto');this.collections=this.require('./dist/config/hub').HUB_COLLECTIONS;
  this.file=path.join(root,'server-config.bin');const storageHost=processHost();this.safeStorage=protectedStorage(safeStorage,storageHost);this.settings=new ConfigStore(this.file,this.safeStorage,progress);this.config=this.load();this.stopping=false;this.startFlight=null;this.adminHealthFailures=0;this.cachedService=null;this.serviceRead=null;
 }
 load(){return this.settings.load();}
 save(){this.settings.save(this.config);}
 fresh(){return {phase:'new',database:'sqlite',port:4250,adminPort:4251,dbName:'alpine_hub_restaurant_'+crypto.randomBytes(8).toString('hex'),jwtSecret:secret(),storageKey:crypto.randomBytes(32).toString('base64'),internal:secret(),keys:{}};}
 async connection(){if(this.config.database==='sqlite')return this.engine.connection();const client=new this.MongoClient(this.engine.uri(),{serverSelectionTimeoutMS:5000});await client.connect();return client;}
 cloudOrigin(value){const url=new URL(value);if(url.username||url.password||url.pathname!=='/'||url.search||url.hash||!(url.protocol==='https:'||(process.env.ALPINE_SERVER_QA==='1'&&url.hostname==='127.0.0.1'&&url.protocol==='http:')))throw Error('Use the HTTPS restaurant API address.');return url.origin;}
 async call(pathname,token,body){return cloudRequest(this.cloudFetch,this.config.cloud+'/api/'+pathname,token,body,this.diagnostic);}
 async mongo(){if(!this.engine){if(this.config.database==='sqlite'){this.engine=new SqliteEngine(this.root,this.config,this.require('./dist/storage/sqlite/store').SqliteStore,this.progress);}else{await freePort(this.config.mongoPort);this.engine=new MongoEngine(this.root,this.config,this.MongoClient,this.progress);}}await this.engine.start();}
 engineRunning(){return this.engine?.kind==='sqlite'?this.engine.running:!!this.engine?.child&&this.engine.child.exitCode===null&&!this.engine.child.killed;}
 async checkSqliteRuntime(){
  if(this.config.database!=='sqlite')return;
  this.progress('Checking this PC with a temporary SQLite database and isolated login…');
  await new Promise((resolve,reject)=>{
   const child=spawn(this.nodeExe,[path.join(this.runtime,'api/dist/storage/sqlite/check.js')],{cwd:this.root,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,stdio:['ignore','pipe','ignore']});let output='',settled=false;
   const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve();};
   const timer=setTimeout(()=>{child.kill();finish(Error('The PC readiness check timed out. Check the server log and try again.'));},60000);
   child.stdout.on('data',chunk=>{output=(output+chunk.toString()).slice(-2048);});
   child.once('error',()=>finish(Error('The server runtime could not start on this PC.')));
   child.once('exit',code=>finish(code===0&&output.includes('ALPINE_SQLITE_RUNTIME_OK')?null:Error('This PC did not pass the SQLite/API readiness check. No restaurant data was changed.')));
  });
 }
 async prepare(){if(this.config?.phase==='active')throw Error('The restaurant is already set up. Use Restart server.');if(this.busy)throw Error('Server setup is already running.');this.busy=true;try{if(!this.config){this.config=this.fresh();this.save();}await this.mongo();await this.checkSqliteRuntime();this.progress('Server engine and local login check passed. Now sync/sign out of the counters before Owner setup.');return true;}finally{this.busy=false;}}
 async setup(input){
  if(this.busy)throw Error('Server setup is already running.');if(this.config?.phase==='active')throw Error('This restaurant is already set up.');this.busy=true;
  try{
   if(!this.config){this.config=this.fresh();this.save();}const c=this.config;
   if(c.phase==='active')throw Error('This restaurant is already set up.');await this.stopApps();
   if(c.phase==='new'){
    c.cloud=this.cloudOrigin(input.cloud);c.label=String(input.label||'Restaurant server').trim().slice(0,100);this.save();
    // Check local prerequisites before pausing the live cloud restaurant.
    await this.mongo();await freePort(c.port);await freePort(c.adminPort);
    const login=await this.call('auth/login','',{email:input.identifier,password:input.password});if(login.user.role!=='owner')throw Error('Sign in with the restaurant Owner account.');
    const pair=crypto.generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});c.privateKey=pair.privateKey;c.publicKey=pair.publicKey;c.setupToken=login.token;this.save();
    this.progress('Checking released counters and preparing the cloud snapshot…');
    c.phase='preparing';this.save();let grant;try{grant=this.crypto.unEnvelope(await this.call('hub/begin',login.token,{publicKey:c.publicKey,label:c.label}),c.privateKey,'alpine-handoff');}catch(error){try{if((await this.call('hub/status',login.token)).phase==='inactive'){c.phase='new';delete c.setupToken;this.save();}}catch{}throw error;}c.grant=grant;c.phase='importing';this.save();
   }
   if(c.phase!=='new')await this.stopApps();
   if(c.phase==='preparing')throw Error('The cloud handoff response was interrupted. Cancel the unfinished setup before trying again.');await this.mongo();
   if(c.phase==='importing'){
    const snapshot=this.crypto.unEnvelope(await this.call('hub/bootstrap',c.grant.secret),c.privateKey,'alpine-bootstrap:'+c.grant.id);
    const client=await this.connection();try{
     const db=client.db(c.dbName);const existing=await db.collection('hub_install').findOne({_id:'main'});
     if(existing&&existing.snapshotHash!==snapshot.hash)throw Error('The local import belongs to another snapshot. Cancel setup and contact the developer; records were retained.');
     if(!existing){for(const name of this.collections)if(await db.collection(name).countDocuments())throw Error('The destination contains restaurant records. Setup will not overwrite them.');await db.collection('hub_install').insertOne({_id:'main',snapshotHash:snapshot.hash});}
     fs.mkdirSync(path.join(this.root,'backups'),{recursive:true});fs.writeFileSync(path.join(this.root,'backups/bootstrap-'+c.grant.id+'.enc'),JSON.stringify(this.crypto.seal(snapshot,Buffer.from(c.storageKey,'base64'),'alpine-bootstrap-backup')));
     for(const name of this.collections){for(const doc of snapshot.snapshot.collections[name]||[])await db.collection(name).replaceOne({_id:doc._id},doc,{upsert:true});}
     c.snapshotHash=snapshot.hash;c.keys=snapshot.snapshot.keys;c.phase='imported';this.save();
    }finally{await client.close();}
   }
   if(c.phase==='imported'){
    this.progress('Verifying the local API before activating the restaurant PC…');
    await this.startApi(true);await this.stopApps();
    await this.call('hub/activate',c.grant.secret,{hash:c.snapshotHash});c.phase='active';delete c.setupToken;this.save();
   }
   await this.start();this.progress('Local restaurant server ready. Connect the existing apps to the displayed LAN address.');return this.status();
  }catch(error){await this.stopApps();this.error=error.message;throw error;}finally{this.busy=false;}
 }
 env(test=false){const c=this.config;return {...process.env,NODE_ENV:'production',MONGODB_URI:c.database==='sqlite'?'':this.engine.uri(),ALPINE_SQLITE_FILE:c.database==='sqlite'?this.engine.filename:'',MONGODB_DB:c.dbName,JWT_SECRET:c.jwtSecret,...c.keys,IMAGE_PUBLIC_URL:c.cloud,ALPINE_LOCAL_HUB:'1',PORT:String(c.port),ALPINE_HUB_BIND:test?'127.0.0.1':'0.0.0.0',ALPINE_HUB_PREFLIGHT:test?'1':'0',ALPINE_HUB_INTERNAL:c.internal,ALPINE_HUB_STORAGE_KEY:c.storageKey,...(!test?{ALPINE_HUB_CLOUD:c.cloud,ALPINE_HUB_ID:c.grant.id,ALPINE_HUB_DEVICE_KEY:c.grant.secret,ALPINE_HUB_PRIVATE_KEY:c.privateKey}:{ALPINE_HUB_CLOUD:''})};}
 launch(entry,cwd,env){
  const protectedHost=processHost();if(process.platform==='win32'&&!fs.existsSync(protectedHost))throw Error('The protected server runtime is missing. Reinstall the current server update.');
  const p=spawn(process.platform==='win32'?protectedHost:this.nodeExe,process.platform==='win32'?[String(process.pid),this.nodeExe,entry]:[entry],{cwd,env:{...env,ELECTRON_RUN_AS_NODE:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true});p.serverRole=/local-(sqlite-)?server\.js$/.test(entry)?'api':'admin';
  const logDir=path.join(this.root,'logs');fs.mkdirSync(logDir,{recursive:true});const logFile=path.join(logDir,p.serverRole+'.log');
  if(fs.existsSync(logFile)&&fs.statSync(logFile).size>256*1024)fs.renameSync(logFile,logFile+'.previous-'+Date.now());
  const redact=text=>{let value=String(text).replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/gi,'[private MongoDB connection]');for(const [name,secret]of Object.entries(env))if(/SECRET|PASSWORD|TOKEN|KEY|MONGODB_URI/i.test(name)&&typeof secret==='string'&&secret.length>=12)value=value.split(secret).join('[redacted]');return value;};
  const log=chunk=>{try{if(!fs.existsSync(logFile)||fs.statSync(logFile).size<512*1024)fs.appendFileSync(logFile,redact(chunk));}catch{}};
  p.once('error',()=>{this.error='A server process could not start.';});p.stdout.on('data',log);p.stderr.on('data',log);this.children.push(p);return p;
 }
 async ready(url,child,identity=false){
  const deadline=Date.now()+this.startupTimeout;let nextProgress=0;
  while(Date.now()<deadline){
   if(this.stopping)throw Error('Server startup was stopped.');
   if(child.exitCode!==null||child.signalCode||child.killed)throw Error('A server process stopped during startup. Check the server logs.');
   try{const response=await localResponse(url,{timeout:Math.min(2000,Math.max(50,deadline-Date.now()))});if(response.ok){if(identity){const status=await localResponse('http://127.0.0.1:'+this.config.port+'/local-server/status',{headers:{'x-alpine-local-key':this.config.internal},timeout:2000});if(!status.ok||!status.json().capture)throw Error('Local server identity has not been confirmed.');}return;}}catch{}
   if(Date.now()>=nextProgress){this.progress('Starting '+(child.serverRole==='admin'?'Admin':'local API')+'… please wait; existing records are retained.');nextProgress=Date.now()+5000;}
   await wait(250);
  }
  throw Error('The server is taking too long to start. Its unfinished process has been stopped; you can safely resume setup.');
 }
 async stopChild(child){
  if(!child)return;this.children=this.children.filter(p=>p!==child);
  if(child.serverRole==='api'){this.apiReady=false;this.cachedService=null;}
  if(child.exitCode===null&&!child.signalCode)await new Promise(resolve=>{const timer=setTimeout(resolve,8000);child.once('exit',()=>{clearTimeout(timer);resolve();});try{child.kill();}catch{clearTimeout(timer);resolve();}});
  // Windows closes job children after the host handle exits. Wait for that
  // bounded cleanup before trying to bind the same port on a restart.
  const port=child.serverRole==='api'?this.config?.port:this.config?.adminPort;if(Number.isInteger(port)&&port>0){const until=Date.now()+3000;while(Date.now()<until){try{await freePort(port);break;}catch{await wait(50);}}}
 }
 async startApi(test=false){
  this.apiReady=false;
  const c=this.config;await freePort(c.port);const data=path.join(this.root,'api-data');fs.mkdirSync(data,{recursive:true});const child=this.launch(path.join(this.runtime,'api/dist',c.database==='sqlite'?'local-sqlite-server.js':'local-server.js'),data,this.env(test));
  try{await this.ready('http://127.0.0.1:'+c.port+'/health',child,true);this.apiReady=true;}catch(error){await this.stopChild(child);throw error;}
 }
 async start(force=false){if(this.stopping)return;if(this.startFlight)return this.startFlight;this.startFlight=this.startImpl(force).finally(()=>{this.startFlight=null;});return this.startFlight;}
 async startImpl(force=false){
  if(!this.config||this.config.phase!=='active')return;await this.mongo();const alive=this.children.filter(p=>p.exitCode===null&&!p.killed);
  if(!force&&alive.some(p=>p.serverRole==='api')&&alive.some(p=>p.serverRole==='admin'))return;
  await this.stopApps();try{await this.startApi();const c=this.config;await freePort(c.adminPort);const child=this.launch(path.join(this.runtime,'admin/server.js'),path.join(this.runtime,'admin'),{...process.env,NODE_ENV:'production',PORT:String(c.adminPort),HOSTNAME:'127.0.0.1',API_URL:'http://127.0.0.1:'+c.port,COOKIE_SECURE:'false'});await this.ready('http://127.0.0.1:'+c.adminPort+'/login',child);this.error='';}catch(error){await this.stopApps();this.error=error.message;throw error;}
 }
 async stopApps(){const children=[...this.children];await Promise.all(children.map(child=>this.stopChild(child)));}
 async stop(){this.stopping=true;await this.stopApps();await this.startFlight?.catch(()=>{});await this.engine?.stop();}
 async restartAdmin(){const child=this.children.find(p=>p.serverRole==='admin');if(child)await this.stopChild(child);const c=this.config;await freePort(c.adminPort);const next=this.launch(path.join(this.runtime,'admin/server.js'),path.join(this.runtime,'admin'),{...process.env,NODE_ENV:'production',PORT:String(c.adminPort),HOSTNAME:'127.0.0.1',API_URL:'http://127.0.0.1:'+c.port,COOKIE_SECURE:'false'});await this.ready('http://127.0.0.1:'+c.adminPort+'/login',next);this.adminHealthFailures=0;this.diagnostic('Admin screen recovered; local order API retained.');}
 async healthy(){const apiChild=this.children.find(p=>p.serverRole==='api');if(!apiChild||apiChild.exitCode!==null||apiChild.killed||!this.engineRunning())return false;try{const api=await localResponse('http://127.0.0.1:'+this.config.port+'/local-server/status',{headers:{'x-alpine-local-key':this.config.internal},timeout:8000});if(!api.ok||!api.json().capture)return false;}catch{return false;}let adminReady=false;const adminChild=this.children.find(p=>p.serverRole==='admin');if(adminChild&&adminChild.exitCode===null&&!adminChild.killed)try{adminReady=(await localResponse('http://127.0.0.1:'+this.config.adminPort+'/login',{timeout:5000})).ok;}catch{}if(adminReady)this.adminHealthFailures=0;else if(++this.adminHealthFailures>=3)try{await this.restartAdmin();}catch{this.diagnostic('Admin recovery is pending; local order API retained.');}return true;}
 async cancel(){if(this.config?.phase==='active')throw Error('An active server cannot be cancelled.');if(!this.config?.setupToken)throw Error('An active server cannot be cancelled.');await this.stopApps();const status=await this.call('hub/status',this.config.setupToken);if(status.phase!=='inactive')await this.call('hub/cancel',this.config.setupToken,{});await this.engine?.stop();this.engine=null;this.config.phase='new';this.config.dbName='alpine_hub_restaurant_'+crypto.randomBytes(8).toString('hex');delete this.config.grant;delete this.config.setupToken;this.save();}
 async readService(){if(this.serviceRead)return this.serviceRead;const c=this.config;this.serviceRead=(async()=>{try{const response=await localResponse('http://127.0.0.1:'+c.port+'/local-server/status',{headers:{'x-alpine-local-key':c.internal},timeout:5000});if(response.ok){const service=await response.json();this.cachedService={at:Date.now(),service};return service;}}catch{}return this.cachedService&&Date.now()-this.cachedService.at<30000?this.cachedService.service:null;})().finally(()=>{this.serviceRead=null;});return this.serviceRead;}
 async status(){const c=this.config;const service=c?.phase==='active'?await this.readService():null;
  return {version:require('../package.json').version,database:c?.database==='sqlite'?'SQLite':'MongoDB',phase:c?.phase||'new',label:c?.label||'',addresses:addresses(c?.port||4250),admin:c?'http://127.0.0.1:'+c.adminPort:'',service,busy:this.busy,error:this.error,canCancel:!!c?.setupToken,starting:!!this.startFlight,settingsRecovered:this.settings.recovered};
 }
 async devices(){if(this.config?.phase!=='active')return {devices:[]};const response=await localResponse('http://127.0.0.1:'+this.config.port+'/local-server/devices',{headers:{'x-alpine-local-key':this.config.internal},timeout:2000});if(!response.ok)throw Error('Device status is temporarily unavailable.');return response.json();}
 async backup(destination,password){if(!this.config||password.length<12)throw Error('Use a backup password with at least 12 characters.');const client=await this.connection();try{const collections={};const session=client.startSession();try{await session.withTransaction(async()=>{for(const name of this.collections)collections[name]=await client.db(this.config.dbName).collection(name).find({},{session}).toArray();},{readConcern:{level:'snapshot'}});}finally{await session.endSession();}const salt=crypto.randomBytes(32),key=crypto.pbkdf2Sync(password,salt,310000,32,'sha256');const archive={version:1,at:new Date(),config:this.config,collections};fs.writeFileSync(destination,JSON.stringify({format:'alpine-local-server-backup-v1',salt:salt.toString('base64'),iterations:310000,payload:this.crypto.seal(archive,key,'alpine-server-backup')}));}finally{await client.close();}}
}
module.exports={Controller,addresses,freePort};
