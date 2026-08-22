import { describe, expect, it } from "vitest";
import { formatCents, toCents } from "./format";

describe("formatCents", () => {
  it("formats cents as currency", () => {
    expect(formatCents(12345)).toBe("123.45");
  });

  it("formats 0 cents", () => {
    expect(formatCents(0)).toBe("0.00");
  });

  it("formats negative cents", () => {
    expect(formatCents(-67890)).toBe("-678.90");
  });
});

describe("toCents", () => {
  it("converts decimal strings to number in cents", () => {
    expect(toCents("123.45")).toBe(12345);
  });

  it("converts single digit cent", () => {
    expect(toCents("0.06")).toBe(6);
  });

  it("converts integers to number in cents", () => {
    expect(toCents("12345")).toBe(1234500);
  });

  it("converts empty string to 0", () => {
    expect(toCents("")).toBe(0);
  });

  it("rejects more than two decimal places", () => {
    expect(() => toCents("123.456")).toThrow(
      'Amount "123.456" has more than two decimal places',
    );
  });
});
