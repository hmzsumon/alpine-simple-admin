/* ── Reuse only pinned dependencies; rebuild and replace all API/Admin application code. ── */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),{pipeline}=require('node:stream/promises');
const root=path.resolve(__dirname,'..'),admin=path.resolve(root,'..'),api=path.resolve(admin,'../alpine-api'),pkg=require(path.join(root,'package.json'));
const base=path.join(root,'release/Alpine-Local-Server-1.1.5-Windows-x64.exe'),BASE_SHA='81c12c20225c2b861d6100f35346b66926a58c6cea1cbf9e1abd97166b380ff6';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function git(args,cwd){return cp.execFileSync('git',args,{cwd,encoding:'utf8',windowsHide:true}).trim();}
function files(dir,prefix=''){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(path.join(dir,d.name),prefix+d.name+'/'):[prefix+d.name]);}
(async()=>{
 if(pkg.version!=='1.1.6'||hash(fs.readFileSync(base))!==BASE_SHA)throw Error('Pinned 1.1.5 dependency base is required.');
 for(const [repo,commit]of [[admin,'67f64f2e4f9f80e836e49330990c8561aad6599b'],[api,'144d16bdfe9f17044e6fe3d1447a60aafd36f0dc']])for(const name of ['package.json','package-lock.json'])if(git(['diff',commit,'--',name],repo))throw Error('Dependencies changed; use a full runtime build.');
 require('./build.cjs');
 const archiveModule=require(path.join(admin,'desktop/node_modules/app-builder-lib/out/targets/archive')),archive=archiveModule.archive,zip=await require(path.join(admin,'desktop/node_modules/app-builder-lib/out/toolsets/7zip')).getPath7za();
 const header=Buffer.alloc(1024*1024),fd=fs.openSync(base,'r');fs.readSync(fd,header);fs.closeSync(fd);const offset=header.indexOf(Buffer.from([0x37,0x7a,0xbc,0xaf,0x27,0x1c]));if(offset<0)throw Error('Pinned payload header missing.');const size=Number(header.readBigUInt64LE(offset+12)+header.readBigUInt64LE(offset+20)+32n);if(!Number.isSafeInteger(size)||offset+size>fs.statSync(base).size)throw Error('Invalid payload size.');
 let reused=false;
 archiveModule.archive=async(format,outFile,stage,options)=>{
  if(format!=='7z'||!path.basename(outFile).startsWith('alpine-local-server-'+pkg.version+'-'))return archive(format,outFile,stage,options);
  await pipeline(fs.createReadStream(base,{start:offset,end:offset+size-1}),fs.createWriteStream(outFile));
  const folders=['resources/api/dist','resources/admin/.next'];
  const targets=['Alpine Local Server.exe','resources/app.asar','resources/app.asar.unpacked/dist/server-process-host.exe','resources/admin/server.js',...folders];
  for(const name of targets)if(!fs.existsSync(path.join(stage,name)))throw Error('Fresh runtime missing: '+name);
  cp.execFileSync(zip,['d','-bd',outFile,...folders],{windowsHide:true,maxBuffer:1024*1024});
  cp.execFileSync(zip,['u','-bd','-mx=3','-md=1m','-ms=off','-mf=BCJ','-mtm=off','-up1q1r2x2y2z2w2',outFile,...targets],{cwd:stage,windowsHide:true,maxBuffer:1024*1024});
  // Extract every replaced file to a disposable verifier and compare bytes;
  // no stale API modules or old Next build manifest may remain in these roots.
  const verify=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'alpine-payload-qa-'));
  try{cp.execFileSync(zip,['x','-bd','-y','-o'+verify,outFile,...targets],{windowsHide:true,maxBuffer:1024*1024});
   for(const name of targets){const source=path.join(stage,name),extracted=path.join(verify,name),names=fs.statSync(source).isDirectory()?files(source):[''];
    if(fs.statSync(source).isDirectory()&&JSON.stringify(files(extracted).sort())!==JSON.stringify(names.slice().sort()))throw Error('Stale runtime files remain: '+name);
    for(const file of names)if(hash(fs.readFileSync(path.join(source,file)))!==hash(fs.readFileSync(path.join(extracted,file))))throw Error('Runtime payload differs: '+name+'/'+file);
   }
  }finally{if(path.basename(verify).startsWith('alpine-payload-qa-')&&path.dirname(verify)===require('node:os').tmpdir())fs.rmSync(verify,{recursive:true,force:true});}
  reused=true;console.log('All fresh API/Admin code and manager payload verified; pinned dependencies retained.');return outFile;
 };
 process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL||='3';const builder=require(path.join(admin,'desktop/node_modules/electron-builder'));await builder.build({projectDir:root,targets:builder.Platform.WINDOWS.createTarget('nsis',builder.Arch.x64),config:{electronVersion:require(path.join(admin,'desktop/node_modules/electron/package.json')).version,electronDist:path.join(admin,'desktop/node_modules/electron/dist')}});
 if(!reused)throw Error('Verified payload hook was not used.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
