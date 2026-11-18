/* ── Feature workspaces own their actions; the shared heading never creates an order ── */
'use client';
import {useAdminContext} from '@/context/AdminContext';
import {usePathname} from 'next/navigation';
import {heading} from '@/config/admin';
export default function AdminPageHeader(){
 const pathname=usePathname(),{page}=useAdminContext();
 if(pathname==='/orders/new'||pathname==='/users'||['Counter setup','Overview','Cash register','Payment methods','Sales & closing reports','Sales & category reports'].includes(page))return null;
 return <div className="page-heading"><div><div className="eyebrow">ALPINE RESTAURANT <span>/</span> OPERATIONS</div><h1>{page}</h1><p>{heading[page]}</p></div></div>;
}
