const test=require('node:test'),assert=require('node:assert/strict');
const {loadCounterChoices}=require('../dist/counter-choices.cjs');
const choices=[{id:'qa',name:'QA counter',code:'C01'}];
test('an interrupted discovery can be retried with the same signed-in account',async()=>{let lost=true;const remote=async url=>{if(url.endsWith('/register'))return {};if(lost){lost=false;throw Error('Network disconnected');}return {counters:choices};};await assert.rejects(loadCounterChoices(remote),/Network disconnected/);assert.deepEqual(await loadCounterChoices(remote),choices);});
test('unexpected success responses cannot replace the choice list with undefined',async()=>{for(const value of [null,{},[],{counters:null},{counters:[{}]}])await assert.rejects(loadCounterChoices(async()=>value),/Counter setup could not be loaded/);});
test('a handover lookup failure keeps valid counters and empty authorized lists stay empty',async()=>{assert.deepEqual(await loadCounterChoices(async url=>{if(url.endsWith('/register'))throw Error('Offline');return {counters:choices};}),choices);assert.deepEqual(await loadCounterChoices(async()=>({counters:[]})),[]);});
