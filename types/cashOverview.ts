/* ── Counter status and financial totals are supplied by the protected API ── */
import type {CashCounter,CashMethod,DayReport} from './simpleCash';
export interface CounterOverview extends CashCounter {status:'open'|'closed'|'off';businessDate?:string;custodianName?:string;pendingHandover:boolean;report:DayReport|null;}
export interface CashOverview {date:string;updatedAt:string;totals:Pick<DayReport,'sales'|'discounts'|'orders'|'cashReceived'|'digitalReceived'|'platformReceivable'|'due'|'expectedCash'>;byMethod:DayReport['byMethod'];methods:CashMethod[];counters:CounterOverview[];previousDayOpen:number;}
