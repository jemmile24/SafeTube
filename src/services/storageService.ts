const BOOKMARKS_KEY = 'safetube_bookmarks';
const HISTORY_KEY = 'safetube_history';
const THEME_KEY = 'safetube_theme';
const CUSTOM_CONFIG_KEY = 'safetube_custom_config';

export interface CustomConfig {
  sheetId: string;
  range: string;
  apiKey: string;
  youtubeApiKey: string;
}

export function getBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function toggleBookmark(videoId: string): Set<string> {
  const current = getBookmarks();
  if (current.has(videoId)) {
    current.delete(videoId);
  } else {
    current.add(videoId);
  }
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // Ignore storage quota errors
  }
  return current;
}

export function getWatchHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addToWatchHistory(videoId: string): void {
  try {
    const history = getWatchHistory().filter((id) => id !== videoId);
    history.unshift(videoId);
    // Keep max 50 recent items
    const trimmed = history.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredTheme(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    // Default to dark theme as SafeTube is a premium cinema-style video platform
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
}

export function getCustomConfig(): CustomConfig | null {
  try {
    const raw = localStorage.getItem(CUSTOM_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCustomConfig(config: CustomConfig): void {
  try {
    localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

export function clearCustomConfig(): void {
  try {
    localStorage.removeItem(CUSTOM_CONFIG_KEY);
  } catch {
    // Ignore
  }
}
