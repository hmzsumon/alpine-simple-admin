/* ────────── shared contracts ────────── */
import type { Inventory, StockAvailability } from "@/types/inventory";
export type Station = string;
export type RestaurantTable = { id: string; name: string; floor: string; hallId?: string; seats: number };
export type Kitchen = { id: string; name: string; floor: string };
export type MenuItem = {
  aliases?: string[];
  code?: string;
  codeNote?: string;
  catalogRef?: string;
  nameBn?: string;
  imageUrl?: string;
  id: string;
  name: string;
  category: string;
  station: Station;
  price: number | null;
  active: boolean;
  note?: string;
};
export type Order = { bookingState?:"booking"|"final";bookingRevision?:number;
  floorName?:string; hallId?:string; hallName?:string;tableName?:string;
  simpleDayId?:string;simpleCounterId?:string;simpleCounterName?:string;salesChannel?:"dine_in"|"takeaway"|"foodpanda";externalOrderId?:string;simpleBillNo?:string;payments?:import("@/types/simpleCash").BillPayment[];
  orderType?: "dine_in" | "takeaway"; parcelToken?: string; customerName?: string; customerPhone?: string; packingCharge?: number;
  discountCents?:number;discountBy?:string;discountByName?:string;discountAt?:string; paymentStatus?: "unpaid" | "paid"; paidAt?: string; paidBy?: string; deliveredAt?: string;
  cancelReason?: string;
  cancelPrepared?: boolean;
  id: string;
  table: string;
  waiter: string;
 createdBy?:string;
 enteredBy?:string;enteredByName?:string;
  createdAt: string;
  status: "New" | "Preparing" | "Ready" | "Paid" | "Cancelled";
  items: {
    fulfillment?: "dine_in" | "parcel";
    menuId: string;
    name: string;
    nameBn?: string;
    quantity: number;
    price: number;
 note?:string;
    station: Station;
  }[];
};
export type Printer = {
  id: string;
  name: string;
  floor: string;
  station: Station | "Cash Counter";
  ip: string;
  enabled: boolean;
};
export type AppData = {
  halls?: {id:string;name:string;floor:string;counterId?:string}[];
  tables?: RestaurantTable[];
  kitchens?: Kitchen[];
  retiredTableIds?: string[];
  retiredKitchenIds?: string[];
  inventory?: Inventory;
  stockSummary?: Record<string, StockAvailability>;
  categories?: string[];
  menu: MenuItem[];
  orders: Order[];
  printers: Printer[];
  expenses: { id: string; name: string; amount: number; date: string }[];
};


