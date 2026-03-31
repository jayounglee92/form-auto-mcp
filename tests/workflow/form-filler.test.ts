import { describe, it, expect } from "vitest";
import { buildFillActions } from "../../src/workflow/form-filler";

describe("buildFillActions", () => {
  it("필드 맵을 fill 액션 배열로 변환한다", () => {
    const fields = { "프로젝트명": "3월 리뷰", "설명": "주간보고" };
    const actions = buildFillActions(fields);
    expect(actions).toEqual([
      { label: "프로젝트명", value: "3월 리뷰" },
      { label: "설명", value: "주간보고" },
    ]);
  });

  it("빈 필드맵이면 빈 배열을 반환한다", () => {
    const actions = buildFillActions({});
    expect(actions).toEqual([]);
  });
});
