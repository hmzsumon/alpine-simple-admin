/* ── Small tea-only preparation slip; token reference identifies its customer bill ── */
import type {Order} from '@/types';
import {isTeaItem} from '@/utils/parcelPrinting';
export default function ParcelKitchenCopy({order}:{order:Order}){return <section className="parcel-kitchen-copy" aria-label="Parcel kitchen copy"><header><p><strong>KITCHEN TEA · {order.parcelToken||order.simpleBillNo||order.id}</strong></p></header><table className="bill-items kitchen-items"><thead><tr><th>Item</th><th>Qty</th></tr></thead><tbody>{order.items.filter(isTeaItem).map((line,index)=><tr key={index}><td>{index+1}. {line.name}{line.note&&<small>Note: {line.note}</small>}</td><td>{line.quantity}</td></tr>)}</tbody></table></section>;}
