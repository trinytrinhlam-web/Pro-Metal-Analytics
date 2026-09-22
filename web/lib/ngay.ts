/** Ngày làm + n tháng. 31/01 + 1 tháng không có 31/02 nên lùi về ngày cuối tháng. */
export function hanBaoHanh(moc: Date, thang: number): Date {
  const het = new Date(moc);
  const ngay = het.getDate();
  het.setMonth(het.getMonth() + thang);
  if (het.getDate() < ngay) het.setDate(0);
  return het;
}
