/* ────────── private MongoDB process; never edits an existing Windows service or database ────────── */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn,execFile}=require('node:child_process'),{promisify}=require('node:util');
const execute=promisify(execFile),wait=ms=>new Promise(r=>setTimeout(r,ms));
const ENGINE_VERSION='8.0.38',ENGINE_URL='https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.38.zip';
const ENGINE_SHA='85147ae32f9bb9a2e5a0a3875b0ffcc4423ab7a49bc4f75cb4bbc9811883d3de';
async function fileHash(file){const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');}
const psQuote=value=>"'"+value.replaceAll("'","''")+"'";
function ps(command){return execute('powershell.exe',['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{windowsHide:true,maxBuffer:1024*1024});}
async function engineFile(root,progress){
 const base=path.join(process.env.ProgramFiles||'C:/Program Files','MongoDB/Server');
 if(fs.existsSync(base)){for(const version of fs.readdirSync(base).filter(v=>/^8\.0$/.test(v))){const file=path.join(base,version,'bin/mongod.exe');if(fs.existsSync(file)){try{const result=await execute(file,['--version'],{windowsHide:true});const patch=Number(/db version v8\.0\.(\d+)/.exec(result.stdout)?.[1]);if(patch>=38)return file;}catch{}}}}
 const unpack=path.join(root,'mongo-engine',ENGINE_VERSION),marker=path.join(unpack,'verified.json');
 function find(){if(!fs.existsSync(unpack))return null;for(const entry of fs.readdirSync(unpack,{withFileTypes:true})){if(entry.isDirectory()){const candidate=path.join(unpack,entry.name,'bin/mongod.exe');if(fs.existsSync(candidate))return candidate;}}return null;}
 let file=find();if(file&&fs.existsSync(marker)){const expected=JSON.parse(fs.readFileSync(marker));if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')===expected.sha256)return file;}
 const zip=path.join(root,'mongodb-'+ENGINE_VERSION+'.zip');if(!fs.existsSync(zip)||await fileHash(zip)!==ENGINE_SHA){
  progress('Downloading the verified MongoDB '+ENGINE_VERSION+' engine…');const response=await fetch(ENGINE_URL,{signal:AbortSignal.timeout(30*60000)});if(!response.ok)throw Error('MongoDB download failed. Check the internet connection.');
  const total=Number(response.headers.get('content-length')||0);let received=0,last=0;const hash=crypto.createHash('sha256'),{Readable,Transform}=require('node:stream');await require('node:stream/promises').pipeline(Readable.fromWeb(response.body),new Transform({transform(chunk,_encoding,callback){hash.update(chunk);received+=chunk.length;if(Date.now()-last>1500){last=Date.now();progress('MongoDB download · '+(total?Math.round(received/total*100)+'% · ':'')+Math.round(received/1048576)+' MB');}callback(null,chunk);}}),fs.createWriteStream(zip));
  if(hash.digest('hex')!==ENGINE_SHA)throw Error('MongoDB download checksum failed. The downloaded engine was not started.');
 }
 progress('Preparing the verified MongoDB engine…');
 // Keep the engine, runtime DLLs and licenses; debug symbols are not needed on a cash server.
 await ps("Add-Type -AssemblyName System.IO.Compression.FileSystem; $base=[IO.Path]::GetFullPath("+psQuote(unpack)+"); $archive=[IO.Compression.ZipFile]::OpenRead("+psQuote(zip)+"); try { foreach($entry in $archive.Entries) { if($entry.FullName -notmatch '/bin/(mongod[.]exe|[^/]+[.]dll)$|/(LICENSE[^/]*|SSPL[^/]*|THIRD[^/]*|README[^/]*)$'){continue}; $target=[IO.Path]::GetFullPath([IO.Path]::Combine($base,$entry.FullName)); if(-not $target.StartsWith($base+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid archive path'}; [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null; [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$target,$true) } } finally { $archive.Dispose() }");file=find();if(!file)throw Error('MongoDB extraction failed.');fs.writeFileSync(marker,JSON.stringify({version:ENGINE_VERSION,archiveSha256:ENGINE_SHA,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));try{fs.unlinkSync(zip);}catch{}return file;
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
