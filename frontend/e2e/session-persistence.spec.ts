import { chromium, expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('같은 브라우저를 다시 열면 내 대시보드로 돌아오고 로그아웃 후에는 로그인 화면이 열린다', async ({}, info) => {
  const profile = info.outputPath('browser-profile');
  const options = { baseURL: 'http://localhost:3000' };
  const loginId = 'u_' + randomUUID().slice(0, 8);
  const password = 'test-only-password!23';
  const nickname = '재방문 학습자';
  let context = await chromium.launchPersistentContext(profile, options);
  try {
    const request = context.request;
    const csrfHeaders = async () => {
      const csrf = await (await request.get('/api/auth/csrf')).json();
      return { [csrf.headerName]: csrf.token };
    };
    expect((await request.post('/api/auth/signup', {
      headers: await csrfHeaders(), data: { loginId, password, nickname },
    })).status()).toBe(201);
    expect((await request.post('/api/auth/login', {
      headers: await csrfHeaders(), form: { loginId, password },
    })).status()).toBe(204);
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByText(nickname + '님의 학습 공간', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '로그아웃', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    const signedOut = await context.newPage();
    await signedOut.goto('/');
    await expect(signedOut).toHaveURL(/\/login$/);
  } finally {
    await context.close();
  }
});
