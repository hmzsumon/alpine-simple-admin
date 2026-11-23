/* ── A failed screen must leave a visible recovery path; reloading never repeats a transaction ── */
import React from 'react';
export class ScreenBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){if(!this.state.failed)return this.props.children;return <main className="login"><section className="login-card" role="alert"><h1>The screen could not load</h1><p>The screen could not load. Your saved orders and payments remain on this PC.</p><p>Check the network connection, then refresh the screen. Previous saves or payments will not be resubmitted automatically.</p><button className="primary" onClick={()=>window.location.reload()}>Refresh screen</button><p className="muted">If it happens again, send a photo of this message. Reference: COUNTER-SCREEN-01</p></section></main>;}
}
