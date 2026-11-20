/* Bundle only runtime files; no .env, credentials, tests, database or real uploads. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),admin=path.resolve(root,'..'),api=path.resolve(admin,'../alpine-api'),runtime=path.join(root,'runtime');
function run(command,args,cwd,env={}){const result=spawnSync(command,args,{cwd,env:{...process.env,...env},stdio:'inherit',windowsHide:true,shell:process.platform==='win32'&&command==='npm'});if(result.status!==0)throw Error('Build command failed.');}
if(!process.argv.includes('--reuse-build')){run('npm',['run','build'],api);run('npm',['run','build'],admin,{ALPINE_STANDALONE:'1',API_URL:'http://127.0.0.1:4250',COOKIE_SECURE:'false'});}
fs.mkdirSync(runtime,{recursive:true});const apiTarget=path.join(runtime,'api');fs.mkdirSync(apiTarget,{recursive:true});fs.cpSync(path.join(api,'dist'),path.join(apiTarget,'dist'),{recursive:true,filter:source=>!/[\\/]dist[\\/](tests|scripts)([\\/]|$)/.test(source)});for(const file of ['package.json','package-lock.json'])fs.copyFileSync(path.join(api,file),path.join(apiTarget,file));run('npm',['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],apiTarget);
const adminTarget=path.join(runtime,'admin');fs.cpSync(path.join(admin,'.next/standalone'),adminTarget,{recursive:true});fs.cpSync(path.join(admin,'.next/static'),path.join(adminTarget,'.next/static'),{recursive:true});fs.cpSync(path.join(admin,'public'),path.join(adminTarget,'public'),{recursive:true});
// A developer node_modules junction must never become an installer dependency.
// Next's Windows tracing may skip that junction, so install physical production modules here.
for(const file of ['package.json','package-lock.json'])fs.copyFileSync(path.join(admin,file),path.join(adminTarget,file));run('npm',['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],adminTarget);
require('./installer.cjs');
