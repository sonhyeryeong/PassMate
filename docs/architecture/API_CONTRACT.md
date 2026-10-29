# PassMate MVP1 API 계약

> **책임:** API 경로·입출력·권한. 공통 응답 규약은 [API_STYLE.md](../../API_STYLE.md), 데이터 의미는 [DATA_MODEL.md](DATA_MODEL.md)를 따른다.

## 목적

이 문서는 PassMate MVP1의 주요 API를 정의한다.

상세 응답 형식과 에러 형식은 `API_STYLE.md`를 따른다.

## 사용자 용어와 API 이름

MVP1에서는 기존 API 경로와 내부 도메인 이름을 유지할 수 있다.

사용자 화면에서는 아래 용어를 사용한다.

```text
Deck      → 폴더
Category  → 기본 섹션 또는 내부 분류
Material  → 학습 세트
FlashCard → 카드
```

즉, 화면의 "폴더"는 내부적으로 Deck API를 사용할 수 있고, 화면의 "학습 세트"는 내부적으로 Material API를 사용할 수 있다.

Category는 사용자 필수 단계로 노출하지 않는다. 프론트엔드 또는 백엔드는 폴더별 기본 Category를 사용해 학습 세트를 생성할 수 있다.

## Deck API

```text
GET    /api/decks
POST   /api/decks
GET    /api/decks/{deckId}
PATCH  /api/decks/{deckId}
DELETE /api/decks/{deckId}
```

## Category API

```text
GET    /api/decks/{deckId}/categories
POST   /api/decks/{deckId}/categories
PATCH  /api/categories/{categoryId}
DELETE /api/categories/{categoryId}
```

## Material API

```text
GET    /api/categories/{categoryId}/materials
POST   /api/categories/{categoryId}/materials
GET    /api/materials/{materialId}
PATCH  /api/materials/{materialId}
DELETE /api/materials/{materialId}
```

## FlashCard API

```text
GET    /api/materials/{materialId}/cards
POST   /api/materials/{materialId}/cards
GET    /api/cards/{cardId}
PATCH  /api/cards/{cardId}
DELETE /api/cards/{cardId}
```

## Review API

```text
GET  /api/reviews/today
POST /api/cards/{cardId}/reviews
GET  /api/reviews/history
```

## 확정: 복습 범위 필터와 영구 삭제 계약 (2026-10-29)

현재 구현의 복습 조회 경로를 유지하고 선택적인 `materialId` 필터를 추가한다.

```text
GET /api/reviews/users/{userId}/today?materialId={materialId}
```

- `materialId` 생략 시 기존 사용자 전체 기한 카드 조회를 유지한다.
- 지정 시 해당 학습 세트의 기한 카드만 반환하며 기존 `items`, `reviewDate` 응답 구조를 유지한다.
- 기한 기준은 기존 `date` 파라미터(생략 시 서버 현재 시각)를 유지한다. 해당 시각 이하의 `nextReviewAt`을 포함하고 정렬은 `nextReviewAt`, 카드 ID 오름차순을 유지한다.
- 세트 존재 여부와 폴더까지의 사용자 소유 관계를 확인한다. 없거나 소유하지 않은 세트는 404로 처리한다. 정상 소유 세트에 기한 카드가 없으면 빈 `items`를 반환한다.
- 결과 제출 API와 네 단계 일정 정책은 변경하지 않는다. 인증 도입을 이번 변경에 포함하지 않으며 로컬 프로필 ID 방식의 소유 관계 확인과 로그인 인증을 구분한다.
- 삭제 API는 기존 경로·응답 형식을 유지하며 [데이터 설계의 영구 삭제 정책](DATA_MODEL.md#확정-영구-삭제와-복습-기록-2026-10-29)을 적용한다. 로컬 프로필 기준 소유 관계 확인을 위해 모든 삭제 요청에 `userId` 쿼리가 필요하다. 카드·학습 세트·섹션 삭제 호출자는 이번 변경부터 이 값을 전달해야 한다. 생략하면 400, 대상이 없거나 소유 관계·부모 경로가 맞지 않으면 404이며 성공 시 204이다.

```text
DELETE /api/materials/{materialId}/cards/{cardId}?userId={userId}
DELETE /api/categories/{categoryId}/materials/{materialId}?userId={userId}
DELETE /api/decks/{deckId}/categories/{categoryId}?userId={userId}
DELETE /api/decks/{deckId}?userId={userId}
```

- 구현 상태: `materialId` 필터와 상위 리소스 삭제의 하위 정리를 구현했다. 위의 이전 Review API 경로 예시는 현재 컨트롤러와 차이가 있으며 이번 변경에서 경로를 대규모 개편하지 않는다.

## User API

MVP1에서는 최소 사용자 정보만 다룬다.

```text
GET /api/users/me
```

## Review History API

사용자의 복습 기록 화면은 카드, 학습 세트, 폴더 정보를 추가 요청 없이 표시할 수 있는 전용 조회 API를 사용한다.

```text
GET /api/reviews/users/{userId}/history
```

```json
{
  "items": [
    {
      "id": 31,
      "flashCardId": 12,
      "cardFront": "제1정규형이란?",
      "materialId": 7,
      "materialTitle": "데이터베이스 정규화",
      "deckId": 3,
      "deckName": "정보처리기사",
      "result": "GOOD",
      "reviewedAt": "2026-07-27T19:20:00"
    }
  ]
}
```

- 최신 복습 기록부터 최대 100건을 반환한다.
- ReviewHistory의 `userId`와 카드가 속한 폴더의 `userId`를 함께 확인한다.
- 화면에서 폴더와 학습 세트 필터에 사용할 식별자와 이름을 포함한다.

## Dashboard API

대시보드는 화면에서 여러 도메인 API를 직접 조합하지 않고 전용 집계 API를 사용한다.

MVP1의 로컬 프로필 방식에서는 `userId`를 전달한다.

```text
GET /api/dashboard?userId={userId}
```

응답은 사용자 요약, 전체 학습 요약, 학습 방식별 진입 큐를 포함한다.

```json
{
  "user": {
    "id": 1,
    "nickname": "수진"
  },
  "summary": {
    "pendingLearningCount": 12,
    "completedTodayCount": 5,
    "folderCount": 3
  },
  "learningQueues": [
    {
      "type": "FLASH_CARD_REVIEW",
      "pendingCount": 12,
      "completedTodayCount": 5
    }
  ],
  "calculatedAt": "2026-07-26T14:30:00"
}
```

- `DashboardService`는 학습 방식별 요약 결과를 합산한다.
- 각 학습 방식은 공통 학습 큐 요약 계약으로 대시보드에 진입 정보를 제공한다.
- FlashCard, ReviewHistory 같은 실제 학습 데이터 구조를 범용 Entity로 합치지 않는다.
- 새로운 학습 방식은 독립 도메인을 유지하고 대시보드 요약 제공자만 추가한다.

## 권한 원칙

- 모든 사용자 소유 리소스는 현재 사용자 기준으로 접근 권한을 확인한다.
- Deck 접근 시 Deck의 userId를 확인한다.
- Category, Material, FlashCard는 상위 리소스를 통해 사용자 소유 여부를 확인한다.
- ReviewHistory는 userId와 flashCard 소유 관계를 함께 고려한다.

## 응답 원칙

- Entity를 직접 반환하지 않는다.
- 목록 응답은 필요하면 `items`로 감싼다.
- 페이지네이션이 필요한 목록은 페이지 정보를 포함한다.
- 에러 응답은 `API_STYLE.md` 형식을 따른다.

## MVP1에서 제외되는 API

아래 API는 MVP1에서 만들지 않는다.

- PDF 업로드 API
- OCR API
- AI 카드 생성 API
- AI 설명 API
- Quiz API
- 결제 API
- 공유 Deck API

## 구현 확인 사항 (2026-10-29)

- 복습 API 서비스는 카드 소유권을 확인한 뒤 결과를 기록하고 `nextReviewAt`을 갱신한다.
- 전체 복습은 `/review`, 학습 세트의 `복습 시작`은 `/review?materialId={setId}`로 이동한다. API의 선택적 `materialId` 필터와 세트 소유 관계를 검증했다.
- 이 문서의 예시 응답과 실제 컨트롤러·DTO 계약이 다를 경우 실제 코드를 우선 파악하고 차이를 보고한 뒤 문서를 수정한다.
