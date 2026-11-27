/* One background pass per interval. Manual checks bypass the delay without duplicating a pass. */
export const SYNC_INTERVAL=30000;
export class SyncSchedule{
 private last=Number.NEGATIVE_INFINITY;
 constructor(private now:()=>number=Date.now){}
 delay(){return Math.max(0,SYNC_INTERVAL-(this.now()-this.last));}
 start(){this.last=this.now();}
}
