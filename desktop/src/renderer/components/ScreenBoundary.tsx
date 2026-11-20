/* ── A failed screen must leave a visible recovery path; reloading never repeats a transaction ── */
import React from 'react';
export class ScreenBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){if(!this.state.failed)return this.props.children;return <main className="login"><section className="login-card" role="alert"><h1>স্ক্রিনটি লোড করা যায়নি</h1><p>The screen could not load. Your saved orders and payments remain on this PC.</p><p>নেটওয়ার্ক সংযোগ পরীক্ষা করে স্ক্রিনটি আবার খুলুন। আগের Save বা Payment নিজে থেকে আবার পাঠানো হবে না।</p><button className="primary" onClick={()=>window.location.reload()}>আবার খুলুন · Refresh screen</button><p className="muted">If it happens again, send a photo of this message. Reference: COUNTER-SCREEN-01</p></section></main>;}
}
