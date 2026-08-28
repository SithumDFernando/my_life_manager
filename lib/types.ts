// Account & Credentials
export type AccountCategory = "email" | "google" | "social" | "website" | "financial" | "other";

export interface Account {
  id: string;
  category: AccountCategory;
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

// Subscriptions
export interface Subscription {
  id: string;
  name: string;
  category: string;
  cost: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "quarterly" | "one-time";
  renewalDate: string;
  url?: string;
  status: "active" | "cancelled" | "trial";
  notes?: string;
  createdAt: string;
}

// Bio Data
export interface BioData {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  education: string;
  university?: string;
  degree?: string;
  linkedin?: string;
  github?: string;
  hackerrank?: string;
  portfolio?: string;
  twitter?: string;
  otherLinks?: string;
  notes?: string;
}

// Notes
export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Competition
export type CompetitionStatus = "upcoming" | "ongoing" | "completed";

export interface Competition {
  id: string;
  name: string;
  category: string;
  status: CompetitionStatus;
  startDate?: string;
  endDate?: string;
  venueId?: string;
  result?: string;
  organizer?: string;
  teamOrIndividual?: "team" | "individual";
  prizeAmount?: number;
  prizeCurrency?: string;
  notes?: string;
  linkedProjectIds?: string[];
  linkedAchievementIds?: string[];
  createdAt: string;
}

// Event
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
  venueId?: string;
  mapUrl?: string;
  type: "meeting" | "deadline" | "conference" | "hackathon" | "personal" | "other";
  notes?: string;
  createdAt: string;
}

// Venue
export interface Venue {
  id: string;
  name: string;
  address?: string;
  city?: string;
  mapUrl?: string;
  notes?: string;
  createdAt: string;
}

// Task (Daily To-Do)
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  carriedOver?: boolean;
}

// Yesterday's Report
export interface DailyReport {
  date: string;
  totalTasks: number;
  completedTasks: number;
  unfinishedTasks: Task[];
}

// Reading Item
export type ReadingType = "book" | "research_paper" | "article";
export type ReadingStatus = "not_started" | "reading" | "completed";

export interface ReadingItem {
  id: string;
  type: ReadingType;
  title: string;
  author: string;
  status: ReadingStatus;
  startDate?: string;
  endDate?: string;
  rating?: number;
  notes?: string;
  pages?: number;
  pagesRead?: number;
  url?: string;
  createdAt: string;
}

// Achievement
export interface Achievement {
  id: string;
  title: string;
  type: "hackathon" | "competition" | "award" | "certification" | "milestone" | "other";
  description?: string;
  date?: string;
  place?: string;
  prize?: string;
  competitionId?: string;
  projectId?: string;
  notes?: string;
  createdAt: string;
}

// Project Service Account
export interface ProjectServiceAccount {
  service: string;
  accountEmail: string;
  accountId?: string;
  notes?: string;
}

// Project
export type ProjectStatus = "ongoing" | "completed" | "on_hold" | "planned";

export interface Project {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: ProjectStatus;
  githubRepo?: string;
  startDate?: string;
  endDate?: string;
  techStack?: string[];
  serviceAccounts: ProjectServiceAccount[];
  linkedCompetitionIds?: string[];
  linkedAchievementIds?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// App Settings
export interface AppSettings {
  pinSet: boolean;
  lastOpenDate: string;
  lastReportDate?: string;
  gamification?: GamificationProfile;
}

// ==========================================
// Phase 2.5: Habit & Gamification Models
// ==========================================

export type TargetDateType = "none" | "deadline" | "range";

export interface MasterTarget {
  id: string;
  title: string;
  description?: string;
  category?: string;
  dateType: TargetDateType;
  startDate?: string;
  endDate?: string;
  color?: string;
  status: "active" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
}

export type HabitType = "positive" | "avoidance" | "numeric";
export type HabitFrequencyType = "daily" | "weekly";

export interface HabitFrequency {
  type: HabitFrequencyType;
  weeklyTarget?: number; // E.g., 3 times a week
}

export interface Habit {
  id: string;
  targetId?: string;    // Links to MasterTarget.id
  targetName?: string;  // Fallback for ad-hoc grouping
  name: string;
  category: string;
  emoji?: string;
  /** The interaction model: positive (tap to check), avoidance (shield), numeric (stepper) */
  habitType: HabitType;
  /** Frequency configuration */
  frequency: HabitFrequency;
  /** For numeric habits: the daily target value (e.g., 3000 for 3000ml water) */
  numericTarget?: number;
  /** For numeric habits: the unit label (e.g., "ml", "steps", "minutes") */
  numericUnit?: string;
  /** Quick-add chip values for numeric habits (e.g., [250, 500, 1000] for water) */
  numericQuickAdds?: number[];
  /** Custom color hex for the habit card accent (optional) */
  color?: string;
  /** Soft-delete: hidden from active board but logs/XP retained */
  archived: boolean;
  /** ISO date string of creation */
  createdAt: string;
  /** ISO date string of last update */
  updatedAt: string;
}

// Daily log entry for a habit (keyed by habitId + date for uniqueness)
export interface HabitLog {
  id: string;
  habitId: string;
  /** ISO date string YYYY-MM-DD (device local time) */
  date: string;
  /** For positive: true/false. For avoidance: true = safe, false = slip. */
  completed: boolean;
  /** For numeric habits: the accumulated value for the day (e.g., 2500 ml) */
  numericValue?: number;
  /** Optional note for the day (e.g., "Push day" or "Slip: ate cake at party") */
  note?: string;
  /** ISO timestamp of when the log was created/last updated */
  loggedAt: string;
}

// Aggregated stats for a single habit (computed and cached)
export interface HabitStats {
  habitId: string;
  /** Current consecutive streak (days for daily, weeks for weekly) */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Total completions all-time */
  totalCompletions: number;
  /** Total XP earned from this habit */
  totalXP: number;
  /** Number of streak shields remaining (max 1, refills Monday) */
  streakShieldsRemaining: number;
  /** ISO date string of last shield refill (Monday check) */
  lastShieldRefillDate?: string;
  /** Date of last completion (for streak gap detection) */
  lastCompletionDate?: string;
  /** 30-day rolling consistency percentage (0-100) */
  consistencyScore: number;
  /** ISO date string of last stats recalculation */
  lastCalculated: string;
}

// User-level gamification profile (singleton, stored in AppSettings)
export interface GamificationProfile {
  totalXP: number;
  level: number;
  levelTitle: string;
}
