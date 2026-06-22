import type {
  Account,
  Category,
  MonthlySpending,
  Spending,
  UserData,
} from "./types";

/** Thrown when uploaded JSON does not match the expected shape. */
export class ValidationError extends Error {}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNamed<T extends Category | Account>(
  value: unknown,
  path: string,
): T {
  if (!isObject(value)) {
    throw new ValidationError(`${path} must be an object`);
  }
  const { id, name } = value;
  if (typeof id !== "string" || id.length === 0) {
    throw new ValidationError(`${path}.id must be a non-empty string`);
  }
  if (typeof name !== "string") {
    throw new ValidationError(`${path}.name must be a string`);
  }
  return { id, name } as T;
}

function parseSpending(value: unknown, path: string): Spending {
  if (!isObject(value)) {
    throw new ValidationError(`${path} must be an object`);
  }
  const { categoryId, name, amount, accountId } = value;
  if (typeof categoryId !== "string") {
    throw new ValidationError(`${path}.categoryId must be a string`);
  }
  if (typeof name !== "string") {
    throw new ValidationError(`${path}.name must be a string`);
  }
  // amount may arrive as a string ("123.45") or a number; normalise to string.
  let amountStr: string;
  if (typeof amount === "string") {
    amountStr = amount;
  } else if (typeof amount === "number") {
    amountStr = String(amount);
  } else {
    throw new ValidationError(`${path}.amount must be a string or number`);
  }
  if (Number.isNaN(Number(amountStr))) {
    throw new ValidationError(`${path}.amount "${amountStr}" is not a valid number`);
  }
  if (typeof accountId !== "string") {
    throw new ValidationError(`${path}.accountId must be a string`);
  }
  const { ignore } = value;
  if (ignore !== undefined && typeof ignore !== "boolean") {
    throw new ValidationError(`${path}.ignore must be a boolean`);
  }
  const spending: Spending = { categoryId, name, amount: amountStr, accountId };
  // Only carry `ignore` when truthy so a round-trip never writes `ignore: false`.
  if (ignore === true) spending.ignore = true;
  return spending;
}

function parseMonthly(value: unknown, path: string): MonthlySpending {
  if (!isObject(value)) {
    throw new ValidationError(`${path} must be an object`);
  }
  const { month } = value;
  if (typeof month !== "number" || !Number.isInteger(month)) {
    throw new ValidationError(`${path}.month must be an integer (e.g. 202607)`);
  }
  const m = month % 100;
  if (m < 1 || m > 12) {
    throw new ValidationError(`${path}.month must encode a month 1-12, e.g. 202607`);
  }
  if (!Array.isArray(value.items)) {
    throw new ValidationError(`${path}.items must be an array`);
  }
  const items = value.items.map((s, i) =>
    parseSpending(s, `${path}.items[${i}]`),
  );
  const { note } = value;
  if (note !== undefined && typeof note !== "string") {
    throw new ValidationError(`${path}.note must be a string`);
  }
  return note === undefined ? { month, items } : { month, items, note };
}

/** Parse and validate the raw JSON text of an uploaded spendings file. */
export function parseSpendingsJson(text: string): UserData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new ValidationError(
      `File is not valid JSON: ${(err as Error).message}`,
    );
  }
  if (!isObject(raw)) {
    throw new ValidationError("Top-level JSON must be an object");
  }
  if (!Array.isArray(raw.accounts)) {
    throw new ValidationError("accounts must be an array");
  }
  if (!Array.isArray(raw.categories)) {
    throw new ValidationError("categories must be an array");
  }
  if (!Array.isArray(raw.spendings)) {
    throw new ValidationError("spendings must be an array");
  }

  const accounts = raw.accounts.map((a, i) =>
    parseNamed<Account>(a, `accounts[${i}]`),
  );
  const categories = raw.categories.map((c, i) =>
    parseNamed<Category>(c, `categories[${i}]`),
  );
  const spendings = raw.spendings.map((m, i) =>
    parseMonthly(m, `spendings[${i}]`),
  );

  return { accounts, categories, spendings };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(month: number): string {
  const year = Math.floor(month / 100);
  const m = month % 100;
  const name = MONTH_NAMES[m - 1] ?? `Month ${m}`;
  return `${name} ${year}`;
}
