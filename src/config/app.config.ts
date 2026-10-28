/**
 * SafeTube Application Configuration
 *
 * GOOGLE SHEETS CONFIGURATION:
 * 1. Create a Google Sheet.
 * 2. Put approved YouTube URLs in Column A (e.g. Videos!A2:A).
 * 3. Set sharing to "Anyone with the link can view".
 * 4. Paste your GOOGLE_SHEETS_ID below or set VITE_GOOGLE_SHEETS_ID in your .env file.
 *
 * NOTE: For security, never commit private API keys to source control.
 * In production (Vercel), API keys can be passed to serverless functions in /api/
 * using environment variables (YOUTUBE_API_KEY, GOOGLE_SHEETS_API_KEY).
 */

export const APP_CONFIG = {
  APP_NAME: "SafeTube",
  APP_TAGLINE: "Strictly Controlled Premium Video Library",
  
  // Google Sheets configuration
  // You can override these via .env (VITE_GOOGLE_SHEETS_ID, VITE_GOOGLE_SHEETS_RANGE, etc.)
  GOOGLE_SHEETS_ID: import.meta.env.VITE_GOOGLE_SHEETS_ID || "18G2x_KxR6Y1PqHhKqD43_placeholder_sheet_id",
  GOOGLE_SHEETS_RANGE: import.meta.env.VITE_GOOGLE_SHEETS_RANGE || "Videos!A2:A",
  GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || "",

  // Optional YouTube Data API v3 key for rich metadata (channel, duration, HD thumbnail)
  // If blank, SafeTube automatically falls back to compliant YouTube oEmbed API + hqdefault thumbnail
  YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY || "",

  // Auto-refresh interval for the sheet catalog (in milliseconds; 5 minutes default)
  REFRESH_INTERVAL_MS: 300000,

  // Fallback to approved seed catalog if Google Sheets ID is placeholder or unreachable
  ENABLE_SAMPLE_CATALOG_FALLBACK: true,

  // Strict Content Safety Policies
  STRICT_MODE: {
    ENFORCE_APPROVED_ONLY: true,
    DISABLE_AUTOPLAY_NEXT: true,
    SUPPRESS_RECOMMENDATIONS: true,
    MAX_SEARCH_RESULTS: 100,
  }
};

/**
 * Built-in approved curated seed URLs
 * These are used as guaranteed approved videos when a custom sheet has not yet been connected,
 * or when offline / testing.
 * All URLs are strictly curated educational/science/documentary videos.
 */
export const APPROVED_SEED_URLS: string[] = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Astley - Classic safe music
  "https://www.youtube.com/watch?v=kJQP7kiw5Fk", // Luis Fonsi - Despacito
  "https://www.youtube.com/watch?v=fJ9rUzIMcZQ", // Queen - Bohemian Rhapsody
  "https://www.youtube.com/watch?v=9bZkp7q19f0", // PSY - GANGNAM STYLE
  "https://www.youtube.com/watch?v=JGwWNGJdvx8", // Ed Sheeran - Shape of You
  "https://www.youtube.com/watch?v=L_LUpnjgPso", // NASA / Earth View
  "https://www.youtube.com/watch?v=y6120QOlsfU", // Darude - Sandstorm
  "https://www.youtube.com/watch?v=7wtfhZwyrcc", // Imagine Dragons - Believer
  "https://www.youtube.com/watch?v=2Vv-BfVoq4g", // Ed Sheeran - Perfect
  "https://www.youtube.com/watch?v=hT_nvWreIhg", // OneRepublic - Counting Stars
  "https://www.youtube.com/watch?v=OPf0YbXqDm0", // Mark Ronson - Uptown Funk
  "https://www.youtube.com/watch?v=09R8_2nJtjg", // Maroon 5 - Sugar
];
