/* ── Pack a local, opaque BGRA receipt into bounded ESC/POS raster bands ── */
export const THERMAL_WIDTH=576,MAX_RASTER_HEIGHT=16000;
export function rasterReceipt(bitmap:Buffer,width:number,height:number):Buffer{
 if(!Number.isInteger(width)||width<1||width>THERMAL_WIDTH||!Number.isInteger(height)||height<1||height>MAX_RASTER_HEIGHT||bitmap.length!==width*height*4)throw Error('Invalid receipt image dimensions.');
 const rowBytes=Math.ceil(width/8),chunks=[Buffer.from([27,64,27,97,0,29,76,0,0,29,87,64,2])];let ink=0;
 // A fixed threshold keeps text black/white; dithering would make receipt letters speckled.
 for(let top=0;top<height;top+=128){const rows=Math.min(128,height-top),data=Buffer.alloc(rowBytes*rows);for(let y=0;y<rows;y++)for(let x=0;x<width;x++){const i=((top+y)*width+x)*4,alpha=bitmap[i+3]/255,luma=(bitmap[i]*0.0722+bitmap[i+1]*0.7152+bitmap[i+2]*0.2126)*alpha+255*(1-alpha);if(luma<180){data[y*rowBytes+(x>>3)]|=128>>(x&7);ink++;}}chunks.push(Buffer.from([29,118,48,0,rowBytes&255,rowBytes>>8,rows&255,rows>>8]),data);}
 if(!ink)throw Error('Receipt rendering was blank. No paper was sent to the printer.');
 chunks.push(Buffer.from([29,86,65,0]));return Buffer.concat(chunks);
}
