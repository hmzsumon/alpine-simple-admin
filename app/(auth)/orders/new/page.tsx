/* ────────── authenticated full-page order creation, including direct URL visits ────────── */
import {redirect} from "next/navigation";
import {currentUser} from "@/lib/server/api";
import {landingPath} from "@/config/access";
import OrderCreatePage from "@/components/orders/OrderCreatePage";
export default async function Page({searchParams}:{searchParams:{table?:string|string[]}}){const user=await currentUser();if(!user)redirect("/login");if(!user.permissions.includes("orders:create"))redirect(landingPath(user));return <OrderCreatePage table={typeof searchParams.table==="string"?searchParams.table:undefined}/>;}
