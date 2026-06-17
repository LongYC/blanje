import type {
  Account,
  Category,
  MonthlyData,
  Period,
  Spending,
} from "./types";

/** Thrown when uploaded JSON does not match the expected shape. */
export class ValidationError extends Error {}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePeriod(value: unknown, path: string): Period {
  if (!isObject(value)) {
    throw new ValidationError(`${path} must be an object`);
  }
  const { year, month } = value;
  if (typeof year !== "number" || !Number.isInteger(year)) {
    throw new ValidationError(`${path}.year must be an integer`);
  }
  if (typeof month !== "number" || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new ValidationError(`${path}.month must be an integer between 1 and 12`);
  }
  return { year, month };
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
  return { categoryId, name, amount: amountStr, accountId };
}

function parseMonthly(value: unknown, path: string): MonthlyData {
  if (!isObject(value)) {
    throw new ValidationError(`${path} must be an object`);
  }
  const period = parsePeriod(value.period, `${path}.period`);

  if (!Array.isArray(value.categories)) {
    throw new ValidationError(`${path}.categories must be an array`);
  }
  if (!Array.isArray(value.accounts)) {
    throw new ValidationError(`${path}.accounts must be an array`);
  }
  if (!Array.isArray(value.spendings)) {
    throw new ValidationError(`${path}.spendings must be an array`);
  }

  const categories = value.categories.map((c, i) =>
    parseNamed<Category>(c, `${path}.categories[${i}]`),
  );
  const accounts = value.accounts.map((a, i) =>
    parseNamed<Account>(a, `${path}.accounts[${i}]`),
  );
  const spendings = value.spendings.map((s, i) =>
    parseSpending(s, `${path}.spendings[${i}]`),
  );

  return { period, categories, accounts, spendings };
}

/** Parse and validate the raw JSON text of an uploaded spendings file. */
export function parseSpendingsJson(text: string): MonthlyData[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new ValidationError(
      `File is not valid JSON: ${(err as Error).message}`,
    );
  }
  if (!Array.isArray(raw)) {
    throw new ValidationError("Top-level JSON must be an array of monthly periods");
  }
  if (raw.length === 0) {
    throw new ValidationError("File contains no periods");
  }
  return raw.map((m, i) => parseMonthly(m, `[${i}]`));
}
