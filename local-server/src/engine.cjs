/* ────────── private MongoDB process; never edits an existing Windows service or database ────────── */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn,execFile}=require('node:child_process'),{promisify}=require('node:util');
const execute=promisify(execFile),wait=ms=>new Promise(r=>setTimeout(r,ms));
const ENGINE_URL='https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.12.zip';
const ENGINE_SHA='d1b4a8ce75f0d474218768facb91f07b7de6d3d8126f3732c90d72978639049a';
const psQuote=value=>"'"+value.replaceAll("'","''")+"'";
function ps(command){return execute('powershell.exe',['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{windowsHide:true,maxBuffer:1024*1024});}
async function engineFile(root,progress){
 const base=path.join(process.env.ProgramFiles||'C:/Program Files','MongoDB/Server');
 if(fs.existsSync(base)){for(const version of fs.readdirSync(base).filter(v=>/^8\.0$/.test(v))){const file=path.join(base,version,'bin/mongod.exe');if(fs.existsSync(file))return file;}}
 const unpack=path.join(root,'mongo-engine'),file=path.join(unpack,'mongodb-win32-x86_64-windows-8.0.12/bin/mongod.exe');if(fs.existsSync(file))return file;
 progress('Downloading the verified MongoDB engine…');const zip=path.join(root,'mongodb-8.0.12.zip'),response=await fetch(ENGINE_URL,{signal:AbortSignal.timeout(300000)});if(!response.ok)throw Error('MongoDB download failed. Check the internet connection.');
 const hash=crypto.createHash('sha256'),stream=fs.createWriteStream(zip);for await(const chunk of response.body){hash.update(chunk);if(!stream.write(chunk))await new Promise(r=>stream.once('drain',r));}await new Promise((resolve,reject)=>{stream.once('error',reject);stream.end(resolve);});
 if(hash.digest('hex')!==ENGINE_SHA)throw Error('MongoDB download checksum failed. The downloaded engine was not started.');
 await ps('Expand-Archive -LiteralPath '+psQuote(zip)+' -DestinationPath '+psQuote(unpack)+' -Force');if(!fs.existsSync(file))throw Error('MongoDB extraction failed.');return file;
}
class MongoEngine{
 constructor(root,config,MongoClient,progress=()=>{}){this.root=root;this.config=config;this.MongoClient=MongoClient;this.progress=progress;this.child=null;}
 uri(){const c=this.config;return 'mongodb://'+encodeURIComponent(c.mongoUser)+':'+encodeURIComponent(c.mongoPassword)+'@127.0.0.1:'+c.mongoPort+'/?authSource=admin&replicaSet=alpineRestaurant';}
 async start(){
  if(this.child&&this.child.exitCode===null)return;const c=this.config;await new Promise((resolve,reject)=>{const server=require('node:net').createServer();server.once('error',()=>reject(Error('The private MongoDB port is already in use.')));server.listen(c.mongoPort,'127.0.0.1',()=>server.close(resolve));});const dbpath=path.join(this.root,'mongodb');fs.mkdirSync(dbpath,{recursive:true});const key=path.join(this.root,'mongodb.key');if(!fs.existsSync(key))fs.writeFileSync(key,crypto.randomBytes(512).toString('base64'),{mode:0o600});
  const file=await engineFile(this.root,this.progress);const args=['--dbpath',dbpath,'--port',String(c.mongoPort),'--bind_ip','127.0.0.1','--replSet','alpineRestaurant','--keyFile',key,'--auth','--oplogSize','1024','--logpath',path.join(dbpath,'server.log'),'--logappend'];
  this.child=spawn(file,args,{windowsHide:true,stdio:'ignore'});this.child.once('error',()=>{});
  const direct=new this.MongoClient('mongodb://127.0.0.1:'+c.mongoPort+'/?directConnection=true',{serverSelectionTimeoutMS:1000});let connected=false;
  for(let i=0;i<45;i++){try{await direct.connect();connected=true;break;}catch{if(this.child.exitCode!==null)break;await wait(500);}}
  if(!connected)throw Error('Private MongoDB could not start. Check that its port is free and Microsoft Visual C++ x64 runtime is installed.');
  try{
   let hello=await direct.db('admin').command({hello:1});
   if(!hello.setName){try{await direct.db('admin').command({replSetInitiate:{_id:'alpineRestaurant',members:[{_id:0,host:'127.0.0.1:'+c.mongoPort}]}});}catch(error){if(error.code!==13&&error.code!==23)throw error;}}
   for(let i=0;i<40;i++){hello=await direct.db('admin').command({hello:1});if(hello.isWritablePrimary)break;await wait(500);}if(!hello.isWritablePrimary)throw Error('Private MongoDB is not ready for transactions.');
   try{await direct.db('admin').command({createUser:c.mongoUser,pwd:c.mongoPassword,roles:[{role:'root',db:'admin'}]});}catch(error){if(error.code!==13&&error.code!==51003)throw error;}
  }finally{await direct.close();}
  const check=new this.MongoClient(this.uri(),{serverSelectionTimeoutMS:8000});try{await check.connect();await check.db('admin').command({ping:1});}finally{await check.close();}this.progress('Private MongoDB ready');
 }
 async stop(){if(!this.child||this.child.exitCode!==null)return;const client=new this.MongoClient(this.uri(),{serverSelectionTimeoutMS:2000});try{await client.connect();await client.db('admin').command({shutdown:1,force:false,timeoutSecs:10});}catch{}finally{await client.close();}const p=this.child;await Promise.race([new Promise(r=>p.once('exit',r)),wait(12000)]);if(p.exitCode===null)p.kill();this.child=null;}
}
module.exports={MongoEngine,engineFile,ps,psQuote};
