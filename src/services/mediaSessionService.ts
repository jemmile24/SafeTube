import { VideoItem } from '../types/video';

export interface MediaSessionControls {
  onPlay?: () => void;
  onPause?: () => void;
  onSeekTo?: (time: number) => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
}

/**
 * Updates the browser's Media Session API metadata and registers playback controls.
 * This enables lock screen controls, notification shade controls on Android Chrome,
 * and hardware media key support on desktop browsers.
 *
 * NOTE ON ANDROID/DESKTOP RESTRICTIONS:
 * - Chrome on Android allows Media Session controls while the browser or PWA is open or backgrounded,
 *   provided media is actively playing.
 * - However, when the screen locks, Android power management and YouTube embedded iframe policies
 *   may suspend playback unless the user interacts or background playback is permitted.
 * - SafeTube adheres strictly to official Web APIs and does not employ forbidden hacks.
 */
export function updateMediaSession(
  video: VideoItem | null,
  controls: MediaSessionControls = {}
): void {
  if (!('mediaSession' in navigator) || !video) {
    return;
  }

  try {
    // 1. Set Media Metadata
    const artwork = [
      {
        src: video.thumbnailUrl,
        sizes: '128x128',
        type: 'image/jpeg',
      },
      {
        src: video.thumbnailHighUrl || video.thumbnailUrl,
        sizes: '480x360',
        type: 'image/jpeg',
      },
      {
        src: video.thumbnailHighUrl || video.thumbnailUrl,
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: video.title,
      artist: video.channelTitle,
      album: 'SafeTube Approved Library',
      artwork,
    });

    // 2. Register Media Session action handlers
    if (controls.onPlay) {
      navigator.mediaSession.setActionHandler('play', controls.onPlay);
    }
    if (controls.onPause) {
      navigator.mediaSession.setActionHandler('pause', controls.onPause);
    }
    if (controls.onSeekTo) {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && controls.onSeekTo) {
          controls.onSeekTo(details.seekTime);
        }
      });
    }
    if (controls.onSeekBackward) {
      navigator.mediaSession.setActionHandler('seekbackward', controls.onSeekBackward);
    }
    if (controls.onSeekForward) {
      navigator.mediaSession.setActionHandler('seekforward', controls.onSeekForward);
    }
  } catch (err) {
    console.warn('MediaSession API update ignored:', err);
  }
}

/**
 * Updates playback position state in MediaSession
 */
export function updateMediaSessionPositionState(
  duration: number,
  currentTime: number,
  playbackRate: number = 1
): void {
  if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') {
    return;
  }

  try {
    if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: playbackRate || 1,
        position: Math.min(currentTime, duration),
      });
    }
  } catch {
    // Position state might fail during buffering transitions
  }
}

/**
 * Clears Media Session when playback ends or stops
 */
export function clearMediaSession(): void {
  if (!('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('seekto', null);
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);
  } catch {
    // Ignore cleanup errors
  }
}
