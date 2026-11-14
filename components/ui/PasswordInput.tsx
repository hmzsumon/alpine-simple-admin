/* ── Component: shared password visibility control for staff forms ── */
"use client";
import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return <span className="password-field" style={{ display: "block" }}>
    <input {...props} type={visible ? "text" : "password"} />
    <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} title={visible ? "Hide password" : "Show password"} onClick={() => setVisible(value => !value)}>
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  </span>;
}
