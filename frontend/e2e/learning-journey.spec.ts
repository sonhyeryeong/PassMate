import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { randomUUID } from 'node:crypto';

async function expectNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `페이지 가로 넘침: ${page.url()}`).toBeLessThanOrEqual(1);
}

async function startFromScreen(page: Page) {
  const suffix = randomUUID().slice(0, 8);
  const nickname = `학습자-${suffix}`;
  const folder = `학습 폴더-${suffix}`;
  const title = `네트워크-${suffix}`;
  await page.goto('/signup');
  await page.getByLabel('아이디', { exact: true }).fill(`u_${suffix}`);
  await page.getByLabel('닉네임', { exact: true }).fill(nickname);
  await page.getByLabel('비밀번호', { exact: true }).fill('test-only-password!23');
  await page.getByLabel('비밀번호 확인', { exact: true }).fill('test-only-password!23');
  await page.getByRole('button', { name: '가입하기', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('아이디', { exact: true }).fill(`u_${suffix}`);
  await page.getByLabel('비밀번호', { exact: true }).fill('test-only-password!23');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('heading', { name: '대시보드', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(`${nickname}님의 학습 공간`, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: '폴더', exact: true }).click();
  await page.getByRole('button', { name: '폴더 만들기', exact: true }).click();
  await expect(page.getByText('폴더 이름을 입력해 주세요.', { exact: true })).toBeVisible();
  await page.getByLabel('폴더 이름', { exact: true }).fill(folder);
  await page.getByRole('button', { name: '폴더 만들기', exact: true }).click();
  await page.getByRole('link', { name: new RegExp(folder) }).click();
  await page.getByRole('link', { name: '학습 세트 만들기', exact: true }).first().click();
  return { title, folder };
}

async function learningJourney(page: Page, info: TestInfo, checkMobile: boolean) {
  const { title, folder } = await startFromScreen(page);
  const save = page.getByRole('button', { name: '학습 세트 저장' });
  await save.click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('학습 세트 제목을 입력해 주세요.');
  await page.getByLabel('학습 세트 제목', { exact: true }).fill(title);
  await save.click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('최소 1개의 카드를 입력해 주세요.');
  const question = `HTTP_${'Q'.repeat(100)}`;
  await page.getByLabel('1번 카드 앞면', { exact: true }).fill(question);
  await save.click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('카드의 앞면과 뒷면을 모두 입력해 주세요.');
  await page.getByLabel('1번 카드 뒷면', { exact: true }).fill(`응답_${'A'.repeat(100)}`);
  await page.getByLabel('2번 카드 앞면', { exact: true }).fill('HTTP 404란?');
  await page.getByLabel('2번 카드 뒷면', { exact: true }).fill('요청한 리소스를 찾을 수 없음');
  if (checkMobile) await expectNoPageOverflow(page);

  await page.route('**/categories/*/materials/with-cards', (route) => route.fulfill({
    status: 500, contentType: 'application/json',
    body: JSON.stringify({ code: 'INTERNAL_SERVER_ERROR', message: '저장하지 못했습니다. 다시 시도해 주세요.' }),
  }), { times: 1 });
  await save.click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('저장하지 못했습니다. 다시 시도해 주세요.');
  await expect(page.getByLabel('학습 세트 제목', { exact: true })).toHaveValue(title);
  await expect(page.getByLabel('1번 카드 앞면', { exact: true })).toHaveValue(question);
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page).toHaveURL(/\/folder\/\d+\/set\/\d+$/);
  const detailUrl = page.url();
  await expect(page.getByRole('heading', { name: title, exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('cell', { name: question, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('cell', { name: question, exact: true })).toBeVisible();
  if (checkMobile) await expectNoPageOverflow(page);
  await page.getByRole('link', { name: '복습 시작', exact: true }).click();
  await expect(page.getByRole('heading', { name: question, exact: true })).toBeVisible();
  await page.getByRole('button', { name: '뒷면 보기' }).click();
  if (checkMobile) {
    await expectNoPageOverflow(page);
    await page.screenshot({ path: info.outputPath('mobile-review.png'), fullPage: true });
  }

  await page.route('**/reviews/cards/*', (route) => route.fulfill({
    status: 500, contentType: 'application/json',
    body: JSON.stringify({ code: 'INTERNAL_SERVER_ERROR', message: '복습 결과를 저장하지 못했습니다.' }),
  }), { times: 1 });
  await page.getByRole('button', { name: '좋음 잘 기억한 카드' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('복습 결과를 저장하지 못했습니다.');
  await expect(page.getByRole('heading', { name: question, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '좋음 잘 기억한 카드' })).toBeEnabled();
  await page.getByRole('button', { name: '좋음 잘 기억한 카드' }).click();
  await expect(page.getByRole('heading', { name: 'HTTP 404란?', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'HTTP 404란?', exact: true })).toBeVisible();
  await expect(page.getByText(question, { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '뒷면 보기' }).click();
  await page.getByRole('button', { name: '쉬움 아주 쉬운 카드' }).click();
  await expect(page.getByRole('heading', { name: '이번 복습을 마쳤습니다' })).toBeVisible();
  await page.getByRole('link', { name: '복습 기록', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: question })).toHaveCount(1);
  await expect(page.getByRole('row').filter({ hasText: 'HTTP 404란?' })).toContainText('쉬움');
  await page.getByRole('combobox', { name: '폴더', exact: true }).selectOption({ label: folder });
  await page.getByRole('combobox', { name: '학습 세트', exact: true }).selectOption({ label: title });
  await expect(page.getByRole('row')).toHaveCount(3);
  await page.reload();
  await expect(page.getByRole('row')).toHaveCount(3);
  if (checkMobile) {
    await expectNoPageOverflow(page);
    const result = page.getByRole('cell', { name: '좋음', exact: true });
    await result.scrollIntoViewIfNeeded();
    await expect(result).toBeInViewport();
    await page.screenshot({ path: info.outputPath('mobile-history.png'), fullPage: true });
  }
  await page.goto(detailUrl);
  await page.getByRole('link', { name: '복습 시작', exact: true }).click();
  await expect(page.getByRole('heading', { name: '이 학습 세트에 지금 복습할 카드가 없습니다' })).toBeVisible();
  await page.getByRole('button', { name: '로그아웃', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.evaluate(() => localStorage.setItem('userId', '1'));
  await page.goto('/folder');
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get('/api/users/me')).status()).toBe(401);

}

test('화면에서 생성부터 복습 기록까지 입력 오류·실패 재시도·새로고침을 검증한다', async ({ page }, info) => {
  test.setTimeout(60_000);
  await learningJourney(page, info, false);
});

test.describe('모바일 Chromium', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('같은 학습 흐름과 긴 카드 내용이 화면 밖으로 넘치지 않는다', async ({ page }, info) => {
    test.setTimeout(60_000);
    await learningJourney(page, info, true);
  });
});
