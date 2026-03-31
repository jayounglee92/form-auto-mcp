import { describe, it, expect } from "vitest";
import { readExcelFile } from "../../src/readers/excel-reader";
import { resolve } from "path";

describe("readExcelFile", () => {
  it("CSV 파일을 읽어 RawRow 배열로 반환한다", () => {
    const filePath = resolve(__dirname, "../fixtures/sample.csv");
    const rows = readExcelFile(filePath);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      "메뉴경로": "프로젝트 > 일정관리",
      "프로젝트명": "3월 리뷰",
      "설명": "주간보고 작성",
      "비고": "완료",
    });
  });

  it("존재하지 않는 파일이면 에러를 던진다", () => {
    expect(() => readExcelFile("/nonexistent/file.xlsx")).toThrow();
  });
});
