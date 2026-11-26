"use client";
/* ────────── category selection filters the displayed report only ────────── */
import {useMemo, useRef, useState} from "react";
import {ChevronDown, Layers3} from "lucide-react";
import type {SalesCategory, SalesItem} from "@/types/salesAnalysis";
import {taka} from "@/utils/cashFormat";

export default function CategoryItemSales({categories, items, categoryOptions = []}: {
  categories: SalesCategory[];
  items: SalesItem[];
  categoryOptions?: string[];
}) {
  const [selected, setSelected] = useState("");
  const [expanded, setExpanded] = useState<Record<string,boolean>>({});
  const order = useRef<string[]>([]);
  // A live total can change the sales ranking; keep the rows where the user opened them.
  const names = new Set(categories.map(category=>category.name));
  order.current = [...order.current.filter(name=>names.has(name)),...categories.map(category=>category.name).filter(name=>!order.current.includes(name))];
  const options = useMemo(() => {
    const names = new Map<string, string>();
    for (const value of [...categoryOptions, ...categories.map(category => category.name), ...items.map(item => item.category)]) {
      const name = value.trim();
      if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
    }
    return [...names].sort((left, right) => left[1].localeCompare(right[1]));
  }, [categoryOptions, categories, items]);
  const activeCategory = options.some(([value]) => value === selected) ? selected : "";
  const grouped = useMemo(() => [...categories].sort((left,right)=>order.current.indexOf(left.name)-order.current.indexOf(right.name))
    .filter(category => !activeCategory || category.name.toLowerCase() === activeCategory)
    .map(category => ({...category, items: items.filter(item => item.category === category.name)}))
    .filter(category => category.items.length), [categories, items, activeCategory]);

  return <section className="sales-category-section">
    <div className="sales-category-heading">
      <div><h2>Categories &amp; items</h2><p>Category totals and the quantity and value sold for each food item.</p></div>
      <label className="sales-category-filter" htmlFor="sales-category-filter">
        Category
        <select id="sales-category-filter" value={activeCategory} onChange={event => setSelected(event.target.value)}>
          <option value="">All categories</option>
          {options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
        </select>
      </label>
    </div>
    <p className="sales-report-note">Food totals exclude packing. Invoice discounts are shared across items and packing using exact paisa.</p>
    {grouped.map(category => <details className="panel sales-category-card" key={category.name} open={expanded[category.name] ?? (!!activeCategory || category.name === order.current[0])} onToggle={event=>{const open=event.currentTarget.open;setExpanded(previous=>previous[category.name]===open?previous:{...previous,[category.name]:open});}}>
      <summary>
        <span className="sales-category-icon"><Layers3 size={18}/></span>
        <span className="sales-category-title"><strong>{category.name}</strong><small>{category.items.length} item types · {category.quantity} sold</small></span>
        <span className="sales-category-total"><small>Net food sales</small><strong>{taka(category.net)}</strong></span>
        <ChevronDown size={17}/>
      </summary>
      <div className="table-scroll"><table className="sales-report-table">
        <thead><tr><th>Code</th><th>Item</th><th className="num">Bills</th><th className="num">Qty sold</th><th className="num">Gross</th><th className="num">Discount</th><th className="num">Net food sales</th></tr></thead>
        <tbody>{category.items.map(item => <tr key={JSON.stringify([item.id, item.name])}>
          <td>{item.code || "—"}</td><td><strong>{item.name}</strong>{item.nameBn && <small className="item-note">{item.nameBn}</small>}</td>
          <td className="num">{item.orders}</td><td className="num strong">{item.quantity}</td>
          <td className="num">{taka(item.gross)}</td><td className="num">{taka(item.discount)}</td><td className="num strong">{taka(item.net)}</td>
        </tr>)}</tbody>
        <tfoot><tr><td colSpan={3}>Category total</td><td className="num">{category.quantity}</td><td className="num">{taka(category.gross)}</td><td className="num">{taka(category.discount)}</td><td className="num">{taka(category.net)}</td></tr></tfoot>
      </table></div>
    </details>)}
    {activeCategory && <p className="sales-report-note">Category selection filters this view. Report totals and exports include all categories in the selected period.</p>}
    {!grouped.length && <div className="panel sales-empty">{activeCategory ? "No food sales in this category for the selected period." : "No food sales in this period."}</div>}
  </section>;
}
