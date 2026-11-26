import {useEffect,useRef,useState} from "react";
import {invoke,isTauri} from "@tauri-apps/api/core";
import {BarChart3, ChartNoAxesCombined, ChevronRight, CircleCheck, ShieldCheck, Wallet,PanelLeftClose,PanelLeftOpen} from "lucide-react";
import BrandSidebar from "./components/BrandSidebar";
import ConnectionCard from "./components/ConnectionCard";
import {CLOUD_ORIGIN,readConnection,saveConnection,type ConnectionMode} from "./lib/connection";
export default function App() {
  const [initial]=useState(readConnection),[mode,setMode]=useState<ConnectionMode>(initial.mode),[local,setLocal]=useState(initial.local);
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");const flight=useRef(false);
  const manual=useRef(false),[serverDetected,setServerDetected]=useState(false),[detecting,setDetecting]=useState(true),[collapsed,setCollapsed]=useState(false);
  useEffect(()=>{try{setCollapsed(localStorage.getItem("alpine:launcher-sidebar-collapsed")==="1");}catch{}let alive=true;
    if(!isTauri()){setDetecting(false);return;}
    void invoke<string|null>("detect_local_server").then(origin=>{if(alive&&origin){setServerDetected(true);if(!manual.current){setMode("local");setLocal(origin);setStatus("Restaurant server found on this PC.");}}}).catch(()=>undefined).finally(()=>{if(alive)setDetecting(false);});return()=>{alive=false;};
  },[]);
  function toggleSidebar(){setCollapsed(previous=>{const next=!previous;try{localStorage.setItem("alpine:launcher-sidebar-collapsed",next?"1":"0");}catch{}return next;});}
  async function connect(){
    if(flight.current)return;flight.current=true;setBusy(true);setError("");setStatus("Checking your selected workspace…");
    try {
      if(!isTauri())throw Error("Open the installed Alpine Owner & Admin app to connect. This browser page is the design preview.");
      await invoke("open_workspace",{origin:mode==="cloud"?CLOUD_ORIGIN:local.trim()});saveConnection(mode,local.trim());setStatus("Workspace opened. You can return here to change the connection.");
    } catch(e){setError(typeof e==="string"?e:e instanceof Error?e.message:"Could not open the workspace. Please try again.");setStatus("");}
    finally{flight.current=false;setBusy(false);}
  }
  const cards=[{icon:ChartNoAxesCombined,title:"Sales & performance",text:"Reports, daily totals and category insights.",tone:"blue"},{icon:Wallet,title:"Cash & reconciliation",text:"Cash movements, payment methods and custody.",tone:"teal"},{icon:ShieldCheck,title:"People & access",text:"Staff accounts, permissions and counter setup.",tone:"violet"}];
  return <div className={`app-shell${collapsed?" launcher-collapsed":""}`}><BrandSidebar/><div className="app-content">
    <header className="app-topbar"><div><button className="launcher-sidebar-toggle" aria-label={collapsed?"Expand sidebar":"Collapse sidebar"} aria-expanded={!collapsed} onClick={toggleSidebar}>{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}</button>Workspace<ChevronRight size={14}/><strong>Getting started</strong></div><span className="desktop-badge"><span/> Desktop application</span></header>
    <main className="launcher-main"><div className="page-intro"><span className="eyebrow">ALPINE MANAGEMENT</span><h1>Your restaurant.<br className="small-break"/> In clear view.</h1><p>Manage the details. Keep your focus on the business.</p></div>
      <div className="launch-grid"><ConnectionCard mode={mode} setMode={value=>{manual.current=true;setMode(value);setError("");setStatus("");}} local={local} setLocal={value=>{manual.current=true;setLocal(value);}} busy={busy} error={error} status={status} onConnect={connect} serverDetected={serverDetected} detecting={detecting}/>
        <section className="workspace-summary" aria-label="Management workspace"><div className="summary-heading"><span className="eyebrow">BUILT FOR DAILY OPERATIONS</span><h2>Everything stays connected.</h2><p>Your existing management tools, together in one desktop workspace.</p></div>{cards.map(({icon:Icon,title,text,tone})=><div className="feature-row" key={title}><span className={`feature-icon ${tone}`}><Icon size={21}/></span><div><h3>{title}</h3><p>{text}</p></div></div>)}<div className="summary-footer"><CircleCheck size={17}/> Existing features and access rules preserved</div></section>
      </div>
      <footer className="app-footer"><span>Alpine Restaurant <span className="footer-dot">·</span> Owner & Admin</span><span><BarChart3 size={13}/> Version 1.0.1</span></footer>
    </main>
  </div></div>;
}
