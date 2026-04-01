export interface RawRow {
  메뉴경로: string;
  [key: string]: string;
}

export interface WorkflowRow {
  rowIndex: number;
  menuPath: string[];
  fields: Record<string, string>;
  saveButtonText: string;
  error?: string;
}

const RESERVED_COLUMNS = ["메뉴경로", "저장버튼"];

export function normalizeRows(rows: RawRow[]): WorkflowRow[] {
  return rows.map((row, i) => {
    const menuPathRaw = row["메뉴경로"]?.trim();

    if (!menuPathRaw) {
      return {
        rowIndex: i + 1,
        menuPath: [],
        fields: {},
        saveButtonText: "",
        error: "메뉴경로가 비어 있습니다",
      };
    }

    const menuPath = menuPathRaw.split(">").map((s) => s.trim());
    const saveButtonText = row["저장버튼"]?.trim() || "저장";

    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      if (RESERVED_COLUMNS.includes(key)) continue;
      if (value && value.trim() !== "") {
        fields[key] = value.trim();
      }
    }

    return { rowIndex: i + 1, menuPath, fields, saveButtonText };
  });
}
