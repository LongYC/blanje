import type { AppData, UserData } from "./data";

const STORAGE_KEY_USER_DATA = "blanje:user_data";
const STORAGE_KEY_APP_DATA = "blanje:app_data";

export function writeUserData(userData: UserData): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_DATA, JSON.stringify(userData));
  } catch (err) {
    console.error("Failed to save user data to localStorage", err);
  }
}

export function readUserData(): UserData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_DATA);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as UserData)
      : null;
  } catch (err) {
    console.error("Failed to read user data from localStorage", err);
    return null;
  }
}

function readAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APP_DATA);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as AppData)
      : {};
  } catch (err) {
    console.error("Failed to read app data from localStorage", err);
    return {};
  }
}

function writeAppData(appData: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY_APP_DATA, JSON.stringify(appData));
  } catch (err) {
    console.error("Failed to save app data to localStorage", err);
  }
}

export function saveLastLoadedFilename(name: string): void {
  writeAppData({ ...readAppData(), lastLoadedFilename: name });
}

export function readLastLoadedFilename(): string | null {
  return readAppData().lastLoadedFilename ?? null;
}

export function readHiddenAccountIds(): string[] {
  const value = readAppData().hiddenAccounts;
  return Array.isArray(value) ? value : [];
}

export function saveHiddenAccounts(accountIds: string[]): void {
  writeAppData({ ...readAppData(), hiddenAccounts: accountIds });
}

export function readLastEdited(): string {
  return readAppData().lastEdited ?? "";
}

export function saveLastEdited(timestamp: string): void {
  writeAppData({ ...readAppData(), lastEdited: timestamp });
}

export function clearFilename(): void {
  const { lastLoadedFilename: _omit, ...rest } = readAppData();
  writeAppData(rest);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY_USER_DATA);
  localStorage.removeItem(STORAGE_KEY_APP_DATA);
}
