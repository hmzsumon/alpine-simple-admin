/* Isolated regression: occupied ports, delayed readiness and failed/retried own processes. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{spawn}=require('node:child_process');
const {Controller,freePort}=require('../src/controller.cjs'),{localResponse}=require('../src/localHttp.cjs');
const api=path.resolve(__dirname,'../../../alpine-api');
function controller(timeout=2000){const root=fs.mkdtempSync(path.join(os.tmpdir(),'alpine-startup-qa-'));const c=new Controller({root,runtime:path.resolve(__dirname,'../runtime'),nodeExe:process.execPath,safeStorage:{isEncryptionAvailable:()=>true,encryptString:value=>Buffer.from(value),decryptString:value=>value.toString()},startupTimeout:timeout});c.runtime=path.join(root,'runtime');c.config={phase:'new',port:0,internal:'qa-private-identity'};return c;}
async function listen(handler){return new Promise(resolve=>{const server=http.createServer(handler);server.listen(0,'127.0.0.1',()=>resolve(server));});}
async function port(){const server=await listen((_q,r)=>r.end());const value=server.address().port;await close(server);return value;}
async function close(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
test('direct local HTTP ignores proxy settings and rejects non-loopback targets',async()=>{
 const server=await listen((_q,r)=>{r.setHeader('Content-Type','application/json');r.end('{"ready":true}');});const previous=process.env.HTTP_PROXY;process.env.HTTP_PROXY='http://127.0.0.1:1';
 try{const result=await localResponse('http://127.0.0.1:'+server.address().port+'/health');assert.equal(result.json().ready,true);assert.throws(()=>localResponse('http://192.168.1.20/health'),/Only the local/);}finally{if(previous===undefined)delete process.env.HTTP_PROXY;else process.env.HTTP_PROXY=previous;await close(server);}
});
test('readiness waits through a slow initial boot and verifies the private server identity',async()=>{
 const c=controller(),started=Date.now();let verified=false;const server=await listen((q,r)=>{if(q.url==='/local-server/status'){verified=q.headers['x-alpine-local-key']===c.config.internal;r.end(JSON.stringify({capture:'ready'}));}else if(Date.now()-started<450){r.statusCode=503;r.end('starting');}else r.end('ready');});
 c.config.port=server.address().port;try{await c.ready('http://127.0.0.1:'+c.config.port+'/health',{exitCode:null,signalCode:null,killed:false},true);assert(Date.now()-started>=450);assert(verified);}finally{await close(server);}
});
test('failed API startup releases only its own port and the next attempt succeeds',async()=>{
 const c=controller(900);c.config.port=await port();const entry=path.join(c.runtime,'api/dist/local-server.js');fs.mkdirSync(path.dirname(entry),{recursive:true});
 fs.writeFileSync(entry,"require('node:http').createServer((q,r)=>{r.statusCode=503;r.end('starting');}).listen(Number(process.env.PORT),'127.0.0.1');");c.env=()=>({PORT:String(c.config.port)});
 const other=await listen((_q,r)=>r.end('unrelated server'));try{
  await assert.rejects(c.startApi(true),/too long|stopped/);assert.equal(c.children.length,0);await freePort(c.config.port);assert.equal((await localResponse('http://127.0.0.1:'+other.address().port)).body,'unrelated server');
  fs.writeFileSync(entry,"require('node:http').createServer((q,r)=>r.end(q.url==='/local-server/status'?JSON.stringify({capture:'ready'}):'ready')).listen(Number(process.env.PORT),'127.0.0.1');");
  c.startupTimeout=4000;await c.startApi(true);assert.equal(c.children.length,1);assert.equal(c.children[0].serverRole,'api');
 }finally{await c.stopApps();await close(other);}await freePort(c.config.port);
});
test('setup failure stops its preflight child but keeps import state and existing local files',async()=>{
 const c=controller();c.config={phase:'imported',port:await port()};c.save=()=>{};c.mongo=async()=>{};const backup=path.join(c.root,'saved-backup.enc');fs.writeFileSync(backup,'retained');let child;
 c.startApi=async()=>{child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});c.children.push(child);throw Error('simulated slow preflight');};
 try{await assert.rejects(c.setup({}),/slow preflight/);assert.equal(c.children.length,0);assert.equal(c.config.phase,'imported');assert.equal(fs.readFileSync(backup,'utf8'),'retained');assert(child.exitCode!==null||child.signalCode);}finally{await c.stopApps();}
});
test('startup logs redact secrets and MongoDB connection credentials',async()=>{
 const c=controller();const secret='qa-private-token-0123456789'; const script=path.join(c.root,'log-test.cjs');fs.writeFileSync(script,"console.log(process.env.JWT_SECRET);console.error('mongodb://fake-user:fake-password@127.0.0.1:9999/private');");const logged=c.launch(script,c.root,{JWT_SECRET:secret});await new Promise(resolve=>logged.once('exit',resolve));const output=fs.readFileSync(path.join(c.root,'logs/admin.log'),'utf8');assert(!output.includes(secret));assert(!output.includes('fake-password'));assert(output.includes('[redacted]'));await c.stopApps();
});

test('an accidental setup call cannot stop an already active restaurant server',async()=>{const c=controller();c.config={phase:'active'};let stops=0;c.stopApps=async()=>{stops++;};await assert.rejects(c.setup({}),/already set up/);assert.equal(stops,0);assert.equal(c.busy,false);});
