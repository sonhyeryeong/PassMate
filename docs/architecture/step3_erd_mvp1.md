# Step 3. PassMate MVP1 ERD

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
- ReviewHistory는 삭제보다 보존을 우선한다.
- 사용자 소유 데이터 접근 시 User 기준 권한 확인이 필요하다.

