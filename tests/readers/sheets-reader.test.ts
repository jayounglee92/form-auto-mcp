import { describe, it, expect } from "vitest";
import { parseSheetUrl, convertToRawRows } from "../../src/readers/sheets-reader";

describe("parseSheetUrl", () => {
  it("Google Sheets URL에서 spreadsheetId를 추출한다", () => {
    const url = "https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit#gid=0";
    const id = parseSheetUrl(url);
    expect(id).toBe("1aBcDeFgHiJkLmNoPqRsTuVwXyZ");
  });

  it("잘못된 URL이면 에러를 던진다", () => {
    expect(() => parseSheetUrl("https://example.com")).toThrow("유효한 Google Sheets URL이 아닙니다");
  });
});

describe("convertToRawRows", () => {
  it("2차원 배열을 RawRow 배열로 변환한다", () => {
    const values = [
      ["메뉴경로", "프로젝트명", "설명"],
      ["프로젝트 > 일정관리", "3월 리뷰", "주간보고"],
      ["운영 > 공지", "4월 일정", "휴무 안내"],
    ];
    const rows = convertToRawRows(values);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      "메뉴경로": "프로젝트 > 일정관리",
      "프로젝트명": "3월 리뷰",
      "설명": "주간보고",
    });
  });
});
