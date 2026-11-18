/* ── Permanent installer URL; Android latest release is untouched ── */
import {NextResponse} from 'next/server';import {counterRelease,counterAsset} from '@/lib/counter-release';
export async function GET(){try{return NextResponse.redirect(counterAsset((await counterRelease()).url),307);}catch{return NextResponse.json({error:'Windows installer temporarily unavailable. Please try again shortly.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
