/* ── Shared offline protocol: the same financial engine runs on Windows and the API ── */
import type {AuthUser} from '../types/auth';
import type {Order,MenuItem,RestaurantTable} from '../types/workspace';
import type {CashCounter,CashDay,CashMethod} from '../types/simpleCash';
export interface Catalog {mode?:'assistant';leaseId?:string;id:string;menu:MenuItem[];methods:CashMethod[];tables:RestaurantTable[];halls:{id:string;name:string;floor:string;counterId?:string}[];waiters:{id:string;name:string;phone?:string}[];cashiers?:{id:string;name:string}[];counter:CashCounter;issuedAt:string;expiresAt:string;epoch:number;user:AuthUser;deviceId:string;}
export interface Snapshot {catalog:Catalog;grant:string;day:CashDay|null;orders:Order[];lastSequence:number;lastHash?:string;serverTime:string;}
export type Action='open'|'create'|'pay'|'edit'|'cancel'|'movement'|'correct'|'close';
export interface DesktopCommand {protocol:1;id:string;sequence:number;deviceId:string;counterId:string;epoch:number;catalogId:string;at:string;action:Action;orderId?:string;before?:string;data:Record<string,unknown>;}
export interface DesktopLease {generation?:string;deviceId:string;userId:string;counterId:string;startedAt:string;lastSeenAt:string;sequence:number;lastHash?:string;lastCommandId?:string;}
