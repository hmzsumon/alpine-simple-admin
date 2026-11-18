/* ── Remount on counter navigation so a previous drawer's form is never shown for the new selection ── */
import CashPage from '@/components/cash/CashPage';
export default function Page({searchParams}:{searchParams:{counterId?:string}}){const id=typeof searchParams.counterId==='string'?searchParams.counterId:undefined;return <CashPage key={id||'default'} counterId={id}/>;}
