/* ── Component: show only actionable connection problems ── */
"use client";
import { useAdminContext } from "@/context/AdminContext";
import { AlertCircle } from "lucide-react";

export default function WorkspaceBanner() {
  const { mode } = useAdminContext();
  // Normal connection details belong in diagnostics, not the daily workspace.
  if (mode !== "error") return null;
  return <div className="mode-banner error" role="alert"><span><AlertCircle size={16} /> Unable to connect. Changes are temporarily unavailable.</span><small>Please check your connection and try again.</small></div>;
}
