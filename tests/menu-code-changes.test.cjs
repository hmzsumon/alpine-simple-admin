const test=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(require('node:fs').readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {applyMenuCodeChanges:apply,parseMenuCodeChanges:parse}=require('../utils/menuCodeChanges.ts');
const menu=[{id:'a',name:'Rice',code:'10',price:100,active:true},{id:'b',name:'Fish',code:'20',price:400,active:false},{id:'c',name:'Tea',code:'30',price:20,active:true}];
test('a reviewed exchange saves both codes together and preserves every other field',()=>{const next=apply(menu,parse(menu,'10\t20\n20\t10'));assert.deepEqual(next.map(i=>i.code),['20','10','30']);assert.equal(next[0].price,100);assert.equal(next[1].active,false);assert.equal(menu[0].code,'10');});
test('duplicate codes, repeated items, missing items and invalid inputs are rejected',()=>{for(const text of ['10\t20','10\t40\n20\t40','10\t40\n10\t50','99\t40','10\tbad!','10'])assert.throws(()=>parse(menu,text));});
test('Bengali codes normalize, and stale previews cannot move another product',()=>{const changes=parse(menu,'বর্তমান কোড\tনতুন কোড\n১০\t৪০');assert.equal(changes[0].code,'40');assert.throws(()=>apply(menu.map(i=>i.id==='a'?{...i,code:'50'}:i),changes),/বদলে গেছে/);});
