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

export const DEFAULT_HABIT_CATEGORIES = [
  "Health", "Fitness", "Career", "Finance", "Mindfulness", "Productivity", "Social", "Learning"
];

export const DEFAULT_MASTER_TARGETS = [
  "Get Fit", "Build Discipline", "Learn More", "Save Money", "Inner Peace", "Career Growth"
];

// ========================
// GAMIFICATION & HABITS
// ========================

export const HABIT_XP = {
  DAILY_COMPLETION: 25,        // XP for completing a daily habit
  WEEKLY_QUOTA_MET: 50,        // Bonus XP when weekly quota is fully met
  BONUS_BEYOND_QUOTA: 15,      // XP for extra completions beyond quota
  AVOIDANCE_DAILY_SAFE: 20,    // XP for avoiding temptation for a full day
  NUMERIC_TARGET_MET: 30,      // XP for hitting numeric target
  STREAK_7_BONUS: 100,         // Bonus at 7-day streak
  STREAK_30_BONUS: 500,        // Bonus at 30-day streak
  STREAK_SHIELD_COST: 0,       // Shields are free (auto-refill)
};

export const LEVEL_THRESHOLDS: { level: number; xp: number; title: string }[] = [
  { level: 1, xp: 0, title: "Novice Initiate" },
  { level: 5, xp: 500, title: "Habit Seeker" },
  { level: 10, xp: 2000, title: "Discipline Builder" },
  { level: 15, xp: 5000, title: "Discipline Warrior" },
  { level: 20, xp: 10000, title: "Consistency Champion" },
  { level: 25, xp: 18000, title: "Iron Will" },
  { level: 30, xp: 30000, title: "Habit Master" },
  { level: 40, xp: 55000, title: "Legendary Focus" },
  { level: 50, xp: 100000, title: "Titan of Focus" },
];

export const HABIT_FREQUENCIES = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly Quota" },
] as const;

export const HABIT_TYPES = [
  { key: "positive", label: "✓ Build", icon: "checkmark.circle.fill" },
  { key: "avoidance", label: "🛡️ Avoid", icon: "shield.fill" },
  { key: "numeric", label: "📊 Numeric", icon: "chart.bar.fill" },
] as const;
