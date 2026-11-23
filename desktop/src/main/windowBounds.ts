/* ── Electron work areas already use DPI-scaled units and exclude the taskbar ── */
export interface CounterWorkArea{x:number;y:number;width:number;height:number;}
export function counterWindowBounds(area:CounterWorkArea,kind:'main'|'order'){
 const width=Math.min(kind==='order'?1220:1360,area.width),height=Math.min(900,area.height);
 return {x:area.x+Math.floor((area.width-width)/2),y:area.y+Math.floor((area.height-height)/2),width,height,minWidth:Math.min(640,width),minHeight:Math.min(480,height)};
}
