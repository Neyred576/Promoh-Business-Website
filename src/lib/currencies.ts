export const COUNTRIES = [
  { name: "United States", code: "US", dialCode: "+1", currency: "USD", symbol: "$" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", currency: "GBP", symbol: "£" },
  { name: "Kenya", code: "KE", dialCode: "+254", currency: "KES", symbol: "KSh" },
  { name: "Nigeria", code: "NG", dialCode: "+234", currency: "NGN", symbol: "₦" },
  { name: "South Africa", code: "ZA", dialCode: "+27", currency: "ZAR", symbol: "R" },
  { name: "Canada", code: "CA", dialCode: "+1", currency: "CAD", symbol: "CA$" },
  { name: "Australia", code: "AU", dialCode: "+61", currency: "AUD", symbol: "A$" },
  { name: "India", code: "IN", dialCode: "+91", currency: "INR", symbol: "₹" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", currency: "AED", symbol: "د.إ" },
  { name: "Germany", code: "DE", dialCode: "+49", currency: "EUR", symbol: "€" },
  { name: "France", code: "FR", dialCode: "+33", currency: "EUR", symbol: "€" },
  { name: "Ghana", code: "GH", dialCode: "+233", currency: "GHS", symbol: "GH₵" },
];

export const CURRENCIES: Record<string, { symbol: string; name: string; code: string }> = {
  USD: { symbol: "$", name: "US Dollar", code: "USD" },
  EUR: { symbol: "€", name: "Euro", code: "EUR" },
  GBP: { symbol: "£", name: "British Pound", code: "GBP" },
  KES: { symbol: "KSh", name: "Kenyan Shilling", code: "KES" },
  NGN: { symbol: "₦", name: "Nigerian Naira", code: "NGN" },
  ZAR: { symbol: "R", name: "South African Rand", code: "ZAR" },
  CAD: { symbol: "CA$", name: "Canadian Dollar", code: "CAD" },
  AUD: { symbol: "A$", name: "Australian Dollar", code: "AUD" },
  INR: { symbol: "₹", name: "Indian Rupee", code: "INR" },
  AED: { symbol: "د.إ", name: "UAE Dirham", code: "AED" },
  GHS: { symbol: "GH₵", name: "Ghanaian Cedi", code: "GHS" },
};

export function formatCurrency(amount: number, currency: string = "USD") {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const sym = CURRENCIES[currency]?.symbol || "$";
    return `${sym}${amount.toLocaleString()}`;
  }
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCIES[currency]?.symbol || "$";
}
