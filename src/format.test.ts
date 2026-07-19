import { describe, expect, it } from "vitest";
import { formatCents, toCents } from "./format";

describe("format helpers", () => {
  it("converts decimal strings to cents", () => {
    expect(toCents("123.45")).toBe(12345);
  });

  it("formats cents as currency", () => {
    expect(formatCents(12345)).toBe("123.45");
  });
});
