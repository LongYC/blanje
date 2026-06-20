import type { SpendingsData } from "./types";

const STORAGE_KEY = "blanje:spendings";
const FILENAME_KEY = "blanje:filename";

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
  try {
    localStorage.setItem(FILENAME_KEY, name);
  } catch (err) {
    console.error("Failed to persist filename to localStorage", err);
  }
}

/** Load the stored filename, or `null` if none / unreadable. */
export function loadFilename(): string | null {
  try {
    return localStorage.getItem(FILENAME_KEY);
  } catch (err) {
    console.error("Failed to read filename from localStorage", err);
    return null;
  }
}

/** Remove just the stored filename, leaving the spendings data intact. */
export function clearFilename(): void {
  localStorage.removeItem(FILENAME_KEY);
}

/** Remove stored spendings and the associated filename. */
export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FILENAME_KEY);
}
