"use client";
import {Pencil,Trash2} from "lucide-react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {confirmAction} from "@/lib/feedback";
import {useAdminContext} from "@/context/AdminContext";
import {useAuth} from "@/providers/AuthProvider";
import {sameCategory,UNCATEGORIZED} from "@/utils/categoryItems";

export default function CategoryManagement(){
  const {data,categories,save,busy,mode,setNotice,category,setCategory}=useAdminContext(),{can}=useAuth(),router=useRouter();
  const names=categories.filter(name=>!sameCategory(name,UNCATEGORIZED));
  return <details className="category-management"><summary>Manage categories <span className="count-pill">{names.length}</span></summary>
    <p className="muted">Edit opens a category page with its items, rename, removal and transfer options. <Link className="category-edit-button" href={'/menu/categories/'+UNCATEGORIZED}>Uncategorized items</Link></p>
    <div className="category-chip-grid">{names.map(name=>{
      const count=data.menu.filter(item=>sameCategory(item.category,name)).length;
      return <div className="category-manage-chip" key={name}><span className="category-manage-name">{name}<small>{count} items</small></span>{can("menu:manage")&&<div className="category-manage-actions">
        <button type="button" className="category-edit-button" aria-label={'Edit '+name+' category'} disabled={busy||mode!=="database"} onClick={()=>router.push('/menu/categories/'+encodeURIComponent(name))}><Pencil size={14}/><span>Edit</span></button>
        <button type="button" className="icon-button danger-text" aria-label={name+' Category Delete'} title={'Delete '+name+' category'} disabled={busy||mode!=="database"} onClick={async()=>{
          if(count){setNotice("This category contains items. Open Edit to transfer or remove them first.");return;}
          if(!await confirmAction('Delete '+name+' category?'))return;
          if(await save({...data,categories:categories.filter(value=>!sameCategory(value,name))})){if(sameCategory(category,name))setCategory("All categories");setNotice("Category deleted.");}
        }}><Trash2 size={16}/></button>
      </div>}</div>;
    })}</div>
  </details>;
}