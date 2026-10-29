# PassMate 아키텍처 규칙

## 목적

이 문서는 PassMate의 프로젝트 구조, 도메인 경계, MVP 범위를 보호하기 위한 규칙이다.

AI 에이전트는 이 문서를 기준으로 프로젝트 구조를 이해하고, 임의로 구조를 바꾸지 않는다.

## 제품 비전과 구조의 관계

제품의 최상위 목표와 신규 기능 판단 기준은 [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md)를 따른다.

- 핵심 목표는 다양한 공부법 제공이 아니라 **장기 기억 유지**이다.
- 현재 `Material → FlashCard → ReviewHistory` 구조를 유지하면서, 회상 결과에 따라 다음 복습을 결정하는 흐름을 완성한다.
- MVP1은 기존 복습 흐름과 기본 일정 계산을 완성하는 단계로 유지한다. 적응형 알고리즘 고도화나 신규 학습 방식은 MVP1에 임의로 포함하지 않는다.
- 학습 방식이 추가되더라도 복습 이력의 의미와 현재 학습 상태를 명확히 구분하고, 동일한 결과로 간주하기 전에 검증한다.

## 설계 우선

- 구현보다 설계 문서를 우선 신뢰한다.
- 구조 변경 전 관련 설계 문서를 먼저 확인한다.
- 설계 문서와 코드가 충돌하면 즉시 사용자에게 알리고, 임의로 판단해 큰 방향을 바꾸지 않는다.
- MVP 범위 밖의 기능은 구현하지 않는다.

## 현재 단계

현재 프로젝트는 MVP1 단계이다.

Phase2 기능은 구현하지 않는다.

## MVP1 포함 범위

MVP1에는 다음 도메인을 포함한다.

- User
- Deck
- Category
- Material
- FlashCard
- ReviewHistory

## MVP1 제외 범위

아래 기능은 MVP1에서 제외한다.

- Quiz
- Explanation
- PDF
- OCR
- AI 학습코치
- 결제
- 팀/조직 기능
- 공개 마켓플레이스

## 외부 공개용 인증 범위 (2026-10-29, 일반 인증 구현)

- 아이디·닉네임·비밀번호로 회원가입하고 아이디·비밀번호로 로그인한다.
- Google 가입/로그인도 제공한다. 두 로그인 방식 모두 내부 User를 학습 데이터의 소유자로 사용한다.
- 일반 가입에는 이메일을 요구하지 않는다. 이메일 인증·비밀번호 찾기/재설정·복구 코드·메일 발송 서비스는 초기 범위에서 제외한다.
- 계정 자동 병합과 로그인 수단 연결/해제 UI는 초기 범위에 포함하지 않는다.
- 현재 코드는 아이디·비밀번호 인증과 서버 세션 기반 사용자 격리를 사용한다. Google 로그인은 후속 구현이며 외부 배포 완료를 의미하지 않는다.
- 세부 사용자 동작은 [사용자 흐름](docs/architecture/USER_FLOW.md), 확정한 무료 서비스 구성과 남은 운영 제안은 [공개 베타 설계안](docs/architecture/PUBLIC_BETA_DESIGN.md)을 따른다.

## 핵심 철학

PassMate는 Material 중심 구조를 유지한다.

```text
Material
  ↓
FlashCard
  ↓
ReviewHistory
```

- Material은 사용자가 학습하고 싶은 원본 학습 자료이다.
- FlashCard는 Material에서 파생되는 학습 카드이다.
- ReviewHistory는 FlashCard에 대한 사용자의 복습 기록이다.
- FlashCard를 독립적인 원본 데이터처럼 다루지 않는다.
- ReviewHistory는 학습 결과와 복습 스케줄 계산의 근거가 된다.

## 사용자 용어 원칙

MVP1의 사용자 화면은 퀴즐렛처럼 학습 세트와 카드 생성을 빠르게 할 수 있는 흐름을 우선한다.

사용자에게 보이는 용어는 다음을 기본으로 한다.

```text
Deck      → 폴더
Material  → 학습 세트
FlashCard → 카드
Category  → 기본 섹션 또는 내부 분류
```

내부 Entity, Repository, API 경로는 MVP1에서 대규모 리네이밍하지 않아도 된다. 다만 화면, 버튼, 문구, 설계 설명은 가능한 한 폴더, 학습 세트, 카드 용어를 사용한다.

Category는 사용자에게 필수 생성 단계로 노출하지 않는다. 필요한 경우 시스템이 기본 Category를 자동으로 만들거나 기본 섹션으로 처리한다.

## 도메인 관계 원칙

- User는 여러 Deck을 가질 수 있다.
- Deck은 여러 Category를 가질 수 있다.
- Category는 여러 Material을 가질 수 있다.
- Material은 여러 FlashCard를 만들 수 있다.
- FlashCard는 여러 ReviewHistory를 가질 수 있다.

## 구조 변경 원칙

- 도메인 추가 전 MVP1 범위에 포함되는지 확인한다.
- 기존 도메인 관계를 바꾸기 전 ERD 문서를 확인한다.
- 화면 구조 변경 전 정보 구조와 화면 설계 문서를 확인한다.
- API 변경 전 API 설계 문서를 확인한다.
- 단순 취향이나 정리 목적의 대규모 파일 이동은 하지 않는다.

## 문서 위치

설계 문서는 아래 위치에 둔다.

```text
docs/architecture/
  USER_FLOW.md
  DATA_MODEL.md
  API_CONTRACT.md
  SCREEN_SPEC.md
```

구현 전 반드시 관련 문서를 읽는다.
