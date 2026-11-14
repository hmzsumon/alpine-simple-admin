import {NextRequest} from "next/server";
import {proxy} from "@/lib/server/api";
export function POST(request:NextRequest){return proxy(request,"/api/waiter/orders");}
