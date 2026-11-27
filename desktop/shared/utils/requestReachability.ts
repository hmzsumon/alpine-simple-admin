/* A stale concurrent timeout cannot undo a newer response. Sustained failures remain visible. */
export class RequestReachability{
 private scope='';private sequence=0;private lastReply=0;private lastReplyId=0;private failures=0;private connected=false;
 constructor(private now:()=>number=Date.now,private grace=30000){}
 begin(scope:string){if(this.scope!==scope){this.scope=scope;this.lastReply=0;this.lastReplyId=0;this.failures=0;this.connected=false;}return {scope,id:++this.sequence};}
 reply(ticket:{scope:string;id:number}){if(ticket.scope===this.scope){this.lastReply=this.now();this.lastReplyId=Math.max(ticket.id,this.lastReplyId);this.failures=0;this.connected=true;}return this.connected;}
 failed(ticket:{scope:string;id:number}){if(ticket.scope!==this.scope||ticket.id<this.lastReplyId)return this.connected;this.failures++;if(!this.connected||this.failures>=2&&this.now()-this.lastReply>=this.grace)this.connected=false;return this.connected;}
}
