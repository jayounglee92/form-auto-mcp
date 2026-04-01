import { describe, it, expect } from "vitest";
import { normalizeRows, type RawRow } from "../../src/readers/normalize";

describe("normalizeRows", () => {
  it("메뉴경로, 필드, 저장버튼을 분리한다", () => {
    const raw: RawRow[] = [
      { "메뉴경로": "프로젝트 > 일정관리", "프로젝트명": "3월 리뷰", "설명": "주간보고", "저장버튼": "Submit" },
    ];
    const result = normalizeRows(raw);
    expect(result).toEqual([
      {
        rowIndex: 1,
        menuPath: ["프로젝트", "일정관리"],
        fields: { "프로젝트명": "3월 리뷰", "설명": "주간보고" },
        saveButtonText: "Submit",
      },
    ]);
  });

  it("저장버튼이 없으면 기본값 '저장'을 사용한다", () => {
    const raw: RawRow[] = [
      { "메뉴경로": "운영 > 공지", "제목": "테스트" },
    ];
    const result = normalizeRows(raw);
    expect(result[0].saveButtonText).toBe("저장");
  });

  it("빈 값 필드는 제외한다", () => {
    const raw: RawRow[] = [
      { "메뉴경로": "운영 > 공지", "제목": "테스트", "비고": "" },
    ];
    const result = normalizeRows(raw);
    expect(result[0].fields).toEqual({ "제목": "테스트" });
  });

  it("메뉴경로가 없으면 에러를 포함한다", () => {
    const raw: RawRow[] = [
      { "프로젝트명": "3월 리뷰" } as RawRow,
    ];
    const result = normalizeRows(raw);
    expect(result[0].error).toBe("메뉴경로가 비어 있습니다");
  });
});
