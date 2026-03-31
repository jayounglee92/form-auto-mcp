import { describe, it, expect } from "vitest";
import { generateReport, type RowResult } from "../../src/workflow/reporter";

describe("generateReport", () => {
  it("성공/실패 건수를 집계한다", () => {
    const results: RowResult[] = [
      { rowIndex: 1, menuPath: "프로젝트 > 일정관리", success: true },
      { rowIndex: 2, menuPath: "프로젝트 > 산출물", success: true },
      { rowIndex: 3, menuPath: "운영 > 공지", success: false, error: "메뉴 못 찾음", screenshotPath: "errors/row3.png" },
    ];
    const report = generateReport(results);
    expect(report.total).toBe(3);
    expect(report.successCount).toBe(2);
    expect(report.failCount).toBe(1);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0].rowIndex).toBe(3);
  });

  it("모두 성공이면 failures가 비어있다", () => {
    const results: RowResult[] = [
      { rowIndex: 1, menuPath: "프로젝트 > 일정관리", success: true },
    ];
    const report = generateReport(results);
    expect(report.failCount).toBe(0);
    expect(report.failures).toEqual([]);
  });

  it("리포트를 텍스트로 포맷한다", () => {
    const results: RowResult[] = [
      { rowIndex: 1, menuPath: "프로젝트 > 일정관리", success: true },
      { rowIndex: 2, menuPath: "운영 > 공지", success: false, error: "라벨 못 찾음" },
    ];
    const text = generateReport(results).toText();
    expect(text).toContain("완료: 1건");
    expect(text).toContain("실패: 1건");
    expect(text).toContain("2행");
  });
});
