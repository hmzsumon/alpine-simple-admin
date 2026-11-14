/* ────────── authenticated print pages remain available for archived days ────────── */
import {cookies} from "next/headers";
import {redirect,notFound} from "next/navigation";
import {currentUser,backend,SESSION_COOKIE} from "@/lib/server/api";
import PrintableCashSlip from "@/components/cash/PrintableCashSlip";
import type {CashDayView} from "@/types/simpleCash";
export const dynamic="force-dynamic";
export default async function Page({params,searchParams}:{params:{date:string;ref:string};searchParams:{counterId?:string}}){const user=await currentUser();if(!user)redirect("/login");if(!user.permissions.includes("reports:read"))redirect("/orders");if(!/^\d{4}-\d{2}-\d{2}$/.test(params.date))notFound();const response=await backend("/api/simple/days/"+params.date+"?counterId="+encodeURIComponent(searchParams.counterId||"main"),{headers:{Authorization:"Bearer "+cookies().get(SESSION_COOKIE)?.value}});if(response.status===404)notFound();if(!response.ok)return <main style={{padding:25}}>Could not load the receipt. Refresh and try again.</main>;return <PrintableCashSlip data={await response.json() as CashDayView} refId={params.ref} paper={user.role==="cashier"?"thermal":"a4"}/>;}
