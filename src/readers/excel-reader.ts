import * as XLSX from "xlsx";
import type { RawRow } from "./normalize";

export function readExcelFile(filePath: string): RawRow[] {
  const workbook = XLSX.readFile(filePath, { codepage: 65001 });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet);
  return rows;
}
