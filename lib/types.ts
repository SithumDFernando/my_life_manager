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
  venueId?: string;
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
}
