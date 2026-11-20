/* ── An address change must prove the same existing reservation; it never reserves or drops a ledger ── */
import type {Snapshot,DesktopCommand} from '../../shared/desktop/contracts';
import {fingerprint} from '../../shared/desktop/core';
export function assertSameReservation(saved:Snapshot,remote:Snapshot,events:DesktopCommand[]){
 const a=saved?.catalog,b=remote?.catalog;
 if(!a?.leaseId||!b||a.leaseId!==b.leaseId||a.deviceId!==b.deviceId||a.user?.id!==b.user?.id||a.counter?.id!==b.counter?.id||a.epoch!==b.epoch)throw Error('The new address does not match this PC’s saved counter reservation. Reconnect the original server; local records are retained.');
 const base=saved.lastSequence-events.length;
 if(!Number.isSafeInteger(remote.lastSequence)||remote.lastSequence<base||remote.lastSequence>saved.lastSequence)throw Error('The new address has a different synchronization sequence. Local records are retained.');
 if(!events.length&&saved.lastHash!==remote.lastHash)throw Error('The new address has a different transaction receipt. Local records are retained.');
 if(events.length&&remote.lastSequence>base){const accepted=events.find(event=>event.sequence===remote.lastSequence);if(!accepted||fingerprint(accepted)!==remote.lastHash)throw Error('The new address has a different saved transaction receipt. Local records are retained.');}
}
