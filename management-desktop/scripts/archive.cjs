/* ────────── immutable installer delivery to the user's per-version library ────────── */
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {archiveInstaller,sha256}=require('../../scripts/installer-archive.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),version=require('../package.json').version;
 const folder=path.join(root,'src-tauri/target/release/bundle/nsis');
 const artifacts=fs.readdirSync(folder).filter(file=>file.endsWith('.exe')&&file.includes(version));
 if(artifacts.length!==1)throw Error('Expected exactly one NSIS installer for version '+version);
 const source=path.join(folder,artifacts[0]),name=`Alpine-Owner-Admin-${version}-Windows-x64.exe`,release=path.join(root,'release');
 fs.mkdirSync(release,{recursive:true});const destination=path.join(release,name);
 if(fs.existsSync(destination)&&await sha256(destination)!==await sha256(source))throw Error('A different installer already uses this release filename. Increase the version.');
 if(!fs.existsSync(destination))fs.copyFileSync(source,destination,fs.constants.COPYFILE_EXCL);
 const hash=await sha256(destination);fs.writeFileSync(destination+'.sha256',hash+'  '+name+'\n');
 const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim();
 const info=await archiveInstaller({kind:'management',version,file:destination,details:{framework:'Tauri 2 + React',webview2:'offlineInstaller',architecture:'x64',commit}});
 console.log(JSON.stringify({file:destination,sha256:hash,archive:info.destination},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
