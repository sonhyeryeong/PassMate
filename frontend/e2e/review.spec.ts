import { expect, test, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const api = 'http://localhost:18080/api';

async function post(request: APIRequestContext, path: string, data: unknown) {
  const response = await request.post(`${api}${path}`, { data });
  expect(response.status()).toBe(201);
  return response.json();
}

async function seed(request: APIRequestContext) {
  const user = await post(request, '/users', { email: `${randomUUID()}@example.com`, nickname: '복습 테스트' });
  const folder = await post(request, `/decks?userId=${user.id}`, { name: '검증 폴더' });
  const section = await post(request, `/decks/${folder.id}/categories`, { name: '기본 섹션', sortOrder: 0 });
  const first = await post(request, `/categories/${section.id}/materials/with-cards`, {
    title: '첫 번째 세트', cards: [{ front: '첫 번째 질문', back: '첫 번째 답변' }],
  });
  const second = await post(request, `/categories/${section.id}/materials/with-cards`, {
    title: '두 번째 세트', cards: [{ front: '두 번째 질문', back: '두 번째 답변' }],
  });
  return { user, folder, first, second };
}

test('세트에서 시작해 AGAIN을 저장하면 이번 복습을 완료하고 전체 복습에는 다른 세트가 남는다', async ({ page, request }) => {
  const { user, folder, first, second } = await seed(request);
  await page.addInitScript((id) => localStorage.setItem('passmate.selectedUser', String(id)), user.id);
  await page.goto(`/folder/${folder.id}/set/${first.material.id}`);
  await page.getByRole('link', { name: '복습 시작', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/review\\?materialId=${first.material.id}$`));
  await expect(page.getByRole('heading', { name: '첫 번째 질문', exact: true })).toBeVisible();
  await expect(page.getByText('두 번째 질문', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '뒷면 보기' }).click();
  await expect(page.getByText('첫 번째 답변', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '다시 곧 다시 볼 카드' }).click();
  await expect(page.getByRole('heading', { name: '이번 복습을 마쳤습니다' })).toBeVisible();
  await expect(page.getByText(/10분 뒤 복습 목록을 새로 열면/)).toBeVisible();

  const history = await (await request.get(`${api}/reviews/users/${user.id}/history`)).json();
  expect(history.items).toHaveLength(1);
  expect(history.items[0]).toMatchObject({ flashCardId: first.cards[0].id, result: 'AGAIN' });
  const stored = await (await request.get(`${api}/materials/${first.material.id}/cards/${first.cards[0].id}`)).json();
  expect(new Date(stored.nextReviewAt).getTime() - new Date(history.items[0].reviewedAt).getTime()).toBe(600_000);

  await page.goto(`/review?materialId=${first.material.id}`);
  await expect(page.getByRole('heading', { name: '이 학습 세트에 지금 복습할 카드가 없습니다' })).toBeVisible();
  await page.goto('/review');
  await expect(page.getByRole('heading', { name: second.cards[0].front, exact: true })).toBeVisible();
  await expect(page.getByText(first.cards[0].front, { exact: true })).toHaveCount(0);
});

test('다른 프로필의 세트와 잘못된 세트 주소는 전체 복습으로 대체하지 않는다', async ({ page, request }) => {
  const owner = await seed(request);
  const other = await seed(request);
  await page.addInitScript((id) => localStorage.setItem('passmate.selectedUser', String(id)), other.user.id);
  await page.goto(`/review?materialId=${owner.first.material.id}`);
  await expect(page.getByRole('heading', { name: '복습을 시작할 수 없습니다' })).toBeVisible();
  await expect(page.getByText('학습 세트를 찾을 수 없습니다.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '뒷면 보기' })).toHaveCount(0);

  await page.goto('/review?materialId=invalid');
  await expect(page.getByText('올바르지 않은 학습 세트 주소입니다.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '뒷면 보기' })).toHaveCount(0);
});

test('카드 삭제 확인 후 관련 기록도 사라지고 다른 세트는 유지된다', async ({ page, request }) => {
  const { user, folder, first, second } = await seed(request);
  await post(request, `/reviews/cards/${first.cards[0].id}?userId=${user.id}`, { result: 'GOOD' });
  await page.addInitScript((id) => localStorage.setItem('passmate.selectedUser', String(id)), user.id);
  await page.goto(`/folder/${folder.id}/set/${first.material.id}`);
  await page.getByRole('checkbox', { name: '카드 1 선택', exact: true }).check();
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('삭제한 카드와 관련 복습 기록은 복구할 수 없습니다.')).toBeVisible();
  await dialog.getByRole('button', { name: '삭제', exact: true }).click();
  await expect(page.getByText('1장의 카드와 관련 복습 기록을 삭제했습니다.', { exact: true })).toBeVisible();
  expect((await request.get(`${api}/materials/${first.material.id}/cards/${first.cards[0].id}`)).status()).toBe(404);
  const history = await (await request.get(`${api}/reviews/users/${user.id}/history`)).json();
  expect(history.items).toHaveLength(0);
  expect((await request.get(`${api}/materials/${second.material.id}/cards/${second.cards[0].id}`)).status()).toBe(200);
});

test('범위 전환 전의 늦은 제출 응답이 새 복습을 완료시키지 않는다', async ({ page, request }) => {
  const { user, first, second } = await seed(request);
  await page.addInitScript((id) => localStorage.setItem('passmate.selectedUser', String(id)), user.id);
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => { releaseResponse = resolve; });
  let markStored!: () => void;
  const stored = new Promise<void>((resolve) => { markStored = resolve; });
  await page.route(`**/reviews/cards/${first.cards[0].id}?userId=${user.id}`, async (route) => {
    const response = await route.fetch();
    markStored();
    await responseGate;
    await route.fulfill({ response });
  });

  await page.goto(`/review?materialId=${first.material.id}`);
  await page.getByRole('button', { name: '뒷면 보기' }).click();
  await page.getByRole('button', { name: '다시 곧 다시 볼 카드' }).click();
  await stored;
  // 실제 메뉴 이동으로 컴포넌트를 유지한 채 쿼리 범위를 바꾼다.
  await page.getByRole('complementary', { name: '주요 메뉴' }).getByRole('link', { name: '복습', exact: true }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByRole('heading', { name: second.cards[0].front, exact: true })).toBeVisible();

  const oldResponse = page.waitForResponse((response) => response.url().includes(`/reviews/cards/${first.cards[0].id}?`));
  releaseResponse();
  await oldResponse;
  // 새 카드의 실제 학습을 이어가 이전 응답 처리 뒤에도 세션이 유효한지 확인한다.
  await page.getByRole('button', { name: '뒷면 보기' }).click();
  await expect(page.getByText(second.cards[0].back, { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '이번 복습을 마쳤습니다' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '좋음 잘 기억한 카드' })).toBeEnabled();
});
