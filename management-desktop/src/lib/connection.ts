/* ────────── preferences contain server addresses, never account credentials ────────── */
export type ConnectionMode = "cloud" | "local";
export const CLOUD_ORIGIN = "https://alpine-simple-admin.vercel.app";
export const LOCAL_ORIGIN = "http://localhost:4251";
const key = "alpine-management-connection-v1";
export function readConnection(): {mode:ConnectionMode; local:string} {
  try { const data:unknown=JSON.parse(localStorage.getItem(key)||"null");
    if(data && typeof data==="object" && "mode" in data && "local" in data && typeof data.local==="string")
      return {mode:data.mode==="local"?"local":"cloud",local:data.local.slice(0,200)};
  } catch { /* Corrupt/disabled browser storage must not prevent sign-in. */ }
  return {mode:"cloud",local:LOCAL_ORIGIN};
}
export function saveConnection(mode:ConnectionMode,local:string) {
  try {localStorage.setItem(key,JSON.stringify({mode,local}));} catch { /* The current connection can still open. */ }
}
