// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAllData,
  readHiddenAccountIds,
  readLastEdited,
  readLastLoadedFilename,
  readUserData,
  saveHiddenAccounts,
  saveLastEdited,
  saveLastLoadedFilename,
  writeUserData,
} from "./storage";

const userDataKey = "blanje:user_data";
const appDataKey = "blanje:app_data";

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("user data storage", () => {
  it("writes and reads object data, returning null when absent or not an object", () => {
    expect(readUserData()).toBeNull();
    writeUserData({ accounts: [], categories: [], spendings: [] });
    expect(readUserData()).toEqual({ accounts: [], categories: [], spendings: [] });

    localStorage.setItem(userDataKey, "[]");
    expect(readUserData()).toBeNull();
    localStorage.setItem(userDataKey, "null");
    expect(readUserData()).toBeNull();
  });

  it("logs malformed data and storage write failures without throwing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(userDataKey, "{");
    expect(readUserData()).toBeNull();
    expect(error).toHaveBeenCalledWith("Failed to read user data from localStorage", expect.any(Error));

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage full");
    });
    expect(() => writeUserData({ accounts: [], categories: [], spendings: [] })).not.toThrow();
    expect(error).toHaveBeenCalledWith("Failed to save user data to localStorage", expect.any(Error));
  });
});

describe("app data storage", () => {
  it("reads defaults and preserves saved fields when updating preferences", () => {
    expect(readLastLoadedFilename()).toBeNull();
    expect(readHiddenAccountIds()).toEqual([]);
    expect(readLastEdited()).toBe("");

    saveLastLoadedFilename("month.json");
    saveHiddenAccounts(["cash"]);
    saveLastEdited("2026-09-30_1015_20");

    expect(readLastLoadedFilename()).toBe("month.json");
    expect(readHiddenAccountIds()).toEqual(["cash"]);
    expect(readLastEdited()).toBe("2026-09-30_1015_20");
  });

  it("falls back for malformed or incorrectly shaped app data", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(appDataKey, "{");
    expect(readHiddenAccountIds()).toEqual([]);
    expect(error).toHaveBeenCalledWith("Failed to read app data from localStorage", expect.any(Error));

    localStorage.setItem(appDataKey, "[]");
    expect(readLastLoadedFilename()).toBeNull();
    localStorage.setItem(appDataKey, JSON.stringify({ hiddenAccounts: "cash" }));
    expect(readHiddenAccountIds()).toEqual([]);
  });

  it("logs failed preference writes and clears both stored records", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage full");
    });
    expect(() => saveLastEdited("timestamp")).not.toThrow();
    expect(error).toHaveBeenCalledWith("Failed to save app data to localStorage", expect.any(Error));

    vi.restoreAllMocks();
    writeUserData({ accounts: [], categories: [], spendings: [] });
    saveLastLoadedFilename("month.json");
    clearAllData();
    expect(readUserData()).toBeNull();
    expect(readLastLoadedFilename()).toBeNull();
  });
});