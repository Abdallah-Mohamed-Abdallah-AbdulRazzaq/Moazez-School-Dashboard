/**
 * Generate timestamps for weekly data points
 * @param weeksAgo - Number of weeks to go back (e.g., 4 for last 4 weeks)
 * @returns Array of ISO timestamp strings for each week
 */
export function generateWeeklyTimestamps(weeksAgo: number): string[] {
  const timestamps: string[] = [];
  const now = new Date();
  
  for (let i = weeksAgo - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7)); // Go back i weeks
    timestamps.push(date.toISOString());
  }
  
  return timestamps;
}

/**
 * Generate timestamps for monthly data points
 * @param monthsAgo - Number of months to go back (e.g., 4 for last 4 months)
 * @returns Array of ISO timestamp strings for each month
 */
export function generateMonthlyTimestamps(monthsAgo: number): string[] {
  const timestamps: string[] = [];
  const now = new Date();
  
  for (let i = monthsAgo - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i); // Go back i months
    timestamps.push(date.toISOString());
  }
  
  return timestamps;
}

/**
 * Generate timestamps for daily data points
 * @param daysAgo - Number of days to go back (e.g., 7 for last 7 days)
 * @returns Array of ISO timestamp strings for each day
 */
export function generateDailyTimestamps(daysAgo: number): string[] {
  const timestamps: string[] = [];
  const now = new Date();
  
  for (let i = daysAgo - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i); // Go back i days
    timestamps.push(date.toISOString());
  }
  
  return timestamps;
}
