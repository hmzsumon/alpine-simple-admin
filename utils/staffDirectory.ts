/* ── Fast local employee search; mobile formats and Bengali digits share one index ── */
import type {AuthUser,StaffRole} from '@/types/auth';
export const staffRoleKey=(staff:Pick<AuthUser,'role'|'roleId'>)=>staff.roleId||staff.role;
const normalized=(value:string)=>value.normalize('NFKC').replace(/[০-৯]/g,d=>String('০১২৩৪৫৬৭৮৯'.indexOf(d))).toLocaleLowerCase().trim();
export function matchesStaff(staff:Pick<AuthUser,'name'|'phone'|'email'>,query:string){
 const q=normalized(query);if(!q)return true;
 const phone=normalized(staff.phone||'').replace(/\D/g,''),numbers=[phone,phone.startsWith('880')?'0'+phone.slice(3):phone.startsWith('0')?'880'+phone.slice(1):phone];
 const text=normalized(staff.name+' '+(staff.email||'')+' '+(staff.phone||''));
 const compact=q.replace(/[\s()+.\-]/g,'');if(/^\d+$/.test(compact)&&numbers.some(n=>n.includes(compact)))return true;
 return q.split(/\s+/).every(word=>text.includes(word)||(/^\+?[\d()-]+$/.test(word)&&/\d/.test(word)&&numbers.some(n=>n.includes(word.replace(/\D/g,'')))));
}
export type StaffStatus='all'|'active'|'inactive';
export function filterStaff(users:AuthUser[],query:string,role:string,status:StaffStatus){
 return users.filter(u=>(role==='all'||staffRoleKey(u)===role)&&(status==='all'||u.active===(status==='active'))&&matchesStaff(u,query)).sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true,sensitivity:'base'})||a.id.localeCompare(b.id));
}
export function staffRoleTabs(users:AuthUser[],roles:StaffRole[]){
 const result=new Map(roles.filter(r=>r.id!=='kitchen'&&(r.builtin||r.active||users.some(u=>staffRoleKey(u)===r.id))).map(r=>[r.id,{id:r.id,name:r.name,count:0}]));
 for(const u of users){const id=staffRoleKey(u),tab=result.get(id)||{id,name:u.roleName||u.role,count:0};tab.count++;result.set(id,tab);}
 return [{id:'all',name:'All staff',count:users.length},...result.values()];
}
