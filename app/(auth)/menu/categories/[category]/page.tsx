import CategoryEditor from "@/components/menu/CategoryEditor";
import {categoryFromPath} from "@/utils/categoryItems";
export default function Page({params}:{params:{category:string}}){return <CategoryEditor key={params.category} name={categoryFromPath(params.category)}/>;}
