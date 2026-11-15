/* ── Component: AdminPageHeader ────────────────────────────────────────────── */
"use client";

/* ────────── imports ────────── */
import { useAuth } from "@/providers/AuthProvider";
import { useAdminContext } from "@/context/AdminContext";
import {usePathname} from "next/navigation";
import { Plus } from "lucide-react";
import { heading } from "@/config/admin";

export default function AdminPageHeader() {
  const { can } = useAuth();
  const pathname=usePathname();
  /* ────────── workspace state ────────── */
  const { page, mode, busy, openOrder } = useAdminContext();

  if(pathname==="/orders/new")return null;
  if(["Counter setup","Overview","Cash register","Payment methods","Sales & closing reports"].includes(page))return null;
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          ALPINE RESTAURANT <span>/</span> OPERATIONS
        </div>
        <h1>{page === "Overview" ? "Overview" : page}</h1>
        <p>{heading[page]}</p>
      </div>
      {page !== "Guides" && page !== "ক্রয় ও স্টোর" && <div className="heading-actions">

        <button
          className="primary"
          disabled={
            !can("orders:create") ||
            busy ||
            mode === "loading" ||
            mode === "error"
          }
          onClick={() => openOrder()}
        >
          <Plus size={17} /> New order
        </button>
      </div>}
    </div>
  );
}
