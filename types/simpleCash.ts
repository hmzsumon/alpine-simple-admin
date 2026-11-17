/* ────────── money is stored as whole paisa; receipts retain method snapshots ────────── */
export type MethodKind="cash"|"mobile"|"bank"|"platform";
export interface CashMethod {id:string;name:string;kind:MethodKind;active:boolean;version:number;deleted?:boolean;}
export interface Allocation {methodId:string;name:string;kind:MethodKind;cents:number;}
export interface BillPayment {refund?:boolean;reason?:string;id:string;at:string;by:string;byName:string;allocations:Allocation[];totalCents:number;tenderedCashCents?:number;changeCents?:number;}
export interface CashMovement {id:string;no:string;kind:"in"|"out";cents:number;party:string;purpose:string;note:string;at:string;by:string;byName:string;balanceAfterCents:number;}
export interface CashHandover {id:string;no:string;fromId:string;fromName:string;toId:string;toName:string;expectedCents:number;countedCents:number;differenceCents:number;reason:string;at:string;acceptedAt?:string;cancelledAt?:string;cancelledBy?:string;}
export interface CashCommandRecord {id:string;hash:string;kind:string;ref:string;at:string;}
export interface CashCounter {id:string;code:string;name:string;active:boolean;version:number;deleted?:boolean;assignedCashierId?:string;assignedCashierName?:string;floor?:string;fallbackCounterId?:string;}
export interface CashDay {counterId?:string;counterCode?:string;counterName?:string;id:string;openedAt:string;openedBy:string;openingCents:number;openingCustodianId?:string;openingCustodianName?:string;custodianId:string;custodianName:string;sequence:number;orderSequence:number;movements:CashMovement[];handovers:CashHandover[];pending?:CashHandover;commands:CashCommandRecord[];closedAt?:string;closedBy?:string;countedCents?:number;differenceCents?:number;closeReason?:string;}
export interface DayReport {sales:number;discounts?:number;orders:number;cancelled:number;cashReceived:number;digitalReceived:number;platformReceivable:number;cashIn:number;cashOut:number;bookCash:number;handoverDifference:number;expectedCash:number;due:number;closingDifference:number|null;totalDifference:number|null;byMethod:{id:string;name:string;kind:MethodKind;cents:number}[];channels:{channel:string;orders:number;cents:number}[];}
export interface CashRegister {pendingHandover?:CashHandover;orderEpoch?:number;heldCounter?:{id:string;name:string};counter:CashCounter;counters:CashCounter[];mode:string;today:string;day:CashDay|null;report:DayReport|null;methods:CashMethod[];cashiers:{id:string;name:string;phone?:string}[];}
export interface CashDayView {day:CashDay;orders:import("@/types").Order[];report:DayReport;}
