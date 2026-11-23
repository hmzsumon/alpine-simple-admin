/* ── Slow state replies cannot overwrite a later sign-in or restored counter. ── */
export class StateReader<T>{
 private sequence=0;
 constructor(private fetch:()=>Promise<T>,private apply:(state:T)=>void){}
 async read(){const id=++this.sequence;try{const state=await this.fetch();if(id===this.sequence)this.apply(state);}catch(error){if(id===this.sequence)throw error;}}
 accept(state:T){++this.sequence;this.apply(state);}
 invalidate(){++this.sequence;}
}
