/**
 * SafeTube Application Configuration
 *
 * Configured with User Google Sheet:
 * Sheet ID: 1VN2RStsFIAJbuKg3ixsTjo8gO5QLqE2TrIkPCG3ofAQ
 * Column A: Link (YouTube URL)
 * Column B: Custom Title (Optional)
 * Column C: Category (Optional)
 */

export const APP_CONFIG = {
  APP_NAME: "SafeTube",
  APP_TAGLINE: "Strictly Controlled Premium Video Library",
  
  // Google Sheets configuration
  GOOGLE_SHEETS_ID: import.meta.env.VITE_GOOGLE_SHEETS_ID || "1VN2RStsFIAJbuKg3ixsTjo8gO5QLqE2TrIkPCG3ofAQ",
  GOOGLE_SHEETS_RANGE: import.meta.env.VITE_GOOGLE_SHEETS_RANGE || "A2:C",
  GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || "",

  // Optional YouTube Data API v3 key
  // Blank uses automatic high-performance oEmbed API + HQ thumbnails
  YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY || "",

  // Auto-refresh interval (5 minutes)
  REFRESH_INTERVAL_MS: 300000,

  // Set to false: NEVER display sample seed videos, ONLY user approved sheet videos!
  ENABLE_SAMPLE_CATALOG_FALLBACK: false,

  // Strict Content Safety Policies
  STRICT_MODE: {
    ENFORCE_APPROVED_ONLY: true,
    DISABLE_AUTOPLAY_NEXT: true,
    SUPPRESS_RECOMMENDATIONS: true,
    MAX_SEARCH_RESULTS: 100,
  }
};

/**
 * Built-in fallback list only used if sheet is completely unreachable
 */
export const APPROVED_SEED_URLS: string[] = [
  "https://youtu.be/lQvM1ZLzeFM",
  "https://youtu.be/Nm79OxT9fAA",
  "https://youtu.be/JnX7Oc8LqD8",
  "https://youtu.be/Xn0oot5O9J0",
  "https://youtu.be/cH8RE-d181c",
];
