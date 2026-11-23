const test=require('node:test'),assert=require('node:assert/strict');
const {counterWindowBounds}=require('../dist/window-bounds.cjs');
test('counter windows fit a 14-inch desktop and a DPI-scaled small work area',()=>{
 for(const area of [{x:0,y:0,width:1366,height:728},{x:0,y:0,width:1093,height:574},{x:0,y:0,width:1024,height:560}])for(const kind of ['main','order']){
  const bounds=counterWindowBounds(area,kind);assert(bounds.width<=area.width);assert(bounds.height<=area.height);assert(bounds.minHeight<=bounds.height);assert(bounds.minWidth<=bounds.width);assert(bounds.x>=area.x);assert(bounds.y>=area.y);assert(bounds.x+bounds.width<=area.x+area.width);assert(bounds.y+bounds.height<=area.y+area.height);
 }
});
test('secondary-monitor windows respect negative desktop coordinates',()=>{
 const area={x:-1920,y:120,width:1920,height:1040},bounds=counterWindowBounds(area,'order');assert.equal(bounds.width,1220);assert.equal(bounds.height,900);assert.equal(bounds.x,-1570);assert.equal(bounds.y,190);
});
