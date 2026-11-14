/* ────────── imports ────────── */
import type { Metadata } from "next";
import "./globals.css";
import LiveUpdates from "@/components/ui/LiveUpdates";
import FeedbackProvider from "@/components/ui/FeedbackProvider";
export const metadata: Metadata = {
  title: "Alpine Simple • Admin",
  icons: {icon:"/alpine-brand.png",apple:"/alpine-brand.png"},
  description: "Alpine Restaurant operations, menu and kitchen management",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body><FeedbackProvider language="en"><LiveUpdates/>{children}</FeedbackProvider></body>
    </html>
  );
}
