/* ────────── Owner credential proxy: HttpOnly authentication and same-origin POST ────────── */
import {NextRequest} from "next/server";
import {proxy} from "@/lib/server/api";
export const dynamic="force-dynamic";
export function POST(request:NextRequest,{params}:{params:{id:string}}){return proxy(request,"/api/admin/users/"+encodeURIComponent(params.id)+"/password/reveal");}
