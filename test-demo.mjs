import { chromium } from 'playwright';

(async () => {
  console.log('🚀 브라우저를 실행합니다...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();

  // 광고 차단
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('googleads') || url.includes('adservice') || url.includes('doubleclick') || url.includes('ad.plus')) {
      return route.abort();
    }
    return route.continue();
  });

  const page = await context.newPage();

  // 1. demoqa.com/elements 접속
  console.log('[1/6] demoqa.com 접속 중...');
  await page.goto('https://demoqa.com/elements');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 2. 사이드 메뉴에서 "Text Box" 클릭
  console.log('[2/6] 사이드 메뉴 → Text Box 클릭');
  await page.locator('.left-pannel span.text').filter({ hasText: 'Text Box' }).click({ force: true });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 3. 폼 입력
  console.log('[3/6] 폼 입력 중...');
  const fields = {
    userName: '홍길동',
    userEmail: 'hong@example.com',
    currentAddress: '서울시 강남구 테헤란로 123',
    permanentAddress: '서울시 서초구 반포대로 456',
  };

  for (const [id, value] of Object.entries(fields)) {
    await page.locator(`#${id}`).fill(value);
    console.log(`  ✅ ${id} → "${value}"`);
  }

  // 4. 스크롤 다운 + Submit 클릭
  console.log('[4/6] Submit 버튼 클릭');
  await page.locator('button#submit').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.locator('button#submit').click({ force: true });
  await page.waitForTimeout(1500);

  // 5. 결과 확인
  console.log('[5/6] 결과 확인');
  const output = await page.locator('#output').textContent();
  console.log('  결과:', output);

  // 6. 스크린샷
  await page.screenshot({ path: 'test-result.png', fullPage: true });
  console.log('[6/6] 스크린샷 저장: test-result.png');

  console.log('\n✅ 완료! 10초 후 브라우저를 닫습니다...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
