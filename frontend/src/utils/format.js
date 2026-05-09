/**
 * Formats a number as Philippine Peso currency.
 * e.g. 1622.5 → "₱1,622.50"
 */
export const formatPeso = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₱0.00';
  return '₱' + Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
