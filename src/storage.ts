import type { SpendingsData } from "./types";

const STORAGE_KEY = "blanje:spendings";
const META_KEY = "blanje:meta";

/** App metadata persisted alongside the spendings data. */
interface Meta {
  lastLoadedFilename?: string;
  /** Account ids whose item rows are hidden from view (purely visual). */
  hiddenAccounts?: string[];
}

/** Read the meta object from localStorage, or an empty object if none / unreadable. */
function readMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Meta)
      : {};
  } catch (err) {
    console.error("Failed to read meta from localStorage", err);
    return {};
  }
}

/** Write the meta object back to localStorage. */
function writeMeta(meta: Meta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.error("Failed to persist meta to localStorage", err);
  }
}

/** Persist parsed spendings data to localStorage. */
export function saveData(data: SpendingsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to persist spendings to localStorage", err);
  }
}

/** Load previously stored spendings, or `null` if none / unreadable. */
export function loadData(): SpendingsData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as SpendingsData)
      : null;
  } catch (err) {
    console.error("Failed to read spendings from localStorage", err);
    return null;
  }
}

/** Persist the name of the file the current data was loaded from. */
export function saveFilename(name: string): void {
  writeMeta({ ...readMeta(), lastLoadedFilename: name });
}

/** Load the stored filename, or `null` if none / unreadable. */
export function loadFilename(): string | null {
  return readMeta().lastLoadedFilename ?? null;
}

/** Load the list of hidden account ids, or an empty array if none. */
export function loadHiddenAccounts(): string[] {
  const value = readMeta().hiddenAccounts;
  return Array.isArray(value) ? value : [];
}

/** Persist the list of hidden account ids. */
export function saveHiddenAccounts(accountIds: string[]): void {
  writeMeta({ ...readMeta(), hiddenAccounts: accountIds });
}

/** Remove just the stored filename, leaving the spendings data intact. */
export function clearFilename(): void {
  const { lastLoadedFilename: _omit, ...rest } = readMeta();
  writeMeta(rest);
}

/** Remove stored spendings and the associated metadata. */
export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(META_KEY);
}
