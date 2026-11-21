/* ────────── code-only plans; IDs and old codes bind a reviewed change to its item ────────── */
import {normalizeItemCode} from './menuSearch';
export type CodedItem={id:string;code?:string;name:string;nameBn?:string};
export type CodeChange={id:string;oldCode:string;code:string};
export function applyMenuCodeChanges<T extends CodedItem>(menu:T[],changes:CodeChange[]):T[]{
 const updates=new Map<string,string>();
 for(const row of changes){
  const item=menu.find(i=>i.id===row.id),code=normalizeItemCode(row.code);
  if(!item||normalizeItemCode(item.code||'')!==normalizeItemCode(row.oldCode))throw Error('আইটেমের কোড বদলে গেছে। নতুন করে তালিকা যাচাই করুন।');
  if(updates.has(row.id))throw Error('একই আইটেম তালিকায় একাধিকবার আছে।');
  if(!/^[A-Z0-9][A-Z0-9._/-]{0,39}$/.test(code))throw Error('প্রতিটি আইটেমের জন্য সঠিক কোড দিন।');
  updates.set(row.id,code);
 }
 const next=menu.map(item=>updates.has(item.id)?{...item,code:updates.get(item.id)!}:item),owners=new Map<string,CodedItem>();
 for(const item of next){const code=normalizeItemCode(item.code||'');if(!code)continue;const owner=owners.get(code);if(owner)throw Error(`#${code} কোডটি ${owner.nameBn||owner.name} এবং ${item.nameBn||item.name}—দুই আইটেমে হচ্ছে। আলাদা কোড দিন।`);owners.set(code,item);}
 return next;
}
export function parseMenuCodeChanges(menu:CodedItem[],text:string):CodeChange[]{
 const rows=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),changes:CodeChange[]=[];
 for(let n=0;n<rows.length;n++){
  if(n===0&&/বর্তমান|current|old.?code/i.test(rows[n]))continue;
  const fields=rows[n].split(/[\t,; ]+/).filter(Boolean);if(fields.length!==2)throw Error(`লাইন ${n+1}: বর্তমান কোড ও নতুন কোড—দুটি ঘর দিন।`);
  const oldCode=normalizeItemCode(fields[0]),found=menu.filter(item=>normalizeItemCode(item.code||'')===oldCode);
  if(found.length!==1)throw Error(`বর্তমান কোড #${oldCode} দিয়ে একটি নির্দিষ্ট আইটেম পাওয়া যায়নি।`);
  changes.push({id:found[0].id,oldCode,code:normalizeItemCode(fields[1])});
 }
 if(!changes.length)throw Error('প্রথমে কোডের তালিকা দিন।');applyMenuCodeChanges(menu,changes);return changes;
}
