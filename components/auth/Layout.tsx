/* ── Component: DashboardShell ────────────────────────────────────────────── */
"use client";
/* ────────── imports ────────── */
import type { ReactNode } from "react";
import AdminSidebar from "@/components/sidebar/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import WorkspaceBanner from "@/components/layout/WorkspaceBanner";
import AdminFooter from "@/components/layout/AdminFooter";
import AdminModal from "@/components/ui/AdminModal";
import NotificationToast from "@/components/ui/NotificationToast";
import { useAdminContext } from "@/context/AdminContext";

/* ────────── dashboard layout ────────── */
export default function DashboardShell({ children }: { children: ReactNode }) {
  const { drawer, setDrawer,sidebarCollapsed } = useAdminContext();
  return (
    <div className={`admin-shell${sidebarCollapsed?" sidebar-collapsed":""}`}>
      <AdminSidebar />
      {drawer && (
        <button
          aria-label="Close navigation"
          className="scrim"
          onClick={() => setDrawer(false)}
        />
      )}
      <div className="main-wrap">
        <AdminHeader />
        <main>
          <AdminPageHeader />
          <WorkspaceBanner />
          {children}
          <AdminFooter />
        </main>
      </div>
      <NotificationToast />
      <AdminModal />
    </div>
  );
}
