import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Habit, HabitLog, HabitStats, GamificationProfile, AppSettings } from "./types";
import { HABIT_XP, LEVEL_THRESHOLDS } from "./constants";

export const HABIT_KEYS = {
  HABITS: "@mylife_habits",
  HABIT_LOGS: "@mylife_habit_logs",
  HABIT_STATS: "@mylife_habit_stats",
  MASTER_TARGETS: "@mylife_master_targets",
};

// Generic Helpers
async function getAll<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveAll<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Date Helpers
export function getLocalDateString(date: Date = new Date()): string {
  const d = new Date(date);
  // Adjust for timezone offset to get local YYYY-MM-DD
  const offset = d.getTimezoneOffset();
  d.setMinutes(d.getMinutes() - offset);
  return d.toISOString().split("T")[0];
}

export function getWeekBounds(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: getLocalDateString(monday), end: getLocalDateString(sunday) };
}

// =======================
// HABITS CRUD
// =======================
export const habits = {
  getAllIncludingArchived: () => getAll<Habit>(HABIT_KEYS.HABITS),
  getAll: async () => {
    const all = await getAll<Habit>(HABIT_KEYS.HABITS);
    return all.filter((h) => !h.archived);
  },
  getById: async (id: string) => {
    const all = await getAll<Habit>(HABIT_KEYS.HABITS);
    return all.find((h) => h.id === id) || null;
  },
  add: async (data: Omit<Habit, "id" | "createdAt" | "updatedAt" | "archived">) => {
    const habit: Habit = {
      ...data,
      id: generateId(),
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = await getAll<Habit>(HABIT_KEYS.HABITS);
    all.push(habit);
    await saveAll(HABIT_KEYS.HABITS, all);
    
    // Initialize stats
    const statsAll = await getAll<HabitStats>(HABIT_KEYS.HABIT_STATS);
    statsAll.push({
      habitId: habit.id,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      totalXP: 0,
      streakShieldsRemaining: 1, // Start with 1 shield
      lastShieldRefillDate: getWeekBounds(getLocalDateString()).start,
      consistencyScore: 0,
      lastCalculated: new Date().toISOString(),
    });
    await saveAll(HABIT_KEYS.HABIT_STATS, statsAll);
    
    return habit;
  },
  update: async (id: string, updates: Partial<Habit>) => {
    const all = await getAll<Habit>(HABIT_KEYS.HABITS);
    const index = all.findIndex((h) => h.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
      await saveAll(HABIT_KEYS.HABITS, all);
    }
  },
  archive: async (id: string) => {
    await habits.update(id, { archived: true });
  },
  delete: async (id: string) => {
    const all = await getAll<Habit>(HABIT_KEYS.HABITS);
    await saveAll(HABIT_KEYS.HABITS, all.filter((h) => h.id !== id));
    // We intentionally keep logs and stats for historical XP purposes, or we could delete them.
    // Spec says: "Hard delete (logs retained)".
  },
};

// =======================
// MASTER TARGETS CRUD
// =======================
import type { MasterTarget } from "./types";

export const targets = {
  getAll: async () => {
    const all = await getAll<MasterTarget>(HABIT_KEYS.MASTER_TARGETS);
    return all;
  },
  getById: async (id: string) => {
    const all = await getAll<MasterTarget>(HABIT_KEYS.MASTER_TARGETS);
    return all.find((t) => t.id === id) || null;
  },
  add: async (data: Omit<MasterTarget, "id" | "createdAt" | "updatedAt">) => {
    const target: MasterTarget = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = await getAll<MasterTarget>(HABIT_KEYS.MASTER_TARGETS);
    all.push(target);
    await saveAll(HABIT_KEYS.MASTER_TARGETS, all);
    return target;
  },
  update: async (id: string, updates: Partial<MasterTarget>) => {
    const all = await getAll<MasterTarget>(HABIT_KEYS.MASTER_TARGETS);
    const index = all.findIndex((t) => t.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
      await saveAll(HABIT_KEYS.MASTER_TARGETS, all);
    }
  },
  delete: async (id: string, cascadeHabits: boolean = false) => {
    const all = await getAll<MasterTarget>(HABIT_KEYS.MASTER_TARGETS);
    await saveAll(HABIT_KEYS.MASTER_TARGETS, all.filter((t) => t.id !== id));
    
    const allHabits = await getAll<Habit>(HABIT_KEYS.HABITS);
    let changed = false;
    for (const h of allHabits) {
      if (h.targetId === id) {
        if (cascadeHabits) {
          h.archived = true;
        } else {
          h.targetId = undefined;
        }
        h.updatedAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) {
      await saveAll(HABIT_KEYS.HABITS, allHabits);
    }
  },
};

// =======================
// HABIT LOGS
// =======================
export const habitLogs = {
  getForDate: async (habitId: string, date: string): Promise<HabitLog | null> => {
    const all = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    return all.find((l) => l.habitId === habitId && l.date === date) || null;
  },
  getRange: async (habitId: string, startDate: string, endDate: string): Promise<HabitLog[]> => {
    const all = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    return all.filter((l) => l.habitId === habitId && l.date >= startDate && l.date <= endDate);
  },
  getAllForDate: async (date: string): Promise<HabitLog[]> => {
    const all = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    return all.filter((l) => l.date === date);
  },
  isEditable: (date: string): boolean => {
    const today = getLocalDateString();
    const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
    return date === today || date === yesterday;
  },
  toggleCompletion: async (habitId: string, date: string, note?: string): Promise<HabitLog> => {
    const all = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    let log = all.find((l) => l.habitId === habitId && l.date === date);
    
    if (log) {
      log.completed = !log.completed;
      if (note !== undefined) log.note = note;
      log.loggedAt = new Date().toISOString();
    } else {
      log = {
        id: generateId(),
        habitId,
        date,
        completed: true,
        note,
        loggedAt: new Date().toISOString(),
      };
      all.push(log);
    }
    
    await saveAll(HABIT_KEYS.HABIT_LOGS, all);
    return log;
  },
  logSlip: async (habitId: string, date: string, note?: string): Promise<HabitLog> => {
    const all = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    let log = all.find((l) => l.habitId === habitId && l.date === date);
    
    if (log) {
      log.completed = false; // For avoidance, false = slip
      if (note !== undefined) log.note = note;
      log.loggedAt = new Date().toISOString();
    } else {
      log = {
        id: generateId(),
        habitId,
        date,
        completed: false,
        note,
        loggedAt: new Date().toISOString(),
      };
      all.push(log);
    }
    
    await saveAll(HABIT_KEYS.HABIT_LOGS, all);
    return log;
  },
  addNumericValue: async (habitId: string, date: string, amount: number): Promise<HabitLog> => {
    const all = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    let log = all.find((l) => l.habitId === habitId && l.date === date);
    
    if (log) {
      log.numericValue = (log.numericValue || 0) + amount;
      log.loggedAt = new Date().toISOString();
    } else {
      log = {
        id: generateId(),
        habitId,
        date,
        completed: false, // will be evaluated later if >= target
        numericValue: amount,
        loggedAt: new Date().toISOString(),
      };
      all.push(log);
    }
    
    await saveAll(HABIT_KEYS.HABIT_LOGS, all);
    return log;
  },
  setNumericValue: async (habitId: string, date: string, value: number, note?: string): Promise<HabitLog> => {
    const all = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    let log = all.find((l) => l.habitId === habitId && l.date === date);
    
    if (log) {
      log.numericValue = value;
      if (note !== undefined) log.note = note;
      log.loggedAt = new Date().toISOString();
    } else {
      log = {
        id: generateId(),
        habitId,
        date,
        completed: false,
        numericValue: value,
        note,
        loggedAt: new Date().toISOString(),
      };
      all.push(log);
    }
    
    await saveAll(HABIT_KEYS.HABIT_LOGS, all);
    return log;
  },
  removeLog: async (habitId: string, date: string): Promise<void> => {
    const all = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    const filtered = all.filter((l) => !(l.habitId === habitId && l.date === date));
    await saveAll(HABIT_KEYS.HABIT_LOGS, filtered);
  },
  updateLog: async (habitId: string, date: string, updates: Partial<HabitLog>): Promise<HabitLog | null> => {
    const all = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    const index = all.findIndex((l) => l.habitId === habitId && l.date === date);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates, loggedAt: new Date().toISOString() };
      await saveAll(HABIT_KEYS.HABIT_LOGS, all);
      return all[index];
    }
    return null;
  },
  getWeeklyCount: async (habitId: string, date: string): Promise<number> => {
    const { start, end } = getWeekBounds(date);
    const logs = await habitLogs.getRange(habitId, start, end);
    return logs.filter((l) => l.completed).length;
  },
};

// =======================
// HABIT STATS & GAMIFICATION
// =======================
export const habitStats = {
  getForHabit: async (habitId: string): Promise<HabitStats> => {
    const all = await getAll<HabitStats>(HABIT_KEYS.HABIT_STATS);
    const stats = all.find((s) => s.habitId === habitId);
    if (stats) return stats;
    
    // Default fallback
    return {
      habitId,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      totalXP: 0,
      streakShieldsRemaining: 1,
      consistencyScore: 0,
      lastCalculated: new Date().toISOString(),
    };
  },
  getProfile: async (): Promise<GamificationProfile> => {
    try {
      const data = await AsyncStorage.getItem("@mylife_settings");
      const settings: AppSettings = data ? JSON.parse(data) : { pinSet: false, lastOpenDate: "" };
      return settings.gamification || { totalXP: 0, level: 1, levelTitle: "Novice Initiate" };
    } catch {
      return { totalXP: 0, level: 1, levelTitle: "Novice Initiate" };
    }
  },
  awardXP: async (amount: number) => {
    try {
      const data = await AsyncStorage.getItem("@mylife_settings");
      const settings: AppSettings = data ? JSON.parse(data) : { pinSet: false, lastOpenDate: "" };
      
      const profile = settings.gamification || { totalXP: 0, level: 1, levelTitle: "Novice Initiate" };
      profile.totalXP += amount;
      
      let newLevel = 1;
      let newTitle = "Novice Initiate";
      for (const threshold of LEVEL_THRESHOLDS) {
        if (profile.totalXP >= threshold.xp) {
          newLevel = threshold.level;
          newTitle = threshold.title;
        } else {
          break;
        }
      }
      
      const leveledUp = newLevel > profile.level;
      profile.level = newLevel;
      profile.levelTitle = newTitle;
      
      settings.gamification = profile;
      await AsyncStorage.setItem("@mylife_settings", JSON.stringify(settings));
      
      return { newTotal: profile.totalXP, leveledUp, newLevel, newTitle };
    } catch {
      return { newTotal: 0, leveledUp: false };
    }
  },
  refillShields: async (): Promise<void> => {
    const currentMonday = getWeekBounds(getLocalDateString()).start;
    const allStats = await getAll<HabitStats>(HABIT_KEYS.HABIT_STATS);
    let changed = false;
    
    for (const stat of allStats) {
      if (stat.lastShieldRefillDate !== currentMonday) {
        stat.streakShieldsRemaining = 1;
        stat.lastShieldRefillDate = currentMonday;
        changed = true;
      }
    }
    
    if (changed) {
      await saveAll(HABIT_KEYS.HABIT_STATS, allStats);
    }
  },
  getConsistencyScore: async (habitId: string): Promise<number> => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
    const logs = await habitLogs.getRange(habitId, getLocalDateString(thirtyDaysAgo), getLocalDateString(today));
    
    const h = await habits.getById(habitId);
    if (!h) return 0;
    
    const completedDays = logs.filter(l => {
      if (h.habitType === "numeric" && h.numericTarget) {
        return (l.numericValue || 0) >= h.numericTarget;
      }
      return l.completed;
    }).length;
    
    return Math.round((completedDays / 30) * 100);
  },
  recalculate: async (habitId: string): Promise<HabitStats> => {
    const allStats = await getAll<HabitStats>(HABIT_KEYS.HABIT_STATS);
    let stat = allStats.find((s) => s.habitId === habitId);
    if (!stat) {
      stat = {
        habitId,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        totalXP: 0,
        streakShieldsRemaining: 1,
        consistencyScore: 0,
        lastCalculated: new Date().toISOString(),
      };
      allStats.push(stat);
    }
    
    const h = await habits.getById(habitId);
    if (!h) return stat;

    // Recalculate streak logic based on frequency
    const logs = await getAll<HabitLog>(HABIT_KEYS.HABIT_LOGS);
    const habitLogsList = logs.filter(l => l.habitId === habitId).sort((a, b) => a.date.localeCompare(b.date));
    
    if (habitLogsList.length === 0) {
      stat.currentStreak = 0;
      stat.totalCompletions = 0;
      stat.consistencyScore = 0;
      stat.lastCalculated = new Date().toISOString();
      await saveAll(HABIT_KEYS.HABIT_STATS, allStats);
      return stat;
    }

    // Simplified streak calculation: find contiguous dates going backwards from the latest log
    // A robust streak engine evaluates daily boundaries and applies shields for missed days.
    let streak = 0;
    let completions = 0;
    
    if (h.frequency.type === "daily") {
      // Basic daily streak counter (not fully evaluating missed days for shields yet - simplified for this checkpoint)
      let currentDate = new Date(getLocalDateString());
      
      // Determine if completed today
      const todayLog = habitLogsList.find(l => l.date === getLocalDateString());
      let isActiveToday = false;
      if (h.habitType === "numeric" && h.numericTarget) {
         isActiveToday = (todayLog?.numericValue || 0) >= h.numericTarget;
      } else {
         isActiveToday = todayLog?.completed || false;
      }
      
      // Count completions
      completions = habitLogsList.filter(l => {
         if (h.habitType === "numeric" && h.numericTarget) return (l.numericValue || 0) >= h.numericTarget;
         return l.completed;
      }).length;
      
      // Simple streak counting logic backwards
      let currentCheckDate = getLocalDateString(currentDate);
      let streakCount = 0;
      
      for (let i = 0; i < 365; i++) {
        const logForDate = habitLogsList.find(l => l.date === currentCheckDate);
        let completed = false;
        
        if (logForDate) {
           if (h.habitType === "numeric" && h.numericTarget) completed = (logForDate.numericValue || 0) >= h.numericTarget;
           else completed = logForDate.completed;
        }
        
        if (completed) {
          streakCount++;
        } else if (i === 0) {
          // If checking today and it's not completed, streak is still alive if yesterday was completed
          // We don't break yet, we allow 1 day grace (today)
        } else {
           // We missed a day. Check if shield can be used?
           // For simplicity, just break the streak
           break;
        }
        
        const prev = new Date(currentCheckDate + "T12:00:00");
        prev.setDate(prev.getDate() - 1);
        currentCheckDate = getLocalDateString(prev);
      }
      streak = streakCount;
    } else if (h.frequency.type === "weekly") {
      // Weekly streak logic
      completions = habitLogsList.filter(l => l.completed).length;
      streak = 0; // Simplified for now
    }

    stat.currentStreak = streak;
    if (streak > stat.longestStreak) stat.longestStreak = streak;
    stat.totalCompletions = completions;
    stat.lastCompletionDate = habitLogsList[habitLogsList.length - 1].date;
    stat.consistencyScore = await habitStats.getConsistencyScore(habitId);
    stat.lastCalculated = new Date().toISOString();
    
    await saveAll(HABIT_KEYS.HABIT_STATS, allStats);
    return stat;
  },
  recalculateAll: async (): Promise<void> => {
    const allHabits = await habits.getAll();
    for (const h of allHabits) {
      await habitStats.recalculate(h.id);
    }
  }
};
