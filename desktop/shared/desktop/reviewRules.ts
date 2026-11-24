/* ── Business conflicts may be reviewed; identity, permissions and cash-day failures may not. ── */
import type {DesktopCommand} from './contracts';
const messages=new Set(['Foodpanda reference already exists.','This bill changed on another device. Keep the local transaction and resolve it before syncing.','Bill is already paid.','Bill not found in this cash day.','Only confirmed, non-cancelled bills can be changed.','Not enough cash for this refund or correction.','An earlier change to this bill needs Admin review.']);
export function isIsolatableConflict(event:Pick<DesktopCommand,'action'>,message:string){return ['create','pay','edit','cancel','correct'].includes(event.action)&&messages.has(message);}
