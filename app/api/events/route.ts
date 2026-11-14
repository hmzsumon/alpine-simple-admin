/* ────────── same-origin SSE proxy; the session token stays HttpOnly ────────── */
import {NextRequest} from "next/server";
import {backend,SESSION_COOKIE} from "@/lib/server/api";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(request:NextRequest){const token=request.cookies.get(SESSION_COOKIE)?.value;if(!token)return new Response("Please sign in",{status:401});try{const response=await backend("/api/admin/events",{headers:{Authorization:"Bearer "+token},signal:request.signal});if(!response.ok)return new Response("Live updates unavailable",{status:response.status});return new Response(response.body,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache, no-transform","X-Accel-Buffering":"no"}});}catch{return new Response("Live updates unavailable",{status:503});}}
