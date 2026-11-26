/* ── Component: AdminSidebar ────────────────────────────────────────────── */
"use client";

/* ────────── imports ────────── */
import Link from "next/link";
import {useRouter} from "next/navigation";
import type { MouseEvent } from "react";
import { useAdminContext } from "@/context/AdminContext";
import {
  ArrowUpRight,
  ChevronDown,
  CircleHelp,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { canAccessPath } from "@/config/access";
import { LogOut } from "lucide-react";
import { navigation } from "@/config/admin";

export default function AdminSidebar() {
  const router=useRouter();
  const { user, logout } = useAuth();
  /* ────────── workspace state ────────── */
  const { page, drawer, active, navigate } = useAdminContext();

  // Leave modified clicks to the browser so new tabs preserve native link behavior.
  function follow(event: MouseEvent<HTMLAnchorElement>, name: string) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(name);
  }

  return (
    <aside className={`sidebar ${drawer ? "open" : ""}`}>
      <a className="brand" href="/" aria-label="Alpine home">
        <img className="admin-brand-image" src="/alpine-brand.png" alt="Alpine Restaurant" width={44} height={44} />
        <span>
          ALPINE<small>RESTAURANT</small>
        </span>
      </a>
      <div className="location">
        <span className="location-icon">
          <UtensilsCrossed size={17} />
        </span>
        <div>
          Chowhatta, Sylhet<small>Main branch</small>
        </div>
        <ChevronDown size={14} />
      </div>
      <p className="nav-label">WORKSPACE</p>
      <nav aria-label="Workspace navigation">
        {navigation
          .filter((n) => canAccessPath(user, n.href))
          .map((n) => (
            <Link
              href={n.href}
              prefetch={false}
              onMouseEnter={()=>router.prefetch(n.href)}
              onFocus={()=>router.prefetch(n.href)}
              key={n.name}
              title={n.name}
              aria-label={n.name}
              className={page === n.name ? "selected" : ""}
              aria-current={page === n.name ? "page" : undefined}
              onClick={(event) => follow(event, n.name)}
            >
              <n.icon size={19} />
              <span className="nav-item-label">{n.name}</span>
              {n.name === "Orders" && (
                <span className="nav-count">{active.length}</span>
              )}
            </Link>
          ))}
      </nav>
      <div className="sidebar-note">
        <span className="signal" /> ALPINE SIMPLE · LOCAL
        <p>
          Simple order and cash accounting.
          <br />
          Separate local database.
        </p>
        <Link href="/guide/quick-start" onClick={event=>follow(event,"User guide")}>Quick start <ArrowUpRight size={15}/></Link>
      </div>
      <Link
        href="/guide"
        className="help-link"
        onClick={event => follow(event,"Guides")}
      >
        <CircleHelp size={18} /> User guide
      </Link>
      <div className="profile">
        <span className="avatar">A</span>
        <div>
          {user.name}
          <small>{user.role}</small>
        </div>
        <button className="icon-button" aria-label="Sign out" onClick={logout}>
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}
