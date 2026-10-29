# PassMate MVP1 데이터 모델

> **책임:** 엔티티 관계, 필드, 복습 상태와 이력. 제품 목적은 [제품 비전](../PRODUCT_VISION.md)을 따른다.

## 목적

이 문서는 PassMate MVP1의 핵심 데이터 모델과 관계를 정의한다.

구현 시 Entity, Repository, API 응답 설계의 기준으로 사용한다.

## 핵심 엔티티

MVP1의 핵심 엔티티는 다음과 같다.

- User
- Deck
- Category
- Material
- FlashCard
- ReviewHistory

## 사용자 용어 매핑

MVP1에서는 기존 엔티티 이름을 유지하되, 사용자 화면에서는 더 쉬운 용어를 사용한다.

```text
Deck      → 폴더
Category  → 기본 섹션 또는 내부 분류
Material  → 학습 세트
FlashCard → 카드
```

Category는 사용자에게 필수 생성 단계로 노출하지 않는다. 폴더 안의 학습 세트를 담기 위한 기본 섹션으로 자동 생성하거나 내부 분류로 처리할 수 있다.

## 관계 요약

```text
User 1 ─ N Deck
Deck 1 ─ N Category
Category 1 ─ N Material
Material 1 ─ N FlashCard
FlashCard 1 ─ N ReviewHistory
User 1 ─ N ReviewHistory
```

## User

사용자 계정이다.

주요 필드:

- id
- email
- nickname
- createdAt
- updatedAt

## Deck

학습 주제의 최상위 단위이다.

주요 필드:

- id
- userId
- name
- description
- createdAt
- updatedAt

관계:

- User는 여러 Deck을 가진다.
- Deck은 하나의 User에 속한다.

## Category

Deck 안의 학습 분류이다.

주요 필드:

- id
- deckId
- name
- sortOrder
- createdAt
- updatedAt

관계:

- Deck은 여러 Category를 가진다.
- Category는 하나의 Deck에 속한다.

## Material

학습 원본 자료이다.

주요 필드:

- id
- categoryId
- title
- content
- createdAt
- updatedAt

관계:

- Category는 여러 Material을 가진다.
- Material은 하나의 Category에 속한다.

## FlashCard

Material에서 파생되는 학습 카드이다.

주요 필드:

- id
- materialId
- front
- back
- nextReviewAt
- createdAt
- updatedAt

관계:

- Material은 여러 FlashCard를 가진다.
- FlashCard는 하나의 Material에 속한다.

## ReviewHistory

FlashCard 복습 기록이다.

주요 필드:

- id
- userId
- flashCardId
- result
- reviewedAt
- createdAt

관계:

- FlashCard는 여러 ReviewHistory를 가진다.
- User는 여러 ReviewHistory를 가진다.

## Review Result

MVP1에서는 단순한 복습 결과를 사용한다.

예시:

- AGAIN
- HARD
- GOOD
- EASY

## 설계 주의사항

- FlashCard는 Material에서 파생되는 데이터이다.
- Material 없이 FlashCard를 독립 생성하는 흐름은 기본으로 두지 않는다.
- 사용자 화면에서는 Material을 학습 세트로 표현하고, 학습 세트 안에서 여러 FlashCard를 빠르게 생성하는 UX를 우선한다.
- 사용자 화면에서는 Category 생성 단계를 필수 흐름으로 만들지 않는다.
- ReviewHistory는 일반 복습 및 알고리즘 변경 시 보존한다. 사용자가 명시적으로 영구 삭제한 학습 데이터의 기록은 아래 삭제 정책에 따라 함께 삭제한다.
- 사용자 소유 데이터 접근 시 User 기준 권한 확인이 필요하다.

## 현재 구현과 복습 정책 (코드 확인: 2026-10-29)

- `FlashCard.nextReviewAt`은 새 카드 생성 시 현재 시각으로 초기화된다.
- `ReviewService.createReview`는 `ReviewHistory` 저장과 `nextReviewAt` 갱신을 하나의 트랜잭션에서 처리한다.
- 현재 고정 간격: `AGAIN` 10분, `HARD` 1일, `GOOD` 3일, `EASY` 7일 후. 이는 **MVP1 임시 정책**이며 개인화된 망각곡선 알고리즘이 아니다.
- 현재 카드의 상태는 `nextReviewAt` 위주이며, 복습 이력은 `ReviewHistory`에 축적된다. 적응형 복습 도입 시 상태 필드와 알고리즘 변경·마이그레이션을 별도 설계한다.
- **확정 동작:** `AGAIN` 10분 후 카드가 같은 복습 세션에서 자동 재등장하지는 않는다. 현재 프론트엔드는 진입 시 받은 카드 목록을 순서대로 처리한다.
## 확정: 영구 삭제와 복습 기록 (2026-10-29)

- 사용자 승인: 폴더·기본 섹션·학습 세트·카드의 영구 삭제 시 대상 하위 데이터와 관련 ReviewHistory를 함께 삭제한다. 삭제 후 복구하거나 복습 통계에 유지하지 않는다.
- 삭제 순서는 관련 ReviewHistory → FlashCard → Material → Category → Deck이며, 선택한 대상의 하위 범위에만 적용한다.
- 각 삭제 요청은 하나의 트랜잭션으로 처리한다. 중간 실패 시 이미 처리한 삭제도 롤백되어야 한다.
- 요청자의 소유 관계를 확인한 후 삭제한다. 다른 사용자의 데이터는 삭제하지 않는다.
- 복습 알고리즘·일정 정책 변경은 삭제 사유가 아니며 기존 기록을 초기화하지 않는다.
- MVP1에서는 보관/소프트 삭제와 복구 기능을 도입하지 않는다.
- 구현 상태: 카드·학습 세트·기본 섹션·폴더 삭제 모두 하위 데이터와 관련 기록을 같은 트랜잭션에서 정리한다. 삭제 요청의 프로필 ID와 부모 경로가 대상의 소유 관계에 맞지 않으면 삭제하지 않는다. 이는 로컬 프로필 기준 확인이며 로그인 인증을 의미하지 않는다.
