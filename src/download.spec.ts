// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadJson } from "./download";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("downloadJson", () => {
  it("downloads pretty-printed JSON and releases the object URL", async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:download");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadJson(
      { accounts: [], categories: [], spendings: [] },
      "spendings.json",
    );

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(await blob.text()).toBe(JSON.stringify({ accounts: [], categories: [], spendings: [] }, null, 2));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:download");
    expect(document.querySelector('a[download="spendings.json"]')).toBeNull();
  });
});