// Shared utilities for Tarot Platform

/**
 * Format a token amount to 2 decimal places for consistent display
 */
export function formatTokens(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Calculate the maximum duration of a call in minutes based on available balance and tarot reader's rate
 */
export function calculateMaxCallDuration(balance: number, ratePerMinute: number): number {
  if (ratePerMinute <= 0) return 999; // Unlimited/free
  return Math.floor(balance / ratePerMinute);
}

/**
 * Standard password strength validator
 */
export function isPasswordStrong(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Format date to standard readable format
 */
export function formatReadableDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString();
}
