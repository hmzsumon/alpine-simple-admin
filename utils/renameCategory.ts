import type {AppData} from "@/types";
/* Rename the menu definition and its items together; historical bill snapshots stay intact. */
export function renameCategory(data:AppData,from:string,input:string):AppData {
  const name=input.trim(),key=from.trim().toLowerCase();
  if(!name||name.length>100)throw Error("Enter a category name (1–100 characters).");
  const categories=[...new Set([...(data.categories||[]),...data.menu.map(item=>item.category)])];
  if(!categories.some(value=>value.toLowerCase()===key))throw Error("This category no longer exists. Refresh the menu and try again.");
  if(name.toLowerCase()==="all categories"||categories.some(value=>value.toLowerCase()!==key&&value.toLowerCase()===name.toLowerCase()))throw Error("This category already exists. Choose a different name.");
  const renamed=new Map<string,string>();for(const value of categories){const next=value.toLowerCase()===key?name:value;renamed.set(next.toLowerCase(),next);}
  return {...data,categories:[...renamed.values()],menu:data.menu.map(item=>item.category.toLowerCase()===key?{...item,category:name}:item)};
}
