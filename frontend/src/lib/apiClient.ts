const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      '백엔드 서버에 연결하지 못했습니다. 서버가 실행 중인지 확인해 주세요.',
    );
  }

  if (!response.ok) {
    const errorResponse = await readErrorResponse(response);
    throw new ApiError(
      response.status,
      errorResponse?.code ?? `HTTP_${response.status}`,
      errorResponse?.message ?? getFallbackMessage(response.status),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return await response.json() as T;
  } catch {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      '서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );
  }
}

export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof ApiError ? error.message : fallbackMessage;
}

async function readErrorResponse(response: Response): Promise<ApiErrorResponse | null> {
  try {
    return await response.json() as ApiErrorResponse;
  } catch {
    return null;
  }
}

function getFallbackMessage(status: number): string {
  if (status === 404) {
    return '요청한 정보를 찾을 수 없습니다.';
  }
  if (status === 409) {
    return '이미 존재하거나 현재 상태와 충돌하는 정보입니다.';
  }
  if (status >= 500) {
    return '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }
  return '요청을 처리하지 못했습니다. 입력값을 확인해 주세요.';
}
