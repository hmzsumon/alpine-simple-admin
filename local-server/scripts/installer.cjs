/* Runtime preparation is separate so installer QA can rebuild without touching dependencies. */
const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..'),admin=path.resolve(root,'..');
process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL ||= '3';
for(const target of ['api/node_modules/mongoose/package.json','admin/node_modules/next/package.json','api/dist/local-server.js','admin/server.js'])if(!fs.existsSync(path.join(root,'runtime',target)))throw Error('Prepare the complete runtime before packaging.');
require('./build.cjs');const builder=require(path.join(admin,'desktop/node_modules/electron-builder'));builder.build({projectDir:root,targets:builder.Platform.WINDOWS.createTarget('nsis',builder.Arch.x64),config:{electronVersion:require(path.join(admin,'desktop/node_modules/electron/package.json')).version,electronDist:path.join(admin,'desktop/node_modules/electron/dist')}}).catch(error=>{console.error(error.message);process.exitCode=1;});
