import { describe, it, expect } from "vitest";
import { buildNavigationSteps } from "../../src/workflow/navigator";

describe("buildNavigationSteps", () => {
  it("메뉴 경로를 클릭 스텝으로 변환한다", () => {
    const steps = buildNavigationSteps(["프로젝트", "일정관리"]);
    expect(steps).toEqual([
      { action: "click", text: "프로젝트" },
      { action: "click", text: "일정관리" },
      { action: "waitForNavigation" },
    ]);
  });

  it("단일 메뉴도 처리한다", () => {
    const steps = buildNavigationSteps(["대시보드"]);
    expect(steps).toEqual([
      { action: "click", text: "대시보드" },
      { action: "waitForNavigation" },
    ]);
  });
});
