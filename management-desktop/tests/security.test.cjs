const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('remote business pages cannot acquire launcher/native capabilities',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(root,'src-tauri/tauri.conf.json'),'utf8'));
 assert.deepEqual(config.app.security.capabilities,['launcher']);
 const cap=JSON.parse(fs.readFileSync(path.join(root,'src-tauri/capabilities/launcher.json'),'utf8'));
 assert.equal(cap.local,true);assert.equal(cap.remote,undefined);assert.deepEqual(cap.windows,['main']);
 assert.deepEqual(cap.permissions,['core:default','allow-open-workspace']);
 const build=fs.readFileSync(path.join(root,'src-tauri/build.rs'),'utf8');assert.match(build,/AppManifest::new\(\)\.commands/);
 assert.equal(config.bundle.windows.webviewInstallMode.type,'offlineInstaller');
});
test('screen palette cannot override bill/report print styles',()=>{
 const theme=fs.readFileSync(path.join(root,'src/theme/workspace.css'),'utf8');
 assert.match(theme,/^@media screen \{/m);assert.doesNotMatch(theme,/@media print/);
 for(const color of ['#172b4d','#2563eb','#087f73','#f4f6fa','#fff'])assert.ok(theme.includes(color),color);
});
