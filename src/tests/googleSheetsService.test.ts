import { describe, it, expect } from 'vitest';
import { parseCsvColumnA } from '../services/googleSheetsService';

describe('Google Sheets Service', () => {
  describe('parseCsvColumnA', () => {
    it('parses unquoted single column URLs', () => {
      const csv = `https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/kJQP7kiw5Fk
https://www.youtube.com/shorts/fJ9rUzIMcZQ`;

      const rows = parseCsvColumnA(csv);
      expect(rows).toEqual([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/kJQP7kiw5Fk',
        'https://www.youtube.com/shorts/fJ9rUzIMcZQ',
      ]);
    });

    it('parses quoted multi-column CSV and extracts only Column A', () => {
      const csv = `"video_url","notes","added_by"
"https://www.youtube.com/watch?v=dQw4w9WgXcQ","Safe classical video","Admin"
"https://youtu.be/kJQP7kiw5Fk","Music hit","Admin"
"https://www.youtube.com/shorts/fJ9rUzIMcZQ","Short clip","Admin"`;

      const rows = parseCsvColumnA(csv);
      expect(rows).toEqual([
        'video_url',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/kJQP7kiw5Fk',
        'https://www.youtube.com/shorts/fJ9rUzIMcZQ',
      ]);
    });

    it('handles empty lines and whitespace properly', () => {
      const csv = `

"https://www.youtube.com/watch?v=dQw4w9WgXcQ",extra

"https://youtu.be/kJQP7kiw5Fk",extra
      `;

      const rows = parseCsvColumnA(csv);
      expect(rows).toEqual([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/kJQP7kiw5Fk',
      ]);
    });
  });
});
