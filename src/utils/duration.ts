/**
 * Parses an ISO 8601 duration string (e.g., "PT4M13S", "PT1H2M30S", "PT59S")
 * into formatted string "MM:SS" or "HH:MM:SS" and total seconds.
 */
export function parseIsoDuration(durationStr?: string): { formatted: string; seconds: number } | null {
  if (!durationStr || typeof durationStr !== 'string') {
    return null;
  }

  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return null;
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return {
      formatted: `${hours}:${paddedMinutes}:${paddedSeconds}`,
      seconds: totalSeconds,
    };
  }

  const paddedSeconds = seconds.toString().padStart(2, '0');
  return {
    formatted: `${minutes}:${paddedSeconds}`,
    seconds: totalSeconds,
  };
}

/**
 * Formats a raw number of seconds into "MM:SS" or "HH:MM:SS".
 */
export function formatSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }

  const floorSec = Math.floor(totalSeconds);
  const hours = Math.floor(floorSec / 3600);
  const minutes = Math.floor((floorSec % 3600) / 60);
  const seconds = floorSec % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
