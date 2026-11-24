/* ── Whole units have no business cap; reject values JavaScript cannot represent exactly. ── */
export const isOrderQuantity=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=1;
