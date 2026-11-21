/* Manager-only update: reuse the verified 1.1.1 API/Admin payload, never arbitrary dependencies. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),{pipeline}=require('node:stream/promises');
const root=path.resolve(__dirname,'..'),admin=path.resolve(root,'..'),api=path.resolve(admin,'../alpine-api'),pkg=require(path.join(root,'package.json')),base=path.join(root,'release/Alpine-Local-Server-1.1.1-Windows-x64.exe');
const BASE_SHA='fee7849306e0ce9eff977aeba59bbabbfccb108cbde1b87135de3a855966bd0e',API_COMMIT='af1b56e5096996fae3e73ece58ee8da4fc0411f4',ADMIN_COMMIT='1389d0a5e44ca1677aa3f7af638af6a5d16405ff';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function git(args,cwd){return cp.execFileSync('git',args,{cwd,encoding:'utf8',windowsHide:true}).trim();}
(async()=>{
 if(pkg.version==='1.1.1'||hash(fs.readFileSync(base))!==BASE_SHA)throw Error('The verified 1.1.1 base installer is required.');
 if(git(['rev-parse','HEAD'],api)!==API_COMMIT||git(['status','--porcelain'],api))throw Error('API changed. Use a full runtime build.');
 const changes=git(['diff',ADMIN_COMMIT,'--name-only'],admin).split(/\r?\n/).filter(Boolean);if(changes.some(file=>!file.startsWith('local-server/')))throw Error('Admin application changed. Use a full runtime build.');
 require('./build.cjs');
 const archiveModule=require(path.join(admin,'desktop/node_modules/app-builder-lib/out/targets/archive')),archive=archiveModule.archive,zip=await require(path.join(admin,'desktop/node_modules/app-builder-lib/out/toolsets/7zip')).getPath7za();
 const header=Buffer.alloc(1024*1024),fd=fs.openSync(base,'r');fs.readSync(fd,header);fs.closeSync(fd);const offset=header.indexOf(Buffer.from([0x37,0x7a,0xbc,0xaf,0x27,0x1c]));if(offset<0)throw Error('Verified payload header missing.');const size=Number(header.readBigUInt64LE(offset+12)+header.readBigUInt64LE(offset+20)+32n);if(!Number.isSafeInteger(size)||offset+size>fs.statSync(base).size)throw Error('Invalid verified payload size.');
 let reused=false;
 archiveModule.archive=async(format,outFile,stage,options)=>{
  if(format!=='7z'||!path.basename(outFile).startsWith('alpine-local-server-'+pkg.version+'-'))return archive(format,outFile,stage,options);
  await pipeline(fs.createReadStream(base,{start:offset,end:offset+size-1}),fs.createWriteStream(outFile));
  const files=['Alpine Local Server.exe','resources/app.asar','resources/app.asar.unpacked/dist/server-process-host.exe'];for(const name of files)if(!fs.existsSync(path.join(stage,name)))throw Error('Manager update payload missing: '+name);
  cp.execFileSync(zip,['u','-bd','-mx=3','-md=1m','-ms=off','-mf=BCJ','-mtm=off','-up1q1r2x2y2z2w2',outFile,...files],{cwd:stage,windowsHide:true,maxBuffer:1024*1024});
  for(const name of files){const bytes=cp.execFileSync(zip,['x','-so',outFile,name],{windowsHide:true,maxBuffer:400*1024*1024});if(hash(bytes)!==hash(fs.readFileSync(path.join(stage,name))))throw Error('Updated payload mismatch: '+name);}
  reused=true;console.log('Verified API/Admin payload reused; manager executable, code and protected host replaced.');return outFile;
 };
 process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL||='3';const builder=require(path.join(admin,'desktop/node_modules/electron-builder'));await builder.build({projectDir:root,targets:builder.Platform.WINDOWS.createTarget('nsis',builder.Arch.x64),config:{electronVersion:require(path.join(admin,'desktop/node_modules/electron/package.json')).version,electronDist:path.join(admin,'desktop/node_modules/electron/dist')}});
 if(!reused)throw Error('The verified manager-only payload was not used.');console.log('Manager-only installer built from the verified 1.1.1 runtime.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
