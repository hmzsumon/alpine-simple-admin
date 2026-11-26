import type {AppData,Kitchen} from '@/types';
import {defaultKitchens} from '@/config/restaurantSetup';
export const UNASSIGNED_STATION='Unassigned';
export function stationRows(data:AppData):Kitchen[]{const rows=data.kitchens??defaultKitchens;return rows.some(row=>row.id===UNASSIGNED_STATION)?rows:[...rows,{id:UNASSIGNED_STATION,name:'স্টেশন ছাড়া',nameBn:'স্টেশন ছাড়া',floor:'—'}];}
export function assignStationItems(data:AppData,target:string,ids:Set<string>):AppData{
 if(!ids.size)throw Error('অন্তত একটি আইটেম নির্বাচন করুন।');if(!stationRows(data).some(station=>station.id===target))throw Error('স্টেশনটি পাওয়া যাচ্ছে না। রিফ্রেশ করুন।');
 if([...ids].some(id=>!data.menu.some(item=>item.id===id)))throw Error('আইটেমের তালিকা বদলেছে। আবার নির্বাচন করুন।');
 return {...data,menu:data.menu.map(item=>ids.has(item.id)?{...item,station:target}:item)};
}
