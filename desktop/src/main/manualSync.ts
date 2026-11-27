/* A user's refresh must include a pass that starts after an older background pass ends. */
export class ManualSync{
 private pending?:Promise<void>;
 run(wait:()=>Promise<unknown>|undefined,fresh:()=>Promise<void>){if(this.pending)return this.pending;this.pending=(async()=>{await wait()?.catch(()=>{});await fresh();})().finally(()=>{this.pending=undefined;});return this.pending;}
}
