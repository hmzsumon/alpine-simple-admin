/* ────────── built-in SQLite: no MongoDB download, AVX or database service ────────── */
const fs=require('node:fs'),path=require('node:path');
class SqliteEngine{
 constructor(root,config,Store,progress=()=>{}){this.kind='sqlite';this.Store=Store;this.config=config;this.progress=progress;this.filename=path.join(root,'database',config.dbName+'.sqlite');this.running=false;}
 async start(){if(this.running)return;fs.mkdirSync(path.dirname(this.filename),{recursive:true});const store=new this.Store(this.filename,this.config.dbName);try{const rows=store.sql.prepare('PRAGMA quick_check').all();if(rows.length!==1||rows[0].quick_check!=='ok')throw Error('The local database did not pass its integrity check.');}finally{await store.close();}this.running=true;this.progress('SQLite server engine ready. No database download is required.');}
 async stop(){this.running=false;}
 connection(){if(!this.running)throw Error('Prepare the local database first.');return new this.Store(this.filename,this.config.dbName);}
}
module.exports={SqliteEngine};
