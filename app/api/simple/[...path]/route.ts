/* ────────── allow only the new edition's cash/read/report endpoints ────────── */
import {NextRequest} from "next/server";
import {proxy} from "@/lib/server/api";
export const dynamic="force-dynamic";
function forward(request:NextRequest,path:string[]){const route=path.join("/");if(!/^(register|command|methods|counters|order-waiters|reports|daily\/\d{4}-\d{2}-\d{2}|days\/\d{4}-\d{2}-\d{2})$/.test(route))return new Response(null,{status:404});return proxy(request,"/api/simple/"+route+request.nextUrl.search);}
export function GET(request:NextRequest,{params}:{params:{path:string[]}}){return forward(request,params.path);}
export function POST(request:NextRequest,{params}:{params:{path:string[]}}){return forward(request,params.path);}
