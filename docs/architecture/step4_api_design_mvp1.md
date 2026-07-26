# Step 4. PassMate MVP1 API 설계

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

## User API

MVP1에서는 최소 사용자 정보만 다룬다.

```text
GET /api/users/me
```

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
