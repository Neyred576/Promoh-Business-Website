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

export function formatCurrency(amount: number, currency: string = "USD") {
  const country = COUNTRIES.find(c => c.currency === currency);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'narrowSymbol'
  }).format(amount);
}
