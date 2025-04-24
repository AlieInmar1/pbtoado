import { format, parseISO, isAfter, isBefore, isEqual } from 'date-fns';

/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Apr 14, 2025")
 */
export const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM d, yyyy');
};

/**
 * Format a date range to a readable format
 * @param startDate ISO date string for start date
 * @param endDate ISO date string for end date
 * @returns Formatted date range string (e.g., "Apr 14 - Apr 28, 2025")
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
  return `${format(parseISO(startDate), 'MMM d')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`;
};

/**
 * Check if a date is within a specified range
 * @param date ISO date string to check
 * @param startDate ISO date string for start of range
 * @param endDate ISO date string for end of range
 * @returns boolean indicating if date is in range (inclusive)
 */
export const isDateInRange = (date: string, startDate: string, endDate: string): boolean => {
  const dateObj = parseISO(date);
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  return (isAfter(dateObj, start) || isEqual(dateObj, start)) && 
         (isBefore(dateObj, end) || isEqual(dateObj, end));
};

/**
 * Get the number of days between two dates
 * @param startDate ISO date string for start date
 * @param endDate ISO date string for end date
 * @returns Number of days between dates
 */
export const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  // Calculate difference in milliseconds and convert to days
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
