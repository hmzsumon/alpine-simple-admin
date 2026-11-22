import {NextRequest} from 'next/server';import {proxy} from '@/lib/server/api';export const dynamic='force-dynamic';
export function POST(request:NextRequest,{params}:{params:{action:string}}){if(!['preview','execute','resume'].includes(params.action))return new Response(null,{status:404});return proxy(request,'/api/hub/admin/'+params.action);}
