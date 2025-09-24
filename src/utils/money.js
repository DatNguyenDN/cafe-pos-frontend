export const parseDecimalToNumber = (value) => {
  if (value == null) return 0;
  if (typeof value === "number") return Math.round(value);
  // "175000", "175,000.00" -> 175000
  const cleaned = String(value).replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : Math.round(n);
};

export const toVND = (value) =>
  new Intl.NumberFormat("vi-VN").format(parseDecimalToNumber(value)) + " đ";

export function categoriesFromItems(items = []) {
  const set = new Set(items.map((x) => x?.category).filter(Boolean));
  return Array.from(set);
}

export function formatVND(n) {
  const num = typeof n === 'string' ? parseFloat(n) : Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return safe.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}