/* ── The desktop verifies this public channel with its pinned Alpine public key ── */
import {NextResponse} from 'next/server';import {counterRelease} from '@/lib/counter-release';
export async function GET(){try{return NextResponse.json(await counterRelease(),{headers:{'Cache-Control':'public, max-age=60'}});}catch{return NextResponse.json({error:'Windows update check temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
