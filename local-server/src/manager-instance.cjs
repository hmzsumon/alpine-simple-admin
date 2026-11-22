/* ── A second launch can recover only its exact stalled manager, never an unrelated PID. ── */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
function nativeHost(){const installed=path.join(__dirname.replace(/app\.asar([\\/])/,'app.asar.unpacked$1'),'server-process-host.exe');return fs.existsSync(installed)?installed:path.join(__dirname,'../dist/server-process-host.exe');}
function birth(executable){const r=spawnSync(nativeHost(),['--manager-birth',String(process.pid),executable],{windowsHide:true,encoding:'utf8',timeout:5000});const value=r.stdout?.trim();return r.status===0&&/^\d+$/.test(value)?value:null;}
function writeHeartbeat(root,identity,screenAt){if(!identity.birth)return;const file=path.join(root,'manager-heartbeat.json'),temporary=file+'.tmp';fs.writeFileSync(temporary,JSON.stringify({...identity,at:Date.now(),screenAt}));fs.renameSync(temporary,file);}
function recoverInstance(root,executable,log=()=>{}){
 try{const saved=JSON.parse(fs.readFileSync(path.join(root,'manager-heartbeat.json'),'utf8')),now=Date.now();
  if(!Number.isInteger(saved.pid)||saved.pid<1||saved.pid===process.pid||saved.executable!==executable||!/^\d+$/.test(saved.birth)||!Number.isFinite(saved.at)||!Number.isFinite(saved.startedAt)||now-saved.startedAt<30000||now-saved.at<20000&&(saved.screenAt&&now-saved.screenAt<20000))return false;
  const r=spawnSync(nativeHost(),['--stop-manager',String(saved.pid),saved.birth,executable],{windowsHide:true,encoding:'utf8',timeout:8000});if(r.status!==0)return false;log('Recovered the verified unresponsive manager from an earlier launch.');return true;
 }catch{return false;}
}
module.exports={nativeHost,birth,writeHeartbeat,recoverInstance};
