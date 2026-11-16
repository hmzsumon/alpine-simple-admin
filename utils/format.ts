/* ────────── imports ────────── */
import type { Order } from "@/types";

/* ────────── currency and order totals ────────── */
export const money = (value: number) => `BDT ${value.toLocaleString("en-BD")}`;
export const total = (order: Order) =>
  Math.max(0,order.items.reduce((sum,item)=>sum+Math.round(item.price*100)*item.quantity,0)+Math.round((order.packingCharge||0)*100)-(order.discountCents||0))/100;

export const paidOrder = (order: Order) => order.paymentStatus === "paid" || order.status === "Paid";
export const orderLabel = (order: Order) => order.parcelToken || order.table;
