import { NextRequest } from "next/server";
import { proxy } from "@/lib/server/api";
export function GET(request:NextRequest,{params}:{params:{id:string}}){return proxy(request,"/api/waiter/orders/"+encodeURIComponent(params.id));}
export function DELETE(request: NextRequest, { params }: { params: { id: string } }) { return proxy(request, "/api/orders/" + encodeURIComponent(params.id) + ""); }
