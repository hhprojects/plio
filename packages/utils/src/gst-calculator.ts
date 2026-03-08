// GST calculation utilities for Singapore
// No external dependencies

/**
 * Calculate GST (Goods and Services Tax) from a subtotal.
 *
 * @param subtotal - The pre-tax amount
 * @param gstRate - The GST rate as a percentage (e.g. 9 for 9%)
 * @returns Object with subtotal, gstAmount, and total (all rounded to 2 decimal places)
 */
export function calculateGST(
  subtotal: number,
  gstRate: number
): {
  subtotal: number;
  gstAmount: number;
  total: number;
} {
  const gstAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gstAmount,
    total,
  };
}

/**
 * Format a numeric amount as a currency string.
 *
 * @param amount - The amount to format
 * @param currency - The currency code (default: "SGD")
 * @returns Formatted string, e.g. "S$123.45" for SGD
 */
export function formatCurrency(amount: number, currency: string = 'SGD'): string {
  if (currency === 'SGD') {
    return `S$${amount.toFixed(2)}`;
  }

  // Use Intl.NumberFormat for other currencies
  try {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency code is invalid
    return `${currency} ${amount.toFixed(2)}`;
  }
}
