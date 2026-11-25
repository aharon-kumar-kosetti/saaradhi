/** dd/mm/yyyy, unambiguous for Indian users and their notices. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

/** Indian digit grouping, e.g. ₹1,850. */
export function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
