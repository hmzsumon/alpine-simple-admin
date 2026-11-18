/* ────────── imports ────────── */
import type { Station } from "./workspace";
export type KotKind = "NEW" | "ADD" | "CANCEL";
export type KotStatus =
  | "queued"
  | "sending"
  | "sent"
  | "blocked"
  | "failed"
  | "uncertain"
  | "cancelled";
export interface KotLine {
  fulfillment?: "dine_in" | "parcel";
  name: string;
  nameBn?: string;
  quantity: number;
  note?: string;
  station: Station;
}
export interface KotEvent {
  id: string;
  orderId: string;
  parcelToken?: string;
  table: string;
  waiter: string;
  kind: KotKind;
  note?: string;
  createdAt: string;
  lines: KotLine[];
}
export interface MobileRequest {
  id: string;
  userId: string;
  payloadHash: string;
  orderId: string;
  createdAt: string;
}
export interface KotTicket {
  parcelToken?: string;
  id: string;
  eventId: string;
  orderId: string;
  table: string;
  waiter: string;
  station: Station;
  kind: KotKind;
  note?: string;
  createdAt: Date;
  lines: KotLine[];
  status: KotStatus;
  attempts: number;
  reprints: number;
  error?: string;
  sentAt?: Date;
  leaseUntil?: Date;
  nextAttemptAt?: Date;
}
