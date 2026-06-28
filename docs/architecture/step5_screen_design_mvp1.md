# Step 5. PassMate MVP1 화면 설계

## 목적

이 문서는 PassMate MVP1의 주요 화면과 화면별 책임을 정의한다.

프론트엔드 구현 시 사용자 흐름을 유지하기 위한 기준으로 사용한다.

## 화면 목록

MVP1의 핵심 화면은 다음과 같다.

- Deck 목록
- Deck 상세
- Category 상세
- Material 상세
- FlashCard 편집
- 오늘의 복습
- MyPage

## Deck 목록 화면

목적:

- 사용자가 학습 주제 목록을 확인한다.
- 새 Deck을 만들 수 있다.

필수 요소:

- Deck 목록
- Deck 생성 버튼
- 빈 상태
- 로딩 상태
- 에러 상태

## Deck 상세 화면

목적:

- 특정 Deck의 Category 목록을 확인한다.
- Category를 생성하거나 수정한다.

필수 요소:

- Deck 이름
- Deck 설명
- Category 목록
- Category 생성 버튼
- Deck 수정/삭제 진입

## Category 상세 화면

목적:

- Category 안의 Material 목록을 확인한다.
- 새 Material을 등록한다.

필수 요소:

- Category 이름
- Material 목록
- Material 생성 버튼
- 빈 상태
- 로딩 상태
- 에러 상태

## Material 상세 화면

목적:

- 학습 원본 자료를 확인한다.
- Material 기반 FlashCard 목록을 확인한다.
- 새 FlashCard를 만든다.

필수 요소:

- Material 제목
- Material 내용
- FlashCard 목록
- FlashCard 생성 버튼
- Material 수정/삭제 진입

## FlashCard 편집 화면

목적:

- 카드 앞면과 뒷면을 작성하거나 수정한다.

필수 요소:

- 앞면 입력
- 뒷면 입력
- 저장 버튼
- 취소 버튼
- 검증 메시지
- 저장 중 상태

## 오늘의 복습 화면

목적:

- 오늘 복습할 FlashCard를 한 장씩 학습한다.

필수 요소:

- 카드 앞면
- 뒷면 보기 버튼
- 카드 뒷면
- 복습 결과 버튼
- 진행 상태
- 오늘 복습할 카드가 없을 때의 빈 상태

복습 결과 버튼 예시:

- 다시
- 어려움
- 좋음
- 쉬움

## MyPage 화면

목적:

- 사용자 기본 정보를 확인한다.

MVP1에서는 최소 기능만 포함한다.

필수 요소:

- 이메일
- 닉네임

## 공통 상태

모든 주요 화면은 아래 상태를 고려한다.

- 로딩 상태
- 빈 상태
- 에러 상태
- 저장 중 상태
- 삭제 확인 상태

## UX 원칙

- 사용자는 Deck에서 Review까지 자연스럽게 이동할 수 있어야 한다.
- Material과 FlashCard의 관계가 화면에서 헷갈리지 않아야 한다.
- 복습 화면은 방해 요소를 최소화한다.
- 모바일 화면에서 주요 버튼이 잘 보이고 누르기 쉬워야 한다.

