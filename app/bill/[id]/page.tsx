import {hasKitchenCopy} from '@/utils/kitchenPrinting';
import AutomaticBillPrint from "@/components/orders/AutomaticBillPrint";
/* ────────── authenticated cashier/owner bill preview, using the saved order ────────── */
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { backend, currentUser, SESSION_COOKIE } from "@/lib/server/api";
import PrintableBill from "@/components/orders/PrintableBill";
import type { Order } from "@/types";
export const dynamic = "force-dynamic";
export default async function Page({ params,searchParams }: { searchParams?:{printJob?:string;payment?:string;part?:string;auto?:string};params: { id: string } }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["orders:read", "payments:collect"].every(permission => user.permissions.includes(permission as "orders:read" | "payments:collect"))) redirect("/orders");
  const response = await backend("/api/waiter/orders/" + encodeURIComponent(params.id), {
    headers: { Authorization: "Bearer " + cookies().get(SESSION_COOKIE)?.value },
  });
  if (response.status === 404) notFound();
  if (response.status === 403) redirect("/orders");
  if (!response.ok) return <main style={{ padding: 30 }}>Could not load the bill. Refresh and try again.</main>;
  const data: { order: Order } = await response.json();
  const jobId=searchParams?.printJob,validJob=!!jobId&&/^[a-f0-9-]{36}$/i.test(jobId),payment=searchParams?.payment;
  const part=searchParams?.part==="token"?"token":searchParams?.part==="kitchen"?"kitchen":"bill",hasToken=false;
  if(validJob&&(part==="token"||part==="kitchen"&&!hasKitchenCopy(data.order)))notFound();
  const eligible=validJob&&(searchParams?.auto!=="1"||(data.order.salesChannel!=="foodpanda"&&data.order.handoffPrintId===jobId&&data.order.handoffPrintClaim?.by===user.id&&data.order.bookingState!=="booking"&&data.order.status!=="Cancelled"))&&(!payment||(data.order.paymentStatus==="paid"&&data.order.payments?.some(p=>p.id===payment&&p.by===user.id)===true));
  return <><PrintableBill printPart={validJob?part:"preview"} order={data.order} paper={validJob||user.role==="cashier"?"thermal":"a4"} printedBy={user.name} previewAt={new Date().toISOString()} />{validJob&&<AutomaticBillPrint jobId={jobId!} userId={user.id} orderId={data.order.id} eligible={eligible} part={part} hasToken={hasToken} hasKitchen={false}/>}</>;
}
