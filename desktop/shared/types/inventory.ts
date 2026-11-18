/* ────────── prepared-food inventory; ingredient recipes are a separate phase ────────── */
import type { Station } from "./workspace";
export type StockPool = {
  id: string; name: string; station: Station; unit: string;
  mode: "counted" | "availability"; onHand: number; soldOut: boolean;
  lowAt: number; version: number; links: { menuId: string; units: number }[];
};
export type StockAllocation = {
  id: string; orderId: string; menuId: string; poolId: string; quantity: number;
  status: "reserved" | "issued";
};
export type StockDayRow = {
  poolId: string; name: string; unit: string; opening: number; received: number;
  issued: number; sold: number; manualWaste: number; cancelledWaste: number;
  staffMeal: number; adjustment: number;
};
export type StockDay = {
  id: string; date: string; openedAt: string; openedBy: string; rows: StockDayRow[];
};
export type StockClosing = {
  id: string; date: string; openedAt: string; closedAt: string; openedBy: string;
  closedBy: string; note: string;
  rows: (StockDayRow & { expected: number; actual: number; variance: number; reason: string })[];
};
export type Inventory = {
  pools: StockPool[]; allocations: StockAllocation[]; day: StockDay | null; lastClosedDate: string | null;
};
export type StockAvailability = {
  tracked: boolean; available: boolean; quantity: number | null; unit: string;
  low: boolean; reason: string;
};
export type StockEvent = {
  id: string; kind: string; at: string; actor: string; dayId?: string; dayDate?: string;
  poolId?: string; poolName?: string; unit?: string; quantity?: number; delta?: number;
  balance?: number; orderId?: string; note: string; payloadHash?: string; closing?: StockClosing;
};
