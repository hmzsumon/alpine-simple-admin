import {ArrowUpRight, BookOpen, ChartNoAxesCombined, CircleHelp, LayoutDashboard, Settings2, ShieldCheck, ShoppingBag, Users, Wallet} from "lucide-react";
const sections=[{name:"Overview",icon:LayoutDashboard},{name:"Orders & billing",icon:ShoppingBag},{name:"Cash register",icon:Wallet},{name:"Sales & reports",icon:ChartNoAxesCombined},{name:"Menu & categories",icon:BookOpen},{name:"Staff & permissions",icon:Users},{name:"Restaurant settings",icon:Settings2}];
export default function BrandSidebar() {
  return <aside className="app-sidebar">
    <div className="brand"><img src="/alpine-brand.png" alt="Alpine Restaurant" width="42" height="42"/><div>ALPINE<span>RESTAURANT MANAGEMENT</span></div></div>
    <div className="workspace-label">YOUR WORKSPACE</div>
    <div className="sidebar-preview" aria-label="Available management areas">{sections.map(({name,icon:Icon})=><div key={name}><Icon size={18}/><span>{name}</span></div>)}</div>
    <div className="sidebar-bottom"><div className="role-pill"><ShieldCheck size={17}/> Owner & Admin</div><p>One workspace.<br/>A clear view of your business.</p><div className="sidebar-help"><CircleHelp size={16}/> Guides are inside your workspace <ArrowUpRight size={14}/></div></div>
  </aside>;
}
