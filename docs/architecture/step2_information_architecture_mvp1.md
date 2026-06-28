# Step 2. PassMate MVP1 정보 구조

## 목적

이 문서는 PassMate MVP1의 화면, 메뉴, 도메인 정보 구조를 정의한다.

프론트엔드 라우팅, 백엔드 API, 데이터 모델 설계의 기준으로 사용한다.

## 최상위 정보 구조

```text
PassMate
  ├─ Deck
  │   └─ Category
  │       └─ Material
  │           └─ FlashCard
  ├─ Review
  │   └─ ReviewHistory
  └─ MyPage
```

## 주요 메뉴

MVP1의 주요 메뉴는 다음과 같다.

- Deck
- Review
- MyPage

Material과 FlashCard는 독립 메뉴가 아니라 Deck과 Category 흐름 안에서 접근하는 것을 기본으로 한다.

## Deck

Deck은 사용자가 학습 주제를 관리하는 최상위 단위이다.

Deck에서 할 수 있는 일:

- Deck 목록 조회
- Deck 생성
- Deck 상세 조회
- Deck 수정
- Deck 삭제
- Deck 안의 Category 목록 확인

## Category

Category는 Deck 안에서 학습 범위를 나누는 단위이다.

Category에서 할 수 있는 일:

- Category 목록 조회
- Category 생성
- Category 수정
- Category 삭제
- Category 안의 Material 목록 확인

## Material

Material은 학습 원본 자료이다.

Material에서 할 수 있는 일:

- Material 목록 조회
- Material 생성
- Material 상세 조회
- Material 수정
- Material 삭제
- Material 기반 FlashCard 목록 확인

## FlashCard

FlashCard는 Material에서 파생되는 학습 카드이다.

FlashCard에서 할 수 있는 일:

- FlashCard 생성
- FlashCard 수정
- FlashCard 삭제
- 앞면과 뒷면 확인
- 복습 대상 여부 확인

## Review

Review는 오늘 학습자가 복습해야 할 FlashCard를 보여주는 영역이다.

Review에서 할 수 있는 일:

- 오늘 복습할 카드 목록 조회
- 카드 앞면 보기
- 카드 뒷면 보기
- 복습 결과 제출

## MyPage

MyPage는 사용자 정보와 간단한 설정을 관리하는 영역이다.

MVP1에서는 최소 범위만 구현한다.

## 제외 정보 구조

아래 메뉴나 구조는 MVP1에서 만들지 않는다.

- Quiz
- AI Coach
- PDF Library
- OCR Queue
- Marketplace
- Team
- Payment

