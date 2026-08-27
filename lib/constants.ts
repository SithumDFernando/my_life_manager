// Shared constants for the app

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "LKR", symbol: "Rs", label: "LKR (Rs)" },
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "AUD", symbol: "A$", label: "AUD (A$)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "CAD", symbol: "C$", label: "CAD (C$)" },
  { code: "SGD", symbol: "S$", label: "SGD (S$)" },
] as const;

export const COMPETITION_RESULTS = [
  "Champions",
  "1st Runners Up",
  "2nd Runners Up",
  "Finalist",
  "Semi-finalist",
  "Participation",
  "Other",
] as const;

export const SUBSCRIPTION_CATEGORIES = [
  "Entertainment",
  "Productivity",
  "Cloud/Hosting",
  "Music",
  "Education",
  "News",
  "Gaming",
  "Health & Fitness",
  "Other",
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];
