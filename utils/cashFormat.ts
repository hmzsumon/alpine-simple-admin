/* ────────── paisa-to-taka formatting is presentation only ────────── */
export const taka=(cents:number)=>"BDT "+(cents/100).toLocaleString("en-BD",{minimumFractionDigits:2,maximumFractionDigits:2});
export const dayToday=()=>new Date(Date.now()+21600000).toISOString().slice(0,10);
export const channelName=(channel?:string)=>channel==="foodpanda"?"Foodpanda":channel==="takeaway"?"Parcel":"Dine-in";
