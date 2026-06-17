import type { SpendingsData } from "./types";

const STORAGE_KEY = "blanje:spendings";

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

/** Remove stored spendings. */
export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
