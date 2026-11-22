/* ── Counter discovery is retried after an interrupted sign-in, without touching the ledger ── */
export interface CounterChoice {id:string;name:string;code:string;invitation?:{countedCents:number;fromName:string};recovery?:{leaseId:string;lastSeenAt:string;canRecover:boolean};}
export async function loadCounterChoices(remote:(path:string)=>Promise<any>,deviceId?:string):Promise<CounterChoice[]>{
 const result=await remote('/api/simple/counters');
 if(!Array.isArray(result?.counters)||!result.counters.every((c:any)=>c&&typeof c.id==='string'&&typeof c.name==='string'&&typeof c.code==='string'))throw Error('Counter setup could not be loaded. Check the restaurant server and try again.');
 let choices:CounterChoice[]=result.counters;
 try{const register=await remote('/api/simple/register');if(register?.pendingHandover&&register.counter&&typeof register.counter.id==='string'&&typeof register.counter.name==='string'&&typeof register.counter.code==='string')choices=[{...register.counter,invitation:register.pendingHandover},...choices.filter(c=>c.id!==register.counter.id)];}catch{/* A failed optional handover lookup must not erase valid counter choices. */}
 if(deviceId){try{const status=await remote('/api/desktop/recovery');choices=choices.map(choice=>{const lease=status.reservations?.find((l:any)=>l.counterId===choice.id&&l.deviceId!==deviceId);return lease?{...choice,recovery:{leaseId:lease.leaseId,lastSeenAt:lease.lastSeenAt,canRecover:lease.canRecover}}:choice;});}catch{/* Older servers retain ordinary counter connection. */}}
 return choices;
}
