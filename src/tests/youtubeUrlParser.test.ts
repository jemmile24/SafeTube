import { describe, it, expect } from 'vitest';
import {
  extractYouTubeVideoId,
  validateYouTubeUrl,
  processSheetUrls
} from '../services/youtubeUrlParser';

describe('YouTube URL Parser', () => {
  describe('extractYouTubeVideoId', () => {
    it('extracts ID from standard watch URL', () => {
      const id = extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from youtu.be short URL', () => {
      const id = extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from YouTube Shorts URL', () => {
      const id = extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from YouTube Embed URL', () => {
      const id = extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from mobile youtube URL', () => {
      const id = extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('handles query parameters and timestamps', () => {
      const id = extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=share');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('handles youtu.be with timestamp query', () => {
      const id = extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=15');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('accepts raw 11-char video ID', () => {
      const id = extractYouTubeVideoId('dQw4w9WgXcQ');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('rejects malicious phishing domains with youtube in name', () => {
      expect(extractYouTubeVideoId('https://phishing-youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
      expect(extractYouTubeVideoId('https://youtube.com.attacker.com/watch?v=dQw4w9WgXcQ')).toBeNull();
      expect(extractYouTubeVideoId('https://vimeo.com/12345678901')).toBeNull();
    });

    it('rejects invalid or malformed video IDs', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=short')).toBeNull();
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=this_id_is_way_too_long_to_be_valid')).toBeNull();
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=inv@lid!char')).toBeNull();
      expect(extractYouTubeVideoId('')).toBeNull();
    });
  });

  describe('validateYouTubeUrl', () => {
    it('returns isValid true and canonicalUrl for valid URL', () => {
      const res = validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(res.isValid).toBe(true);
      expect(res.videoId).toBe('dQw4w9WgXcQ');
      expect(res.canonicalUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('returns isValid false for invalid URL', () => {
      const res = validateYouTubeUrl('https://vimeo.com/123');
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('processSheetUrls', () => {
    it('processes rows, strips header, deduplicates, and preserves order', () => {
      const rawRows = [
        'video_url', // Header row
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Valid 1
        '', // Blank
        '   ', // Blank whitespace
        'https://youtu.be/kJQP7kiw5Fk', // Valid 2
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Duplicate of 1
        'https://vimeo.com/99999999999', // Invalid
        'https://www.youtube.com/shorts/fJ9rUzIMcZQ', // Valid 3
      ];

      const result = processSheetUrls(rawRows);

      expect(result.approvedVideoIds).toEqual([
        'dQw4w9WgXcQ',
        'kJQP7kiw5Fk',
        'fJ9rUzIMcZQ'
      ]);
      expect(result.duplicateCount).toBe(1);
      expect(result.rejectedRows.length).toBe(1);
      expect(result.rejectedRows[0].rawValue).toBe('https://vimeo.com/99999999999');
    });
  });
});
