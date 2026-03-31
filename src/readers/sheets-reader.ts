import { google } from "googleapis";
import type { RawRow } from "./normalize";

export function parseSheetUrl(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error("유효한 Google Sheets URL이 아닙니다");
  }
  return match[1];
}

export function convertToRawRows(values: string[][]): RawRow[] {
  const [headers, ...dataRows] = values;
  return dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] ?? "";
    });
    return obj as RawRow;
  });
}

export async function readGoogleSheet(sheetUrl: string): Promise<RawRow[]> {
  const spreadsheetId = parseSheetUrl(sheetUrl);
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY 환경변수가 설정되지 않았습니다");
  }

  const sheets = google.sheets({ version: "v4", auth: apiKey });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A:Z",
  });

  const values = response.data.values;
  if (!values || values.length < 2) {
    throw new Error("시트에 데이터가 없습니다");
  }

  return convertToRawRows(values);
}
