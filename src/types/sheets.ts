export interface GoogleSheetsConfig {
  sheetId: string;
  range: string;
  apiKey?: string;
}

export interface SheetParseResult {
  validVideoIds: string[];
  rawUrls: string[];
  invalidRows: { row: number; value: string; reason: string }[];
  duplicatesCount: number;
}
