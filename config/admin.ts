/* ────────── imports ────────── */
import {
  BookOpen, Banknote, Settings2,

  LayoutDashboard,

  ShoppingBag,
  Table2,
  Wallet,
  Users,
  ShieldCheck,


  CircleHelp,
} from "lucide-react";
import type { Station } from "@/types";

/* ────────── navigation ────────── */
export const navigation = [
 {name:"Overview",href:"/dashboard",icon:LayoutDashboard},{name:"Orders",href:"/orders",icon:ShoppingBag},
 {name:"Cash register",href:"/cash",icon:Banknote},{name:"Sales & closing reports",href:"/reports",icon:BookOpen},{name:"Payment methods",href:"/payment-methods",icon:Wallet},
 {name:"Counter setup",href:"/cash-counters",icon:Settings2},
 {name:"Menu & categories",href:"/menu",icon:BookOpen},{name:"Tables & floors",href:"/tables",icon:Table2},{name:"Staff & permissions",href:"/users",icon:Users},
 {name:"My account",href:"/profile",icon:ShieldCheck},{name:"Guides",href:"/guide",icon:CircleHelp},{name:"User guide",href:"/guide/quick-start",icon:CircleHelp}
];

/* ────────── kitchen stations ────────── */
export const stations: Station[] = ["Main Kitchen", "BBQ", "Drinks"];
export const storageKey = "alpine-admin-demo-v1";

/* ────────── page descriptions ────────── */
export const heading: Record<string, string> = {
 "Cash register":"Cash movements, cashier custody and daily reconciliation.","Sales & closing reports":"Saved daily sales and cash reports.","Payment methods":"Cash, mobile banking and bank payment methods.",
  "Guides": "Learn each task with clear steps and worked examples.",
  "ক্রয় ও স্টোর": "ব্যাপারী, চাহিদা, বিল, Payment ও কাঁচামালের স্বতন্ত্র হিসাব।",
  Overview: "Your restaurant, at a glance.",
  Orders: "Every order. One place.",
  "Menu & categories": "A menu made for every craving.",
  "Stock & daily closing": "From opening preparation to a balanced closing.",
  "Tables & floors": "Make room for great moments.",
  "Kitchen & KOT": "Keep every kitchen in sync.",
  Expenses: "Know where every taka goes.",
  Printers: "The right ticket. The right kitchen.",
  "Staff & permissions": "The right access for every team member.",
  "My account": "Your profile and account security.",
};
