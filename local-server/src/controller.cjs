/* ────────── resumable Owner handoff, local runtimes and encrypted backup ────────── */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os'),net=require('node:net'),{spawn}=require('node:child_process'),{createRequire}=require('node:module');
const {MongoEngine}=require('./engine.cjs');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const secret=()=>crypto.randomBytes(48).toString('base64url');
function addresses(port){return Object.values(os.networkInterfaces()).flat().filter(n=>n&&n.family==='IPv4'&&!n.internal&&(/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address))).map(n=>'http://'+n.address+':'+port);}
async function freePort(port){await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',()=>reject(Error('Port '+port+' is already in use. Stop the other server first.')));server.listen(port,'127.0.0.1',()=>server.close(resolve));});}
class Controller{
 constructor({root,runtime,nodeExe,safeStorage,progress=()=>{}}){
  this.root=root;this.runtime=runtime;this.nodeExe=nodeExe;this.safeStorage=safeStorage;this.progress=progress;this.busy=false;this.children=[];this.error='';
  fs.mkdirSync(root,{recursive:true});this.require=createRequire(path.join(runtime,'api/package.json'));this.MongoClient=this.require('mongoose').mongo.MongoClient;this.crypto=this.require('./dist/utils/hubCrypto');this.collections=this.require('./dist/config/hub').HUB_COLLECTIONS;
  this.file=path.join(root,'server-config.bin');this.config=this.load();
 }
 load(){if(!fs.existsSync(this.file))return null;if(!this.safeStorage.isEncryptionAvailable())throw Error('Windows encryption is unavailable.');return JSON.parse(this.safeStorage.decryptString(fs.readFileSync(this.file)));}
 save(){if(!this.safeStorage.isEncryptionAvailable())throw Error('Windows encryption is required before storing server credentials.');const temporary=this.file+'.tmp';fs.writeFileSync(temporary,this.safeStorage.encryptString(JSON.stringify(this.config)));fs.renameSync(temporary,this.file);}
 fresh(){return {phase:'new',port:4250,adminPort:4251,mongoPort:27180,dbName:'alpine_hub_restaurant_'+crypto.randomBytes(8).toString('hex'),mongoUser:'alpine_'+crypto.randomBytes(8).toString('hex'),mongoPassword:secret(),jwtSecret:secret(),storageKey:crypto.randomBytes(32).toString('base64'),internal:secret(),keys:{}};}
 async connection(){const client=new this.MongoClient(this.engine.uri(),{serverSelectionTimeoutMS:5000});await client.connect();return client;}
 cloudOrigin(value){const url=new URL(value);if(url.username||url.password||url.pathname!=='/'||url.search||url.hash||!(url.protocol==='https:'||(process.env.ALPINE_SERVER_QA==='1'&&url.hostname==='127.0.0.1'&&url.protocol==='http:')))throw Error('Use the HTTPS restaurant API address.');return url.origin;}
 async call(pathname,token,body){const r=await fetch(this.config.cloud+'/api/'+pathname,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(120000)});const value=await r.json();if(!r.ok)throw Error(value.error||'The cloud request could not be completed.');return value;}
 async mongo(){if(!this.engine){await freePort(this.config.mongoPort);this.engine=new MongoEngine(this.root,this.config,this.MongoClient,this.progress);}await this.engine.start();}
 async setup(input){
  if(this.busy)throw Error('Server setup is already running.');this.busy=true;
  try{
   if(!this.config){this.config=this.fresh();this.save();}const c=this.config;
   if(c.phase==='active')throw Error('This restaurant is already set up.');
   if(c.phase==='new'){
    c.cloud=this.cloudOrigin(input.cloud);c.label=String(input.label||'Restaurant server').trim().slice(0,100);this.save();
    // Check local prerequisites before pausing the live cloud restaurant.
    await this.mongo();await freePort(c.port);await freePort(c.adminPort);
    const login=await this.call('auth/login','',{email:input.identifier,password:input.password});if(login.user.role!=='owner')throw Error('Sign in with the restaurant Owner account.');
    const pair=crypto.generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});c.privateKey=pair.privateKey;c.publicKey=pair.publicKey;c.setupToken=login.token;this.save();
    this.progress('Checking released counters and preparing the cloud snapshot…');
    c.phase='preparing';this.save();let grant;try{grant=this.crypto.unEnvelope(await this.call('hub/begin',login.token,{publicKey:c.publicKey,label:c.label}),c.privateKey,'alpine-handoff');}catch(error){try{if((await this.call('hub/status',login.token)).phase==='inactive'){c.phase='new';delete c.setupToken;this.save();}}catch{}throw error;}c.grant=grant;c.phase='importing';this.save();
   }
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
  }finally{this.busy=false;}
 }
 env(test=false){const c=this.config;return {...process.env,NODE_ENV:'production',MONGODB_URI:this.engine.uri(),MONGODB_DB:c.dbName,JWT_SECRET:c.jwtSecret,...c.keys,IMAGE_PUBLIC_URL:c.cloud,ALPINE_LOCAL_HUB:'1',PORT:String(c.port),ALPINE_HUB_BIND:test?'127.0.0.1':'0.0.0.0',ALPINE_HUB_PREFLIGHT:test?'1':'0',ALPINE_HUB_INTERNAL:c.internal,ALPINE_HUB_STORAGE_KEY:c.storageKey,...(!test?{ALPINE_HUB_CLOUD:c.cloud,ALPINE_HUB_ID:c.grant.id,ALPINE_HUB_DEVICE_KEY:c.grant.secret,ALPINE_HUB_PRIVATE_KEY:c.privateKey}:{ALPINE_HUB_CLOUD:''})};}
 launch(entry,cwd,env){const p=spawn(this.nodeExe,[entry],{cwd,env:{...env,ELECTRON_RUN_AS_NODE:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true});p.once('error',()=>{this.error='A server process could not start.';});p.stdout.on('data',()=>{});p.stderr.on('data',()=>{});this.children.push(p);return p;}
 async ready(url,child){for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error('A server process stopped during startup. Check its local prerequisites.');try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)return;}catch{}await wait(250);}throw Error('The server did not become ready.');}
 async startApi(test=false){const c=this.config;await freePort(c.port);const data=path.join(this.root,'api-data');fs.mkdirSync(data,{recursive:true});const child=this.launch(path.join(this.runtime,'api/dist/local-server.js'),data,this.env(test));await this.ready('http://127.0.0.1:'+c.port+'/health',child);}
 async start(){if(!this.config||this.config.phase!=='active')return;await this.mongo();if(this.children.some(p=>p.exitCode===null))return;await this.startApi();const c=this.config;await freePort(c.adminPort);const child=this.launch(path.join(this.runtime,'admin/server.js'),path.join(this.runtime,'admin'),{...process.env,NODE_ENV:'production',PORT:String(c.adminPort),HOSTNAME:'127.0.0.1',API_URL:'http://127.0.0.1:'+c.port,COOKIE_SECURE:'false'});await this.ready('http://127.0.0.1:'+c.adminPort+'/login',child);}
 async stopApps(){const children=this.children;this.children=[];for(const p of children)if(p.exitCode===null){p.kill();await Promise.race([new Promise(r=>p.once('exit',r)),wait(8000)]);}}
 async stop(){await this.stopApps();await this.engine?.stop();}
 async cancel(){if(!this.config?.setupToken)throw Error('An active server cannot be cancelled.');const status=await this.call('hub/status',this.config.setupToken);if(status.phase!=='inactive')await this.call('hub/cancel',this.config.setupToken,{});this.config.phase='new';this.config.dbName='alpine_hub_restaurant_'+crypto.randomBytes(8).toString('hex');delete this.config.grant;delete this.config.setupToken;this.save();}
 async status(){const c=this.config;let service=null;if(c?.phase==='active'){try{const response=await fetch('http://127.0.0.1:'+c.port+'/local-server/status',{headers:{'x-alpine-local-key':c.internal},signal:AbortSignal.timeout(1000)});if(response.ok)service=await response.json();}catch{}}
  return {version:'1.0.0',phase:c?.phase||'new',label:c?.label||'',addresses:addresses(c?.port||4250),admin:c?'http://127.0.0.1:'+c.adminPort:'',service,busy:this.busy,error:this.error,canCancel:!!c?.setupToken};
 }
 async devices(){if(this.config?.phase!=='active')return {devices:[]};const response=await fetch('http://127.0.0.1:'+this.config.port+'/local-server/devices',{headers:{'x-alpine-local-key':this.config.internal},signal:AbortSignal.timeout(2000)});if(!response.ok)throw Error('Device status is temporarily unavailable.');return response.json();}
 async backup(destination,password){if(!this.config||password.length<12)throw Error('Use a backup password with at least 12 characters.');const client=await this.connection();try{const collections={};const session=client.startSession();try{await session.withTransaction(async()=>{for(const name of this.collections)collections[name]=await client.db(this.config.dbName).collection(name).find({},{session}).toArray();},{readConcern:{level:'snapshot'}});}finally{await session.endSession();}const salt=crypto.randomBytes(32),key=crypto.pbkdf2Sync(password,salt,310000,32,'sha256');const archive={version:1,at:new Date(),config:this.config,collections};fs.writeFileSync(destination,JSON.stringify({format:'alpine-local-server-backup-v1',salt:salt.toString('base64'),iterations:310000,payload:this.crypto.seal(archive,key,'alpine-server-backup')}));}finally{await client.close();}}
}
module.exports={Controller,addresses,freePort};
