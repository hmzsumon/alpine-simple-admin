import type {Order} from "@/types";
import {kitchenItems,kitchenTotal,bengaliNumber,bengaliMoney,kitchenTime} from "@/utils/kitchenPrinting";
export default function KitchenCopy({order}:{order:Order}){
  return <section className="selected-kitchen-copy" lang="bn" aria-label="Bengali kitchen copy">
    <header><h2>আলপাইন রেস্টুরেন্ট</h2><strong>কিচেন কপি</strong></header>
    <p>বিল: {order.simpleBillNo||order.id}</p><p>ওয়েটার: {order.waiter}</p><p>তারিখ ও সময়: {kitchenTime(order.createdAt)}</p>
    <table className="bill-items"><colgroup><col style={{width:"40%"}}/><col style={{width:"22%"}}/><col style={{width:"12%"}}/><col style={{width:"26%"}}/></colgroup><thead><tr><th>আইটেমের নাম</th><th>দর</th><th>পরিমাণ</th><th>টাকা</th></tr></thead><tbody>{kitchenItems(order).map((line,index)=><tr key={index}><td>{bengaliNumber(index+1)}. {line.nameBn||line.name}</td><td>{bengaliMoney(Math.round(line.price*100))}</td><td>{bengaliNumber(line.quantity)}</td><td>{bengaliMoney(Math.round(line.price*100)*line.quantity)}</td></tr>)}</tbody></table>
    <p className="kitchen-copy-total"><strong>কিচেনের আইটেম মোট (টাকা)</strong><strong>{bengaliMoney(kitchenTotal(order))}</strong></p>
  </section>;
}
