/* Copy only the shared audited business rules, never API config, secrets or database services. */
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),api=path.resolve(root,'../../alpine-api/src');
const files=['desktop/contracts.ts','desktop/core.ts','utils/ApiError.ts','utils/simpleCash.ts','utils/orderAdjustment.ts','utils/paymentCorrection.ts','utils/paymentBalances.ts','utils/authValidation.ts','utils/fishPricing.ts','types/workspace.ts','types/auth.ts','types/simpleCash.ts','types/inventory.ts','types/kot.ts','constants/permissions.ts'];
if(!fs.existsSync(api)){if(!files.every(file=>fs.existsSync(path.join(root,'shared',file))))throw Error('Shared rules are missing; place alpine-api beside alpine-admin.');console.log('Using the pinned shared business rules in this checkout.');}else{
for(const file of files){let text=fs.readFileSync(path.join(api,file),'utf8');text=text.replace(/(["'])@\/([^"']+)\1/g,(_match,quote,target)=>{let relative=path.relative(path.dirname(file),target).replace(/\\/g,'/');if(!relative.startsWith('.'))relative='./'+relative;return quote+relative+quote;});const dest=path.join(root,'shared',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text);}
console.log('Shared desktop rules refreshed ('+files.length+' source files).');

}
