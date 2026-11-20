import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
/** Keep the live dev cache separate so a build cannot erase its page modules. */
export default function config(phase) {
  return { ...(process.env.ALPINE_STANDALONE === "1" ? { output: "standalone" } : {}), reactStrictMode: true, distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next" };
}