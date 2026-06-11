/**
 * Formats a number as USD currency.
 * @param amount Number to format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats a date string or Date object into a readable format.
 * @param date Date to format
 * @param includeTime Whether to include hours/minutes
 */
export const formatDate = (date: string | Date, includeTime = false): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  }).format(d);
};

/**
 * Formats a percentage number.
 * @param value Decimal percentage value (e.g. 0.054 -> +5.4%)
 */
export const formatPercentage = (value: number): string => {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(value);
  return formatted;
};

/**
 * Generates a unique crypto-safe or random string for mock database entries.
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
