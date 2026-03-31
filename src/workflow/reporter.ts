export interface RowResult {
  rowIndex: number;
  menuPath: string;
  success: boolean;
  error?: string;
  screenshotPath?: string;
}

export interface Report {
  total: number;
  successCount: number;
  failCount: number;
  successes: RowResult[];
  failures: RowResult[];
  toText: () => string;
}

export function generateReport(results: RowResult[]): Report {
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  const toText = (): string => {
    const lines: string[] = [];
    lines.push(`완료: ${successes.length}건 / 실패: ${failures.length}건`);
    lines.push("");

    if (successes.length > 0) {
      lines.push("성공:");
      for (const r of successes) {
        lines.push(` ${r.rowIndex}행 - ${r.menuPath} → 완료`);
      }
      lines.push("");
    }

    if (failures.length > 0) {
      lines.push("실패:");
      for (const r of failures) {
        let line = ` ${r.rowIndex}행 - ${r.menuPath} → ${r.error}`;
        if (r.screenshotPath) {
          line += ` (스크린샷: ${r.screenshotPath})`;
        }
        lines.push(line);
      }
    }

    return lines.join("\n");
  };

  return {
    total: results.length,
    successCount: successes.length,
    failCount: failures.length,
    successes,
    failures,
    toText,
  };
}
