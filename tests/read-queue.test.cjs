const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
const box={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../utils/readQueue.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,box);
const {createReadQueue,reconcileCollections}=box.exports;
test('overlapping refreshes wait for one trailing fresh read, without caching later reads',async()=>{
 let count=0,release;const queued=createReadQueue(()=>{count++;return count===1?new Promise(r=>release=r):Promise.resolve(count)});
 const a=queued();await Promise.resolve();const b=queued(),c=queued();assert.equal(a,b);assert.equal(a,c);assert.equal(count,1);
 release(1);assert.equal(await a,2);assert.equal(count,2);assert.equal(await queued(),3);
});
test('failed and synchronously throwing reads permit a fresh retry',async()=>{
 let count=0;const queued=createReadQueue(()=>{count++;if(count===1)throw Error('offline');return Promise.resolve(count)});
 await assert.rejects(queued(),/offline/);assert.equal(await queued(),2);
});
test('unchanged collections retain references while authorization changes take effect',()=>{
 const previous={menu:[{id:'tea'}],orders:[{id:'private'}]};
 assert.equal(reconcileCollections(previous,JSON.parse(JSON.stringify(previous))),previous);
 const next=reconcileCollections(previous,{menu:[{id:'tea'}],orders:[]});
 assert.equal(next.menu,previous.menu);assert.equal(next.orders.length,0);assert.notEqual(next,previous);
});
