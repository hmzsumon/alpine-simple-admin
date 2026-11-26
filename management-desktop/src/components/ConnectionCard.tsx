import {ArrowRight, Check, Cloud, LoaderCircle, Monitor, Server} from "lucide-react";
import type {ConnectionMode} from "../lib/connection";
type Props={mode:ConnectionMode;setMode:(mode:ConnectionMode)=>void;local:string;setLocal:(value:string)=>void;busy:boolean;error:string;status:string;onConnect:()=>void};
export default function ConnectionCard({mode,setMode,local,setLocal,busy,error,status,onConnect}:Props) {
  return <section className="connection-card" aria-labelledby="connection-title">
    <div className="card-heading"><span className="section-icon"><Monitor size={20}/></span><div><h2 id="connection-title">Open your workspace</h2><p>Choose where your restaurant is running.</p></div></div>
    <form onSubmit={event=>{event.preventDefault();onConnect();}}>
      <div className="connection-options" role="group" aria-label="Connection type">
        <button type="button" className={`connection-option ${mode==="cloud"?"chosen":""}`} aria-pressed={mode==="cloud"} onClick={()=>setMode("cloud")} disabled={busy}><Cloud size={22}/><span><strong>Cloud workspace</strong><small>Access from anywhere with internet</small></span><i>{mode==="cloud"&&<Check size={13}/>}</i></button>
        <button type="button" className={`connection-option ${mode==="local"?"chosen":""}`} aria-pressed={mode==="local"} onClick={()=>setMode("local")} disabled={busy}><Server size={22}/><span><strong>Restaurant server</strong><small>Open the local Admin on your server PC</small></span><i>{mode==="local"&&<Check size={13}/>}</i></button>
      </div>
      {mode==="local"&&<div className="server-field"><label htmlFor="server-address">Admin server address</label><input id="server-address" type="url" required spellCheck={false} autoComplete="url" value={local} disabled={busy} onChange={event=>setLocal(event.target.value)} placeholder="http://127.0.0.1:4251"/><p>Use port 4251 for Admin. The current Local Server opens Admin on the server PC only. Port 4250 is for Counter and Waiter apps.</p></div>}
      <div className="account-note"><ShieldNotice/><span>Sign in with your existing Owner or Admin account.<br/>Your assigned permissions apply throughout the app.</span></div>
      {error&&<div className="error-message" role="alert">{error}</div>}
      <button className="connect-button" type="submit" disabled={busy}>{busy?<><LoaderCircle className="spin" size={18}/>Connecting…</>:<>Continue to sign in<ArrowRight size={18}/></>}</button>
      <p className="connection-status" role="status">{status||"Your saved restaurant data stays with your selected server."}</p>
    </form>
  </section>;
}
function ShieldNotice(){return <svg width="20" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/></svg>;}
