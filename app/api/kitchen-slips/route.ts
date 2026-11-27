/* Owner/Admin viewing only; this proxy intentionally has no POST, PATCH or DELETE. */
import {NextRequest,NextResponse} from 'next/server';import {currentUser,proxy} from '@/lib/server/api';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){const user=await currentUser();if(!user||!['owner','admin'].includes(user.role)||!user.permissions.includes('orders:read'))return NextResponse.json({error:'Owner/Admin view required.'},{status:user?403:401});return proxy(request,'/api/simple/kitchen-slips'+request.nextUrl.search);}
