import { expect, test } from '@playwright/test';

test('Google 로그인 취소 후 일반 로그인과 재시도 링크가 보인다', async ({ page }) => {
  await page.route('**/api/auth/google', route => route.fulfill({ json: { enabled: true } }));
  await page.route('**/api/oauth2/authorization/google', route => route.fulfill({
    status: 302, headers: { Location: '/login?google=failed' },
  }));
  await page.goto('/login');
  await page.getByRole('link', { name: 'Google로 로그인' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Google 로그인을 완료하지 못했습니다');
  await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Google로 로그인' })).toBeVisible();
});

test('인증 없이 닉네임 페이지에 직접 들어가면 가입할 수 없다', async ({ page }) => {
  await page.goto('/signup/google');
  await page.getByLabel('닉네임').fill('테스트 학습자');
  await page.getByRole('button', { name: '학습 시작' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Google 로그인을 사용할 수 없습니다');
  expect((await page.request.get('/api/users/me')).status()).toBe(401);
  await page.getByRole('link', { name: '로그인으로 돌아가기' }).click();
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Google로 로그인' })).toHaveCount(0);
});
