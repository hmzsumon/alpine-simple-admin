/* ── Same-origin cookie-authenticated proxy; the API enforces Admin/Owner permissions. ── */
import {NextRequest} from 'next/server';
import {proxy} from '@/lib/server/api';
export const dynamic='force-dynamic';
export function GET(request:NextRequest){return proxy(request,'/api/desktop/reviews');}
export function POST(request:NextRequest){return proxy(request,'/api/desktop/reviews');}
