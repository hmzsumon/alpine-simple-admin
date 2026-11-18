/* ── Persist intent first; only a durable server receipt can clear the local drawer ── */
export interface PendingTransfer {kind:'handover'|'release';body:Record<string,unknown>;}
export async function completeTransfer(value:PendingTransfer,io:{remote:(path:string,body:unknown)=>Promise<unknown>;releaseLocal:()=>Promise<unknown>;clearCounter:()=>Promise<unknown>;clearIntent:()=>Promise<unknown>}){await io.remote('/api/desktop/'+value.kind,value.body);await io.releaseLocal();await io.clearCounter();await io.clearIntent();}
