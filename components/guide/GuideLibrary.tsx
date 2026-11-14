/* ── Component: GuideLibrary ─────────────────────────────────────────── */
"use client";
import { useState } from "react";
import { BookOpen, Search, X } from "lucide-react";
import { guides, guideCategories } from "@/config/guides";
import GuideCard from "./GuideCard";

export default function GuideLibrary() {
  const [search, setSearch] = useState(""), [category, setCategory] = useState("All topics");
  const query = search.trim().toLocaleLowerCase();
  const visible = guides.filter((guide) => (category === "All topics" || category === guide.category) &&
    JSON.stringify(guide).toLocaleLowerCase().includes(query));
  return <div className="guide-workspace" lang="bn">
    <section className="guide-welcome">
      <span className="guide-welcome-icon"><BookOpen size={28} /></span>
      <div><span className="guide-kicker">ALPINE User handbook</span><h2>Your work, in simple steps</h2><p>Choose a topic to see short instructions, practical examples and helpful tips.</p></div>
      <div className="guide-total"><strong>{guides.length.toLocaleString("en-GB")}</strong><span>Topic guide</span></div>
    </section>
    <div className="guide-search"><Search size={19} /><input aria-label="Search guides" placeholder="What would you like to learn? Try orders, cash or passwords..." value={search} onChange={(e) => setSearch(e.target.value)} />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={17} /></button>}</div>
    <div className="guide-categories" role="group" aria-label="Topic category">{["All topics", ...guideCategories].map((name) => <button key={name} type="button" aria-pressed={category === name} className={category === name ? "is-active" : ""} onClick={() => setCategory(name)}>{name}</button>)}</div>
    <div className="guide-results" role="status">{visible.length.toLocaleString("en-GB")}guides <span>Examples are for learning and do not change real records.</span></div>
    {visible.length ? <div className="guide-grid">{visible.map((guide) => <GuideCard key={guide.slug} guide={guide} />)}</div> : <section className="guide-empty"><Search size={28} /><h3>Guide not found</h3><p>Try a different word or browse all topics.</p><button type="button" className="secondary" onClick={() => { setSearch(""); setCategory("All topics"); }}>Browse all guides</button></section>}
  </div>;
}
