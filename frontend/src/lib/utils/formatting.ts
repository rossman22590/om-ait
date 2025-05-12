/**
 * Format a duration in seconds to a human-readable string.
 * @param durationInSeconds The duration in seconds.
 * @returns Formatted string in the format "Xh Ym Zs" or "Ym Zs" if hours is 0.
 */
export const formatDuration = (durationInSeconds: number): string => {
  if (!durationInSeconds || durationInSeconds < 0) return '0m 0s';
  
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  result += `${seconds}s`;
  
  return result;
};

/**
 * Format a date string to a human-readable format.
 * @param dateString ISO date string.
 * @returns Formatted date string.
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};
