/* ── Durable encrypted settings; an interrupted write must never become fresh setup ── */
const fs=require('node:fs'),path=require('node:path');
function durableWrite(file,bytes){const temporary=file+'.tmp';const fd=fs.openSync(temporary,'w',0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temporary,file);}
function valid(config){return config&&typeof config==='object'&&!Array.isArray(config)&&['new','preparing','importing','imported','active'].includes(config.phase)&&typeof config.dbName==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(config.dbName)&&Number.isInteger(config.port)&&config.port>0&&config.port<65536&&Number.isInteger(config.adminPort)&&config.adminPort>0&&config.adminPort<65536&&typeof config.jwtSecret==='string'&&config.jwtSecret.length>=16&&typeof config.internal==='string'&&config.internal.length>=16&&(config.phase!=='active'||typeof config.grant?.id==='string'&&typeof config.grant?.secret==='string'&&typeof config.cloud==='string');}
class ConfigStore{
 constructor(file,safeStorage,progress=()=>{}){this.file=file;this.safe=safeStorage;this.progress=progress;this.recovered=false;}
 read(file){const bytes=fs.readFileSync(file),config=JSON.parse(this.safe.decryptString(bytes));if(!valid(config))throw Error('Invalid saved server settings.');return {bytes,config};}
 load(){
  const candidates=[this.file,this.file+'.tmp',this.file+'.previous'];if(!candidates.some(f=>fs.existsSync(f))){const root=path.dirname(this.file),database=path.join(root,'database');if(fs.existsSync(database)&&fs.readdirSync(database).some(name=>name.endsWith('.sqlite'))||fs.existsSync(path.join(root,'mongodb')))throw Error('Saved server settings are missing. Existing restaurant records have been retained; do not run a new Owner setup.');return null;}
  if(!this.safe.isEncryptionAvailable())throw Error('Windows protected storage is not ready. Sign in to the original Windows account and retry.');
  try{return this.read(this.file).config;}catch{}
  const alternatives=candidates.slice(1).flatMap(file=>{try{return [{...this.read(file),file}];}catch{return [];}}).sort((a,b)=>(b.config.settingsGeneration||0)-(a.config.settingsGeneration||0));
  if(!alternatives.length)throw Error('Saved server settings could not be read. The database has been retained. Open the server folder and contact support; do not run a new Owner setup.');
  const recovered=alternatives[0];if(fs.existsSync(this.file))fs.copyFileSync(this.file,this.file+'.damaged-'+Date.now());
  // Do not overwrite the pending candidate while promoting it.
  const bytes=Buffer.from(recovered.bytes);durableWrite(this.file+'.recovery',bytes);fs.renameSync(this.file+'.recovery',this.file);this.recovered=true;
  this.progress('Recovered saved server settings after an interrupted write.');return recovered.config;
 }
 save(config){
  if(!this.safe.isEncryptionAvailable())throw Error('Windows encryption is required before storing server credentials.');if(!valid(config))throw Error('The saved server settings are incomplete.');
  let previous;try{previous=this.read(this.file);}catch{}
  if(previous)durableWrite(this.file+'.previous',previous.bytes);
  const generation=Math.max(Number(config.settingsGeneration)||0,Number(previous?.config.settingsGeneration)||0)+1;
  const bytes=this.safe.encryptString(JSON.stringify({...config,settingsGeneration:generation}));durableWrite(this.file,bytes);config.settingsGeneration=generation;
 }
}
module.exports={ConfigStore,durableWrite};
