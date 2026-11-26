const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('archive keeps four app groups and preserves different installer bytes for the same version',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'alpine-management-archive-')),previous=process.env.ALPINE_INSTALLER_ARCHIVE_DIR;
 try{
  process.env.ALPINE_INSTALLER_ARCHIVE_DIR=root;const {archiveInstaller}=require('../../scripts/installer-archive.cjs');
  const source=path.join(root,'fixture.exe');fs.writeFileSync(source,'QA installer, never executable');
  for(const kind of ['waiter','counter','server','management'])await archiveInstaller({kind,version:'0.0.1-qa',file:source,name:'qa.exe'});
  const first=path.join(root,'Owner-Admin-App/v0.0.1-qa/qa.exe'),bytes=fs.readFileSync(first);fs.writeFileSync(source,'Different QA installer bytes');
  const second=await archiveInstaller({kind:'management',version:'0.0.1-qa',file:source,name:'qa.exe'});assert.notEqual(second.destination,first);assert.deepEqual(fs.readFileSync(first),bytes);
  // A later APK archive also retains Management entries in the common index.
  await archiveInstaller({kind:'waiter',version:'0.0.2-qa',file:source,name:'qa.exe'});
  const rows=JSON.parse(fs.readFileSync(path.join(root,'installer-index.json'))).installers;
  assert.deepEqual([...new Set(rows.map(row=>row.kind))].sort(),['counter','management','server','waiter']);
  assert.equal(rows.filter(row=>row.kind==='management').length,2);
 }finally{
  if(previous===undefined)delete process.env.ALPINE_INSTALLER_ARCHIVE_DIR;else process.env.ALPINE_INSTALLER_ARCHIVE_DIR=previous;
  const safe=fs.realpathSync(root),base=fs.realpathSync(os.tmpdir());assert.ok(safe.startsWith(base+path.sep)&&path.basename(safe).startsWith('alpine-management-archive-'));fs.rmSync(safe,{recursive:true});
 }
});
