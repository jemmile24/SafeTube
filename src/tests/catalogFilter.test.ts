import { describe, it, expect } from 'vitest';
import { filterApprovedCatalog } from '../services/catalogFilter';
import { VideoItem } from '../types/video';

describe('Catalog Filter & Strict Search', () => {
  const sampleVideos: VideoItem[] = [
    {
      id: 'video1',
      originalUrl: 'https://youtube.com/watch?v=video1',
      title: 'Learn Quantum Physics in 10 Minutes',
      channelTitle: 'Physics Girl',
      description: 'An introduction to atoms, photons, and quantum mechanics.',
      thumbnailUrl: '',
      durationSeconds: 600,
      metadataSource: 'youtube_api',
    },
    {
      id: 'video2',
      originalUrl: 'https://youtube.com/watch?v=video2',
      title: 'Ambient Relaxing Forest Sounds',
      channelTitle: 'Nature Therapy',
      description: 'Soothing rain and bird sounds for meditation and sleep.',
      thumbnailUrl: '',
      durationSeconds: 3600,
      metadataSource: 'youtube_api',
    },
    {
      id: 'video3',
      originalUrl: 'https://youtube.com/watch?v=video3',
      title: 'Quick JavaScript Arrow Function Tip',
      channelTitle: 'Coding World',
      description: 'A 60 second quick tip on ES6 JavaScript syntax.',
      thumbnailUrl: '',
      durationSeconds: 60,
      metadataSource: 'youtube_api',
    },
  ];

  it('searches strictly by title', () => {
    const results = filterApprovedCatalog(sampleVideos, {
      searchQuery: 'quantum',
      activeFilter: 'all',
      bookmarkedIds: new Set(),
      historyIds: [],
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('video1');
  });

  it('searches strictly by channel name', () => {
    const results = filterApprovedCatalog(sampleVideos, {
      searchQuery: 'Coding World',
      activeFilter: 'all',
      bookmarkedIds: new Set(),
      historyIds: [],
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('video3');
  });

  it('searches strictly by description', () => {
    const results = filterApprovedCatalog(sampleVideos, {
      searchQuery: 'meditation',
      activeFilter: 'all',
      bookmarkedIds: new Set(),
      historyIds: [],
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('video2');
  });

  it('returns empty array when search query matches no approved videos', () => {
    const results = filterApprovedCatalog(sampleVideos, {
      searchQuery: 'completely unrelated query 12345678',
      activeFilter: 'all',
      bookmarkedIds: new Set(),
      historyIds: [],
    });

    expect(results.length).toBe(0);
  });

  it('filters by short videos (<= 5 min)', () => {
    const results = filterApprovedCatalog(sampleVideos, {
      searchQuery: '',
      activeFilter: 'short',
      bookmarkedIds: new Set(),
      historyIds: [],
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('video3');
  });

  it('filters by long videos (>= 15 min)', () => {
    const results = filterApprovedCatalog(sampleVideos, {
      searchQuery: '',
      activeFilter: 'long',
      bookmarkedIds: new Set(),
      historyIds: [],
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('video2');
  });

  it('filters by bookmarked videos', () => {
    const results = filterApprovedCatalog(sampleVideos, {
      searchQuery: '',
      activeFilter: 'bookmarked',
      bookmarkedIds: new Set(['video1', 'video3']),
      historyIds: [],
    });

    expect(results.length).toBe(2);
    expect(results.map((v) => v.id)).toEqual(['video1', 'video3']);
  });
});
