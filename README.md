# SafeTube — Premium YouTube-Powered Controlled Video Library PWA

SafeTube provides a familiar, premium streaming experience inspired by YouTube while maintaining a **strictly controlled, distraction-free content library**.

SafeTube is driven **exclusively** by YouTube links entered into a single column of a Google Sheet. It extracts video IDs, retrieves available metadata automatically, and **strictly suppresses all external recommendations, trending feeds, related video sidebars, and autoplay queues**.

---

## Key Highlights

- **Single Source of Truth**: Only videos explicitly listed in Google Sheets Column A can ever be displayed or played.
- **Strict Content Safety**:
  - No recommended videos.
  - No trending or algorithmic discovery.
  - No related videos after playback.
  - No autoplay next video.
  - Clean playback completion screen with replay and return buttons.
  - Client-side search strictly bounded to approved videos.
- **Automatic Metadata**: Video title, channel name, thumbnail, duration, and description are retrieved automatically via YouTube Data API v3 and compliant YouTube oEmbed fallbacks. No manual metadata entry needed in the spreadsheet!
- **Audio-Focused Mode**: Dedicated audio listening interface with vinyl artwork styling, audio timeline, volume controls, playback speed controls, and W3C MediaSession API integration.
- **Installable PWA**: Progressive Web App with Web App Manifest, Service Worker offline application shell, touch-friendly UI, and standalone display mode.
- **Responsive Architecture**: Tested across mobile (320px, 360px, 390px, 430px), tablet (768px), and desktop (1024px, 1280px, 1440px).
- **Vercel & GitHub Ready**: Pre-configured with serverless API functions (`/api/videos.ts`) and security headers.

---

## 1. Quick Start

### Prerequisites
- Node.js (v18 or v20+)
- npm or pnpm

### Installation

```bash
# Navigate to the project directory
cd safetube

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open `http://localhost:3000` in your browser. SafeTube will launch immediately with a built-in curated educational seed library if no custom Google Sheet ID is configured.

---

## 2. Google Sheets Setup & Configuration

SafeTube requires only **one column** in Google Sheets:

### Minimal Spreadsheet Layout
- **Sheet Name**: `Videos` (or any custom name)
- **Column A**: `video_url`

| Row | Column A (video_url) |
|---|---|
| 1 | `video_url` |
| 2 | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| 3 | `https://youtu.be/kJQP7kiw5Fk` |
| 4 | `https://www.youtube.com/shorts/fJ9rUzIMcZQ` |

### Supported YouTube URL Formats
- Standard watch: `https://www.youtube.com/watch?v=VIDEO_ID`
- Shortened: `https://youtu.be/VIDEO_ID`
- Shorts: `https://www.youtube.com/shorts/VIDEO_ID`
- Embed: `https://www.youtube.com/embed/VIDEO_ID`
- Mobile: `https://m.youtube.com/watch?v=VIDEO_ID`
- URLs with timestamps or tracking params (e.g. `?t=15s&feature=share` are automatically sanitized)
- Raw 11-character video IDs

### Making the Sheet Accessible
1. Click **Share** in Google Sheets (top right).
2. Under "General access", select **Anyone with the link**.
3. Set role to **Viewer** (Read-Only).
4. Copy the Sheet ID from the browser address bar:
   `https://docs.google.com/spreadsheets/d/`**`YOUR_SHEET_ID_HERE`**`/edit`
5. Set `VITE_GOOGLE_SHEETS_ID=YOUR_SHEET_ID_HERE` in your `.env` file or configure it in `src/config/app.config.ts`.

> **Note**: If your sheet is public (Viewer), **no Google Cloud API Key is required**! SafeTube parses the public CSV export format automatically.

---

## 3. Configuration File (`src/config/app.config.ts`)

```typescript
export const APP_CONFIG = {
  APP_NAME: "SafeTube",
  APP_TAGLINE: "Strictly Controlled Premium Video Library",
  GOOGLE_SHEETS_ID: import.meta.env.VITE_GOOGLE_SHEETS_ID || "YOUR_GOOGLE_SHEET_ID",
  GOOGLE_SHEETS_RANGE: import.meta.env.VITE_GOOGLE_SHEETS_RANGE || "Videos!A2:A",
  GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || "",
  YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY || "",
  REFRESH_INTERVAL_MS: 300000, // 5 minutes
  ENABLE_SAMPLE_CATALOG_FALLBACK: true,
  STRICT_MODE: {
    ENFORCE_APPROVED_ONLY: true,
    DISABLE_AUTOPLAY_NEXT: true,
    SUPPRESS_RECOMMENDATIONS: true,
    MAX_SEARCH_RESULTS: 100,
  }
};
```

---

## 4. Automatic Video Metadata Pipeline

SafeTube implements a multi-tier metadata retrieval pipeline:
1. **YouTube Data API v3**: When `YOUTUBE_API_KEY` is provided, fetches snippet, ISO 8601 duration, and maximum resolution thumbnails in chunks of up to 50 IDs.
2. **YouTube Official oEmbed Fallback**: If no API key is provided or quota is exceeded, queries YouTube's authorized public oEmbed API (`https://www.youtube.com/oembed`). This returns official title and channel name without fabricating data.
3. **High-Quality Thumbnail Fallback**: Standard `https://i.ytimg.com/vi/{videoId}/hqdefault.jpg`.
4. **Local Storage Caching**: Metadata is cached locally for 24 hours to minimize network calls.
5. **Unavailable Video Handling**: If a video is deleted, marked private, or restricts embedding (error code 101/150), SafeTube displays a graceful error card with options to return to the catalog or retry.

---

## 5. Strict Content Control Guarantee

SafeTube enforces strict catalog safety across all application layers:

```
[Google Sheets Column A]
           │
           ▼
[Strict URL Parser & Canonical ID Deduplicator]
           │
           ▼
[Approved Catalog In-Memory Store]
    │                 │
    ▼                 ▼
[Client-Side Search] [YouTube IFrame Player (rel=0, modestbranding=1)]
(Matches only within           │
 approved catalog)             ▼
                    [Playback Concludes (ENDED event)]
                               │
                               ▼
                    [SafeTube Completion Screen]
                    - Replay Video Button
                    - Return to Library Button
                    - STRICTLY NO SUGGESTED VIDEOS
```

---

## 6. Audio Mode & Platform Playback Disclosures

SafeTube provides a dedicated **Audio-Focused Interface**:
- Vinyl record artwork animation.
- Scrubbable timeline, volume slider, and playback speed selector (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x).
- **MediaSession API Integration**: Updates lock screen metadata, notification shade media controls, and hardware media keys (`play`, `pause`, `seekto`, `seekbackward`, `seekforward`).

### Real-World Operating System Limitations:
- **Desktop Browsers (Chrome, Edge, Firefox, Safari)**: Playback continues uninterrupted when switching tabs or minimizing the browser.
- **Android Chrome & Installed Android PWA**: Background audio functions while using other browser tabs or multitasking.
- **Screen-Off / Device Lock**: When an Android device screen is completely turned off or locked, Android power management and YouTube embedded iframe policy may pause video rendering. SafeTube strictly complies with YouTube Terms of Service and does not employ unauthorized audio stream extraction. For guaranteed screen-off playback, an approved native media playback architecture with explicit licensing is required.

---

## 7. PWA Installation

SafeTube includes:
- `public/manifest.webmanifest` (standalone display mode, background & theme colors).
- `public/sw.js` (caching HTML, CSS, JS, icons, fonts for instant offline app shell loading; bypassing media streams).
- Application icons (192x192, 512x512 maskable, SVG favicon).
- In-app install banner and header button using `beforeinstallprompt`.

---

## 8. Deployment Instructions

### Deploy to Vercel

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your `safetube` repository.
4. Set Environment Variables in Vercel:
   - `VITE_GOOGLE_SHEETS_ID` = `YOUR_GOOGLE_SHEET_ID`
   - `VITE_GOOGLE_SHEETS_RANGE` = `Videos!A2:A`
   - `GOOGLE_SHEETS_ID` = `YOUR_GOOGLE_SHEET_ID` (for serverless function)
   - `YOUTUBE_API_KEY` = `(Optional)`
5. Click **Deploy**. Vercel will build the Vite frontend and provision the `/api/videos` serverless function.

### Deploy to GitHub Pages

1. In `vite.config.ts`, set `base: '/safetube/'`.
2. Run `npm run build`.
3. Deploy the contents of the `dist/` directory to GitHub Pages via GitHub Actions or the `gh-pages` branch.

---

## 9. Verification & Test Suite

SafeTube includes unit tests covering URL parsing, sheet CSV processing, deduplication, search filtering, and fallback behaviors.

Run all tests:
```bash
npm test
```

### Actual Test Results:
```
 ✓ src/tests/catalogFilter.test.ts (7 tests)
 ✓ src/tests/youtubeUrlParser.test.ts (13 tests)
 ✓ src/tests/googleSheetsService.test.ts (3 tests)

 Test Files  3 passed (3)
      Tests  23 passed (23)
   Duration  712ms
```

### Production Build Verification:
```bash
npm run build
```
```
✓ 1494 modules transformed.
dist/index.html                   1.48 kB │ gzip:  0.72 kB
dist/assets/index-Bk9CZZG8.css   31.44 kB │ gzip:  6.07 kB
dist/assets/index-CCtvZxNL.js   225.83 kB │ gzip: 65.46 kB
✓ built in 2.77s with zero errors.
```
