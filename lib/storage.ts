import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Account,
  Subscription,
  BioData,
  Note,
  Competition,
  Event,
  Venue,
  Task,
  DailyReport,
  ReadingItem,
  Achievement,
  Project,
  AppSettings,
} from "./types";

// Storage keys
const KEYS = {
  ACCOUNTS: "@mylife_accounts",
  SUBSCRIPTIONS: "@mylife_subscriptions",
  BIO_DATA: "@mylife_bio_data",
  NOTES: "@mylife_notes",
  COMPETITIONS: "@mylife_competitions",
  EVENTS: "@mylife_events",
  VENUES: "@mylife_venues",
  TASKS: "@mylife_tasks",
  DAILY_REPORTS: "@mylife_daily_reports",
  READING_ITEMS: "@mylife_reading_items",
  ACHIEVEMENTS: "@mylife_achievements",
  PROJECTS: "@mylife_projects",
  SETTINGS: "@mylife_settings",
  PIN: "@mylife_pin",
};

// Generic CRUD helpers
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

async function getById<T extends { id: string }>(key: string, id: string): Promise<T | null> {
  const items = await getAll<T>(key);
  return items.find((item) => item.id === id) || null;
}

async function addOne<T extends { id: string }>(key: string, item: T): Promise<void> {
  const items = await getAll<T>(key);
  items.push(item);
  await saveAll(key, items);
}

async function updateOne<T extends { id: string }>(key: string, id: string, updates: Partial<T>): Promise<void> {
  const items = await getAll<T>(key);
  const index = items.findIndex((item) => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    await saveAll(key, items);
  }
}

async function deleteOne<T extends { id: string }>(key: string, id: string): Promise<void> {
  const items = await getAll<T>(key);
  await saveAll(key, items.filter((item) => item.id !== id));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Accounts
export const accounts = {
  getAll: () => getAll<Account>(KEYS.ACCOUNTS),
  getById: (id: string) => getById<Account>(KEYS.ACCOUNTS, id),
  add: (data: Omit<Account, "id" | "createdAt">) => {
    const account: Account = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    return addOne(KEYS.ACCOUNTS, account);
  },
  update: (id: string, updates: Partial<Account>) => updateOne<Account>(KEYS.ACCOUNTS, id, updates),
  delete: (id: string) => deleteOne<Account>(KEYS.ACCOUNTS, id),
};

// Subscriptions
export const subscriptions = {
  getAll: () => getAll<Subscription>(KEYS.SUBSCRIPTIONS),
  getById: (id: string) => getById<Subscription>(KEYS.SUBSCRIPTIONS, id),
  add: (data: Omit<Subscription, "id" | "createdAt">) => {
    const sub: Subscription = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    return addOne(KEYS.SUBSCRIPTIONS, sub);
  },
  update: (id: string, updates: Partial<Subscription>) => updateOne<Subscription>(KEYS.SUBSCRIPTIONS, id, updates),
  delete: (id: string) => deleteOne<Subscription>(KEYS.SUBSCRIPTIONS, id),
};

// Bio Data
export const bioData = {
  get: (): Promise<BioData | null> => getById<BioData>(KEYS.BIO_DATA, "default"),
  save: (data: Omit<BioData, "id">) => {
    const bio: BioData = { ...data, id: "default" };
    return saveAll(KEYS.BIO_DATA, [bio]);
  },
};

// Notes
export const notes = {
  getAll: () => getAll<Note>(KEYS.NOTES),
  getById: (id: string) => getById<Note>(KEYS.NOTES, id),
  add: (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const note: Note = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return addOne(KEYS.NOTES, note);
  },
  update: (id: string, updates: Partial<Note>) =>
    updateOne<Note>(KEYS.NOTES, id, { ...updates, updatedAt: new Date().toISOString() }),
  delete: (id: string) => deleteOne<Note>(KEYS.NOTES, id),
};

// Competitions
export const competitions = {
  getAll: () => getAll<Competition>(KEYS.COMPETITIONS),
  getById: (id: string) => getById<Competition>(KEYS.COMPETITIONS, id),
  add: (data: Omit<Competition, "id" | "createdAt">) => {
    const comp: Competition = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    return addOne(KEYS.COMPETITIONS, comp);
  },
  update: (id: string, updates: Partial<Competition>) => updateOne<Competition>(KEYS.COMPETITIONS, id, updates),
  delete: (id: string) => deleteOne<Competition>(KEYS.COMPETITIONS, id),
};

// Events
export const events = {
  getAll: () => getAll<Event>(KEYS.EVENTS),
  getById: (id: string) => getById<Event>(KEYS.EVENTS, id),
  add: (data: Omit<Event, "id" | "createdAt">) => {
    const ev: Event = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    return addOne(KEYS.EVENTS, ev);
  },
  update: (id: string, updates: Partial<Event>) => updateOne<Event>(KEYS.EVENTS, id, updates),
  delete: (id: string) => deleteOne<Event>(KEYS.EVENTS, id),
};

// Venues
export const venues = {
  getAll: () => getAll<Venue>(KEYS.VENUES),
  getById: (id: string) => getById<Venue>(KEYS.VENUES, id),
  add: (data: Omit<Venue, "id" | "createdAt">) => {
    const venue: Venue = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    return addOne(KEYS.VENUES, venue);
  },
  update: (id: string, updates: Partial<Venue>) => updateOne<Venue>(KEYS.VENUES, id, updates),
  delete: (id: string) => deleteOne<Venue>(KEYS.VENUES, id),
};

// Tasks (Daily To-Do)
export const tasks = {
  getAll: () => getAll<Task>(KEYS.TASKS),
  getById: (id: string) => getById<Task>(KEYS.TASKS, id),
  add: (title: string) => {
    const task: Task = {
      id: generateId(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    return addOne(KEYS.TASKS, task);
  },
  toggle: async (id: string) => {
    const task = await getById<Task>(KEYS.TASKS, id);
    if (task) {
      const completed = !task.completed;
      return updateOne<Task>(KEYS.TASKS, id, { completed, completedAt: completed ? new Date().toISOString() : undefined });
    }
  },
  update: (id: string, updates: Partial<Task>) => updateOne<Task>(KEYS.TASKS, id, updates),
  delete: (id: string) => deleteOne<Task>(KEYS.TASKS, id),
  clearCompleted: async () => {
    const allTasks = await getAll<Task>(KEYS.TASKS);
    const active = allTasks.filter((t) => !t.completed);
    await saveAll(KEYS.TASKS, active);
  },
  carryOver: async (taskIds: string[]) => {
    const allTasks = await getAll<Task>(KEYS.TASKS);
    const updated = allTasks.map((t) =>
      taskIds.includes(t.id) ? { ...t, completed: false, completedAt: undefined, carriedOver: true } : t
    );
    await saveAll(KEYS.TASKS, updated);
  },
};

// Daily Reports
export const dailyReports = {
  getAll: () => getAll<DailyReport>(KEYS.DAILY_REPORTS),
  saveReport: async (report: DailyReport) => {
    const reports = await getAll<DailyReport>(KEYS.DAILY_REPORTS);
    const existing = reports.findIndex((r) => r.date === report.date);
    if (existing !== -1) {
      reports[existing] = report;
    } else {
      reports.push(report);
    }
    await saveAll(KEYS.DAILY_REPORTS, reports);
  },
  getLatestReport: async () => {
    const reports = await getAll<DailyReport>(KEYS.DAILY_REPORTS);
    if (reports.length === 0) return null;
    return reports.sort((a, b) => b.date.localeCompare(a.date))[0];
  },
};

// Reading Items
export const readingItems = {
  getAll: () => getAll<ReadingItem>(KEYS.READING_ITEMS),
  getById: (id: string) => getById<ReadingItem>(KEYS.READING_ITEMS, id),
  add: (data: Omit<ReadingItem, "id" | "createdAt">) => {
    const item: ReadingItem = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    return addOne(KEYS.READING_ITEMS, item);
  },
  update: (id: string, updates: Partial<ReadingItem>) => updateOne<ReadingItem>(KEYS.READING_ITEMS, id, updates),
  delete: (id: string) => deleteOne<ReadingItem>(KEYS.READING_ITEMS, id),
};

// Achievements
export const achievements = {
  getAll: () => getAll<Achievement>(KEYS.ACHIEVEMENTS),
  getById: (id: string) => getById<Achievement>(KEYS.ACHIEVEMENTS, id),
  add: (data: Omit<Achievement, "id" | "createdAt">) => {
    const achievement: Achievement = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    return addOne(KEYS.ACHIEVEMENTS, achievement);
  },
  update: (id: string, updates: Partial<Achievement>) => updateOne<Achievement>(KEYS.ACHIEVEMENTS, id, updates),
  delete: (id: string) => deleteOne<Achievement>(KEYS.ACHIEVEMENTS, id),
};

// Projects
export const projects = {
  getAll: () => getAll<Project>(KEYS.PROJECTS),
  getById: (id: string) => getById<Project>(KEYS.PROJECTS, id),
  add: (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const project: Project = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    return addOne(KEYS.PROJECTS, project);
  },
  update: (id: string, updates: Partial<Project>) =>
    updateOne<Project>(KEYS.PROJECTS, id, { ...updates, updatedAt: new Date().toISOString() }),
  delete: (id: string) => deleteOne<Project>(KEYS.PROJECTS, id),
};

// Settings
export const settings = {
  get: async (): Promise<AppSettings> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : { pinSet: false, lastOpenDate: "" };
    } catch {
      return { pinSet: false, lastOpenDate: "" };
    }
  },
  save: async (updates: Partial<AppSettings>) => {
    const current = await settings.get();
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...updates }));
  },
};

// PIN
export const pinStorage = {
  get: () => AsyncStorage.getItem(KEYS.PIN),
  set: (pin: string) => AsyncStorage.setItem(KEYS.PIN, pin),
  hasPin: async () => {
    const pin = await AsyncStorage.getItem(KEYS.PIN);
    return pin !== null;
  },
  verify: async (pin: string) => {
    const stored = await AsyncStorage.getItem(KEYS.PIN);
    return stored === pin;
  },
  remove: () => AsyncStorage.removeItem(KEYS.PIN),
};
