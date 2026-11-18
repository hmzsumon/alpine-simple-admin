import type {Order} from '@/types';
export interface SalesFilters {from:string;to:string;fromTime:string;toTime:string;waiterId:string;}
export interface SalesStaff {id:string;name:string;orders:number;sales:number;collected:number;}
export interface SalesCategory {name:string;quantity:number;gross:number;discount:number;net:number;}
export interface SalesItem {id:string;name:string;nameBn:string;code:string;category:string;quantity:number;orders:number;gross:number;discount:number;net:number;}
export interface SalesLedgerRow {id:string;bill:string;at:string;waiterId:string;waiter:string;counter:string;hall:string;table:string;status:string;quantity:number;net:number;collected:number;due:number;runningSales:number;}
export interface SalesAnalysisData {totals:{orders:number;sales:number;collected:number;due:number;foodNet:number;packingNet:number;packing:number;discount:number;quantity:number};categories:SalesCategory[];items:SalesItem[];staff:SalesStaff[];waiters:SalesStaff[];orders:Order[];ledger:SalesLedgerRow[];totalRecords:number;totalLedgerRecords:number;offset:number;limit:number;filters:SalesFilters&{waiterName:string};generatedAt:string;}
