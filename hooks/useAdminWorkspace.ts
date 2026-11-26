import {stationRows} from '@/utils/stationSetup';
import {categoryName,sameCategory} from "@/utils/categoryItems";
import {createReadQueue,reconcileCollections} from "@/utils/readQueue";
/* ────────── imports ────────── */
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { navigation } from "@/config/admin";
import { initialData } from "@/data/menu";
import { loadWorkspace, persistWorkspace } from "@/lib/adminWorkspace";
import { total, paidOrder } from "@/utils/format";
import type { AppData, MenuItem, Order } from "@/types";
import { defaultTables } from "@/config/restaurantSetup";
import { matchesMenuSearch, normalizeItemCode } from "@/utils/menuSearch";

const dayFormat = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Dhaka"});
const weekdayFormat = new Intl.DateTimeFormat("en", {weekday:"short",timeZone:"Asia/Dhaka"});
/* ────────── workspace state and actions ────────── */
export function useAdminWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const page =
    navigation.find((item) => item.href === pathname || pathname.startsWith(item.href + "/"))?.name || "Overview";

  const [data, setData] = useState<AppData>(initialData);
  const tables = data.tables ?? defaultTables;
  const kitchens = stationRows(data);
  const stationName = (id: string) => kitchens.find((k) => k.id === id)?.name || id;
  const [orderEpoch,setOrderEpoch]=useState(0);
  const [revision, setRevision] = useState(0);
  const readVersion = useRef(0);
  const queuedRead=useRef(createReadQueue(loadWorkspace));

  const [mode, setMode] = useState("loading");

  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All categories");

  const [drawer, setDrawer] = useState(false);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  useEffect(()=>{try{setSidebarCollapsed(localStorage.getItem("alpine:admin-sidebar-collapsed")==="1");}catch{}},[]);
  function toggleSidebar(){setSidebarCollapsed(previous=>{const next=!previous;try{localStorage.setItem("alpine:admin-sidebar-collapsed",next?"1":"0");}catch{}return next;});}

  const [modal, setModal] = useState<"menu" | "category" | "order" | "expense" | "cancel-order" | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

  const [editing, setEditing] = useState<MenuItem | null>(null);

  const [cart, setCart] = useState<Record<string, number>>({});

  const [floor, setFloor] = useState("All floors");

  const [range, setRange] = useState("Today");

  const [busy, setBusy] = useState(false);

  /* ────────── load workspace ────────── */
  useEffect(() => {
    let alive = true;
    const version = ++readVersion.current;
    queuedRead.current()
      .then((result) => {
        if (alive && version === readVersion.current) {
          setData(previous=>reconcileCollections(previous,result.data));
          setRevision(result.revision); if(result.orderEpoch!==undefined)setOrderEpoch(result.orderEpoch);
          setMode(result.mode);
        }
      })
      .catch((error) => {
        if (alive && version === readVersion.current) {
          setMode("error");
          setNotice(error.message);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5500);
    return () => clearTimeout(timer);
  }, [notice]);

  /* ────────── persist explicit changes ────────── */
  async function refreshWorkspace() {
    const version = ++readVersion.current;
    const result = await queuedRead.current();
    if (version === readVersion.current) { setData(previous=>reconcileCollections(previous,result.data)); setRevision(result.revision); if(result.orderEpoch!==undefined)setOrderEpoch(result.orderEpoch); setMode(result.mode); }
  }
  // Refresh live availability without replacing a form's in-progress edits.
  useEffect(() => {
    if (modal || busy) return;
    let alive = true;
    const timer = setInterval(() => { if(document.visibilityState==="hidden")return;const version = ++readVersion.current; void queuedRead.current().then((result) => {
      if (alive && version === readVersion.current) { setData(previous=>reconcileCollections(previous,result.data)); setRevision(result.revision); if(result.orderEpoch!==undefined)setOrderEpoch(result.orderEpoch); setMode(result.mode); }
    }).catch(() => {}); }, 15000);
    return () => { alive = false; clearInterval(timer); };
  }, [modal, busy]);
  // Keep drafts open; load the latest workspace once an active editor is closed.
  const queuedLive=useRef(false);
  useEffect(()=>{let stopped=false;const changed=()=>{if(modal||busy){queuedLive.current=true;return;}queuedLive.current=false;void refreshWorkspace().catch(()=>{});};window.addEventListener("alpine:data-changed",changed);if(queuedLive.current&&!stopped)changed();return()=>{stopped=true;window.removeEventListener("alpine:data-changed",changed);};},[modal,busy]);
  async function save(next: AppData) {
    if (mode === "loading" || mode === "error" || busy) return false;
    readVersion.current++;
    setBusy(true);
    try {
      const result = await persistWorkspace(next, data, revision);
      setData(previous=>reconcileCollections(previous,result.data));
      setRevision(result.revision); if(result.orderEpoch!==undefined)setOrderEpoch(result.orderEpoch);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save");
      return false;
    } finally {
      setBusy(false);
    }
  }

  // Include empty saved categories while retaining the original menu categories.
  const categories = useMemo(()=> Array.from(new Map(
    [...(data.categories || []), ...data.menu.map((i) => categoryName(i.category))]
      .map((name) => [name.toLowerCase(), name])
  ).values()),[data.categories,data.menu]);

  const filteredMenu = useMemo(()=> data.menu.filter(
    (i) =>
      (category === "All categories" || sameCategory(i.category,category) || (i.code && i.code === normalizeItemCode(search.replace(/^(?:কোড|code)\s*/i, "")))) &&
      matchesMenuSearch(i, search)
  ).sort((a, b) => (a.code || "999999").localeCompare(b.code || "999999", "en", { numeric: true })),[data.menu,category,search]);

  const orders = useMemo(()=> data.orders.filter((o) =>
    `${o.id} ${o.table} ${o.parcelToken || ""} ${o.customerName || ""} ${o.customerPhone || ""} ${o.waiter}`
      .toLowerCase()
      .includes(search.toLowerCase())
  ),[data.orders,search]);

  const active = useMemo(()=> data.orders.filter(
    (o) => !["Paid", "Cancelled"].includes(o.status)
  ),[data.orders]);

  const today = dayFormat.format(new Date());
  const periodOrders = useMemo(() => {
    const now = Date.now();
    return data.orders.filter(o => range === "Today"
      ? dayFormat.format(new Date(o.createdAt)) === today
      : now - new Date(o.createdAt).getTime() < 7 * 86400000);
  }, [data.orders, range, today]);
  const paid = useMemo(() => periodOrders.filter(o => paidOrder(o) && o.status !== "Cancelled"), [periodOrders]);
  const sales = useMemo(() => paid.reduce((sum, o) => sum + total(o), 0), [paid]);
  const expense = useMemo(() => {
    const now = Date.now();
    return data.expenses.filter(e => range === "Today" ? e.date === today : now - new Date(e.date).getTime() < 7 * 86400000)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [data.expenses, range, today]);
  const chart = useMemo(() => {
    const sums = new Map<string, number>();
    for (const o of data.orders) {
      if (!paidOrder(o) || o.status === "Cancelled") continue;
      const day = dayFormat.format(new Date(o.createdAt));
      sums.set(day, (sums.get(day) || 0) + total(o));
    }
    return Array.from({length:7}, (_, i) => {
      const date = new Date(Date.now() - (6-i)*86400000);
      return {day:weekdayFormat.format(date),sales:sums.get(dayFormat.format(date)) || 0};
    });
  }, [data.orders, today]);

  function navigate(name: string) {
    const destination = navigation.find((item) => item.name === name);
    if (destination) router.push(destination.href);
    setSearch("");
    setCategory("All categories");
    setDrawer(false);
  }

  function exportOrders() {
    const csv =
      "Order,Table,Waiter,Status,Total,Type,Parcel token,Packing charge,Payment\n" +
      data.orders
        .map((o) =>
          [
            o.id,
            o.table,
            `"${
              (/^[=+@\-\t\r]/.test(o.waiter) ? "'" : "") +
              o.waiter.replaceAll('"', '""')
            }"`,
            o.status,
            total(o), o.orderType === "takeaway" ? "takeaway" : o.items.some((l) => l.fulfillment === "parcel") ? "mixed" : "dine_in", o.parcelToken || "", o.packingCharge || 0, paidOrder(o) ? "Paid" : "Unpaid",
          ].join(",")
        )
        .join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "alpine-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Orders exported");
  }

  async function status(id: string, value: Order["status"]) {
    if (value === "Cancelled") { setCancelOrderId(id); setModal("cancel-order"); return; }
    await save({
      ...data,
      orders: data.orders.map((o) =>
        o.id === id ? { ...o, status: value } : o
      ),
    });
  }
  async function cancelOrder(id: string, reason: string, prepared: boolean) {
    const saved = await save({ ...data, orders: data.orders.map((order) => order.id === id
      ? { ...order, status: "Cancelled", cancelReason: reason, cancelPrepared: prepared } : order) });
    if (saved) { setModal(null); setCancelOrderId(null); setNotice("Order cancelled. Stock was released or recorded as waste."); }
    return saved;
  }

  const openOrder = (table?: string, existingId?: string) => {
    setAppendOrderId(existingId || null);
    setCart({});
    setSearch("");
    setOrderTable(table || tables[0]?.id || "");
    if(existingId){setModal("order");return;}
    setModal(null);
    const query=table?"?"+new URLSearchParams({table}).toString():"";
    router.push("/orders/new"+query);
  };

  const [appendOrderId, setAppendOrderId] = useState<string | null>(null);
  const [orderTable, setOrderTable] = useState("T-01");
  return {
    appendOrderId,
    tables,
    kitchens,
    stationName,
    paid,
    page,
    data,
    orderEpoch,
    mode,
    notice,
    setNotice,
    search,
    setSearch,
    category,
    setCategory,
    drawer,
    setDrawer,
    sidebarCollapsed,
    toggleSidebar,
    modal,
    setModal,
    editing,
    setEditing,
    cart,
    setCart,
    floor,
    setFloor,
    range,
    setRange,
    busy,
    save,
    refreshWorkspace,
    cancelOrderId,
    cancelOrder,
    categories,
    filteredMenu,
    orders,
    active,
    sales,
    expense,
    chart,
    navigate,
    exportOrders,
    status,
    openOrder,
    orderTable,
    setOrderTable,
  };
}
