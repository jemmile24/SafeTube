/**
 * SafeTube YouTube URL Parser & Validator
 *
 * Strict, robust parsing of YouTube URLs from Google Sheets.
 * Validates domain, structure, and canonical 11-character video ID.
 */

// Canonical YouTube video ID regex: exactly 11 characters consisting of alphanumeric, underscore, or hyphen
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export interface ParsedVideoEntry {
  videoId: string;
  originalUrl: string;
  canonicalUrl: string;
  isValid: boolean;
  error?: string;
}

/**
 * Extracts the canonical 11-character YouTube video ID from various supported URL formats.
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube-nocookie.com/embed/VIDEO_ID
 * - Raw 11-char ID (if entered directly)
 *
 * @param urlString The raw string from the spreadsheet cell
 * @returns Clean 11-character video ID, or null if invalid
 */
export function extractYouTubeVideoId(urlString: string): string | null {
  if (!urlString || typeof urlString !== 'string') {
    return null;
  }

  const trimmed = urlString.trim();
  if (!trimmed) {
    return null;
  }

  // If the cell contains just a raw 11-character video ID
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    // Add protocol if missing to allow standard URL parsing
    const urlToParse = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(urlToParse);
    const hostname = parsed.hostname.toLowerCase();

    // Verify allowed YouTube domains strictly (prevent attacker.com/youtube.com tricks)
    const isAllowedDomain =
      hostname === 'www.youtube.com' ||
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'music.youtube.com' ||
      hostname === 'youtu.be' ||
      hostname === 'www.youtube-nocookie.com';

    if (!isAllowedDomain) {
      return null;
    }

    let candidateId: string | null = null;

    if (hostname === 'youtu.be') {
      // Format: https://youtu.be/VIDEO_ID or https://youtu.be/VIDEO_ID?t=10
      const pathSegment = parsed.pathname.slice(1).split('/')[0];
      candidateId = pathSegment;
    } else {
      // Standard youtube.com domain
      const pathname = parsed.pathname;

      if (pathname === '/watch') {
        // Format: /watch?v=VIDEO_ID
        candidateId = parsed.searchParams.get('v');
      } else if (pathname.startsWith('/shorts/')) {
        // Format: /shorts/VIDEO_ID
        candidateId = pathname.replace('/shorts/', '').split('/')[0];
      } else if (pathname.startsWith('/embed/')) {
        // Format: /embed/VIDEO_ID
        candidateId = pathname.replace('/embed/', '').split('/')[0];
      } else if (pathname.startsWith('/v/')) {
        // Format: /v/VIDEO_ID
        candidateId = pathname.replace('/v/', '').split('/')[0];
      } else if (pathname.startsWith('/live/')) {
        // Format: /live/VIDEO_ID
        candidateId = pathname.replace('/live/', '').split('/')[0];
      }
    }

    // Clean any trailing query or hash artifacts
    if (candidateId) {
      const cleanId = candidateId.trim();
      if (YOUTUBE_ID_REGEX.test(cleanId)) {
        return cleanId;
      }
    }

    return null;
  } catch {
    // Malformed URL string
    return null;
  }
}

/**
 * Validates a single URL string and returns detailed parsing result
 */
export function validateYouTubeUrl(rawUrl: string): ParsedVideoEntry {
  const trimmed = (rawUrl || '').trim();

  if (!trimmed) {
    return {
      videoId: '',
      originalUrl: rawUrl,
      canonicalUrl: '',
      isValid: false,
      error: 'Empty or blank URL',
    };
  }

  const videoId = extractYouTubeVideoId(trimmed);

  if (!videoId) {
    return {
      videoId: '',
      originalUrl: rawUrl,
      canonicalUrl: '',
      isValid: false,
      error: 'Invalid YouTube URL or unsupported format',
    };
  }

  return {
    videoId,
    originalUrl: trimmed,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    isValid: true,
  };
}

/**
 * Processes a list of raw URLs from Google Sheets:
 * 1. Filters out blank rows
 * 2. Validates each URL
 * 3. Deduplicates by canonical video ID while strictly preserving spreadsheet order
 * 4. Collects error rows for debugging/auditing
 */
export function processSheetUrls(rawRows: string[]): {
  approvedVideoIds: string[];
  approvedEntries: { videoId: string; originalUrl: string; rowIndex: number }[];
  rejectedRows: { rowNumber: number; rawValue: string; reason: string }[];
  duplicateCount: number;
} {
  const seenIds = new Set<string>();
  const approvedVideoIds: string[] = [];
  const approvedEntries: { videoId: string; originalUrl: string; rowIndex: number }[] = [];
  const rejectedRows: { rowNumber: number; rawValue: string; reason: string }[] = [];
  let duplicateCount = 0;

  rawRows.forEach((rowValue, index) => {
    const rowNumber = index + 2; // Assuming row 1 is header (Videos!A2:A)
    const trimmed = (rowValue || '').trim();

    // Ignore blank rows silently
    if (!trimmed) {
      return;
    }

    // Skip column headers if someone included "video_url" or "url" in row A2
    if (
      trimmed.toLowerCase() === 'video_url' ||
      trimmed.toLowerCase() === 'url' ||
      trimmed.toLowerCase() === 'youtube url' ||
      trimmed.toLowerCase() === 'youtube_url'
    ) {
      return;
    }

    const parsed = validateYouTubeUrl(trimmed);

    if (!parsed.isValid || !parsed.videoId) {
      rejectedRows.push({
        rowNumber,
        rawValue: trimmed,
        reason: parsed.error || 'Invalid YouTube URL',
      });
      return;
    }

    // Check for duplicate
    if (seenIds.has(parsed.videoId)) {
      duplicateCount++;
      return;
    }

    seenIds.add(parsed.videoId);
    approvedVideoIds.push(parsed.videoId);
    approvedEntries.push({
      videoId: parsed.videoId,
      originalUrl: parsed.originalUrl,
      rowIndex: rowNumber,
    });
  });

  return {
    approvedVideoIds,
    approvedEntries,
    rejectedRows,
    duplicateCount,
  };
}
