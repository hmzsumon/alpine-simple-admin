/* Saved second-counter bills drain promptly; overlapping kicks require a trailing drain. */
export class PriorityUpload{
 private pending?:Promise<void>;private again=false;
 run(upload:()=>Promise<void>){if(this.pending){this.again=true;return this.pending;}this.pending=(async()=>{do{this.again=false;await upload();}while(this.again);})().finally(()=>{this.pending=undefined;});return this.pending;}
}
