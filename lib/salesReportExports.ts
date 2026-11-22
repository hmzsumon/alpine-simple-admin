/* ── A single export request returns every matching row, independent of screen pagination ── */
import {adminFetch} from '@/lib/adminFetch';import {salesQuery} from '@/utils/salesReportFilters';import type {SalesFilters} from '@/types/salesAnalysis';
export type SalesExportFormat='pdf'|'xlsx'|'csv'|'print';export type SalesCsvView='waiters'|'items'|'ledger'|'categories'|'halls';
export async function exportSales(filters:SalesFilters,format:SalesExportFormat,view:SalesCsvView='ledger'){
 const url='/api/simple/sales-analysis/export?'+salesQuery(filters)+'&'+new URLSearchParams({format,view});
 if(format==='print'){const tab=window.open('','_blank');if(!tab)throw Error('Allow a new tab to open the printable report.');tab.opener=null;tab.location.href=url;return;}
 const r=await adminFetch(url,{cache:'no-store'});if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.error||'Could not prepare this report.');}const expected={pdf:'application/pdf',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',csv:'text/csv'}[format];if(!r.headers.get('content-type')?.startsWith(expected))throw Error('The report response could not be verified. Please try again.');
 const file=await r.blob(),download=URL.createObjectURL(file),a=document.createElement('a');a.href=download;a.download='Alpine-sales-'+filters.from+'-to-'+filters.to+(format==='csv'?'-'+view:'')+'.'+format;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(download),60000);
}
