import DailyReport from "@/components/cash/DailyReport";
import DayReportPage from "@/components/cash/DayReportPage";
export default function Page({params,searchParams}:{params:{date:string};searchParams:{counterId?:string}}){return searchParams.counterId?<DayReportPage date={params.date} counterId={searchParams.counterId}/>:<DailyReport date={params.date}/>;}
