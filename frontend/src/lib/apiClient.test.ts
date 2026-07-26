import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { ApiError, getErrorMessage, request } from './apiClient.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('백엔드 오류 응답의 상태, 코드, 메시지를 전달한다', async () => {
  globalThis.fetch = async () => new Response(
    JSON.stringify({
      code: 'DECK_NOT_FOUND',
      message: '폴더를 찾을 수 없습니다.',
    }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    },
  );

  await assert.rejects(
    request('/decks/999'),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      assert.equal(error.code, 'DECK_NOT_FOUND');
      assert.equal(error.message, '폴더를 찾을 수 없습니다.');
      return true;
    },
  );
});

test('오류 본문을 읽을 수 없으면 상태 코드별 안내를 사용한다', async () => {
  globalThis.fetch = async () => new Response('not-json', { status: 404 });

  await assert.rejects(
    request('/decks/999'),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      assert.equal(error.code, 'HTTP_404');
      assert.equal(error.message, '요청한 정보를 찾을 수 없습니다.');
      return true;
    },
  );
});

test('오류 코드와 메시지가 비어 있으면 상태 코드별 안내를 사용한다', async () => {
  globalThis.fetch = async () => new Response(
    JSON.stringify({ code: '', message: '  ' }),
    {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    },
  );

  await assert.rejects(
    request('/users'),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, 'HTTP_409');
      assert.equal(error.message, '이미 존재하거나 현재 상태와 충돌하는 정보입니다.');
      return true;
    },
  );
});

test('서버에 연결할 수 없으면 네트워크 오류로 변환한다', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };

  await assert.rejects(
    request('/dashboard'),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 0);
      assert.equal(error.code, 'NETWORK_ERROR');
      assert.equal(
        error.message,
        '백엔드 서버에 연결하지 못했습니다. 서버가 실행 중인지 확인해 주세요.',
      );
      return true;
    },
  );
});

test('Headers 객체로 전달한 헤더를 보존하고 문자열 본문에 JSON Content-Type을 추가한다', async () => {
  let receivedHeaders: Headers | undefined;

  globalThis.fetch = async (_input, init) => {
    receivedHeaders = new Headers(init?.headers);
    return Response.json({ id: 1 });
  };

  await request('/users', {
    headers: new Headers({ Authorization: 'Bearer test-token' }),
    body: JSON.stringify({ nickname: '수진' }),
    method: 'POST',
  });

  assert.equal(receivedHeaders?.get('Authorization'), 'Bearer test-token');
  assert.equal(receivedHeaders?.get('Content-Type'), 'application/json');
});

test('FormData 본문에는 Content-Type을 강제로 지정하지 않는다', async () => {
  let receivedHeaders: Headers | undefined;

  globalThis.fetch = async (_input, init) => {
    receivedHeaders = new Headers(init?.headers);
    return Response.json({ id: 1 });
  };

  const body = new FormData();
  body.set('file', new Blob(['content']), 'material.txt');

  await request('/materials', { body, method: 'POST' });

  assert.equal(receivedHeaders?.has('Content-Type'), false);
});

test('호출자가 지정한 Content-Type을 덮어쓰지 않는다', async () => {
  let receivedHeaders: Headers | undefined;

  globalThis.fetch = async (_input, init) => {
    receivedHeaders = new Headers(init?.headers);
    return Response.json({ id: 1 });
  };

  await request('/users', {
    headers: { 'Content-Type': 'application/merge-patch+json' },
  });

  assert.equal(receivedHeaders?.get('Content-Type'), 'application/merge-patch+json');
});

test('성공 응답이 JSON이 아니면 잘못된 응답으로 변환한다', async () => {
  globalThis.fetch = async () => new Response('not-json', { status: 200 });

  await assert.rejects(
    request('/dashboard'),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 200);
      assert.equal(error.code, 'INVALID_RESPONSE');
      return true;
    },
  );
});

test('본문이 없는 성공 응답은 undefined를 반환한다', async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });

  assert.equal(await request('/decks/1', { method: 'DELETE' }), undefined);
});

test('알 수 없는 오류에는 화면별 기본 메시지를 사용한다', () => {
  assert.equal(
    getErrorMessage(new Error('unexpected'), '학습 현황을 불러오지 못했습니다.'),
    '학습 현황을 불러오지 못했습니다.',
  );
});
