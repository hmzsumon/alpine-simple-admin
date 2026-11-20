/* ────────── same-origin media proxy for both cloud and private LAN Admin ────────── */
import {createHash} from 'node:crypto';
import {apiOrigin} from '@/lib/api-origin';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const src=new URL(request.url).searchParams.get('src')||'';let source:URL;
 try{source=new URL(src);}catch{return new Response(null,{status:400});}
 const managed=/^\/menu-images\/[a-f0-9-]{36}\.(jpeg|png|webp)$/.test(source.pathname)&&!source.search&&!source.hash;
 const cloudinary=source.protocol==='https:'&&source.hostname==='res.cloudinary.com'&&!source.port&&!source.username&&!source.password&&!source.search&&!source.hash&&/^\/[a-zA-Z0-9_-]+\/image\/upload\//.test(source.pathname);
 if(!managed&&!cloudinary)return new Response(null,{status:400});
 const localPath=managed?source.pathname:'/menu-images/cache-'+createHash('sha256').update(src).digest('hex');
 try{let response=await fetch(apiOrigin+localPath,{signal:AbortSignal.timeout(5000),cache:'no-store'});if(!response.ok&&cloudinary)response=await fetch(src,{redirect:'error',signal:AbortSignal.timeout(8000)});if(!response.ok)return new Response(null,{status:404});const type=response.headers.get('content-type')||'';if(!/^image\/(jpeg|png|webp)/.test(type))return new Response(null,{status:400});return new Response(response.body,{headers:{'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=3600'}});}catch{return new Response(null,{status:404});}
}
