# PassMate AGENTS.md

## 목적

이 문서는 PassMate 프로젝트에서 AI 에이전트가 작업을 시작할 때 가장 먼저 읽는 프로젝트 전용 안내서다.

일반적인 클린코드, Git 안전, 테스트 습관, 커뮤니케이션 방식은 전역 AGENTS.md를 따른다.
이 파일은 PassMate의 MVP 범위, 설계 문서, 기술별 규칙 문서로 안내하는 역할을 한다.

## 프로젝트 개요

PassMate는 학습 자료를 플래시카드로 정리하고 반복 복습하는 개인 학습 PWA이다.

현재 단계는 MVP1이다.

## 현재 MVP1 범위

MVP1에 포함되는 도메인은 다음과 같다.

- User
- Deck
- Category
- Material
- FlashCard
- ReviewHistory

MVP1에서 제외되는 기능은 다음과 같다.

- Quiz
- Explanation
- PDF
- OCR
- AI 학습코치
- 결제
- 팀/조직 기능
- 공개 마켓플레이스

## 핵심 도메인 구조

PassMate는 Material 중심 구조를 따른다.

```text
Material
  ↓
FlashCard
  ↓
ReviewHistory
```

- Material은 사용자가 학습하려는 원본 자료이다.
- FlashCard는 Material에서 파생되는 학습 카드이다.
- ReviewHistory는 FlashCard에 대한 복습 기록이다.

이 관계를 임의로 뒤집거나 FlashCard를 독립 원본 데이터처럼 다루지 않는다.

## 사용자 용어와 UX 원칙

PassMate 화면은 퀴즐렛처럼 학습 세트와 카드 생성이 빠르게 느껴지는 흐름을 우선한다.

사용자에게 보이는 용어는 다음을 기본으로 한다.

```text
Deck      → 폴더
Material  → 학습 세트
FlashCard → 카드
Category  → 기본 섹션 또는 내부 분류
```

- 내부 도메인과 API 이름은 MVP1에서 유지할 수 있다.
- 화면, 버튼, 안내 문구에서는 폴더, 학습 세트, 카드 용어를 우선 사용한다.
- 모든 사용자 화면 문구는 한글을 기본으로 작성한다.
- 버튼, 제목, 빈 상태, 에러 메시지는 개발자/도메인 용어보다 사용자가 바로 이해할 수 있는 역할 중심 용어를 사용한다.
- Category는 사용자 필수 단계로 노출하지 않는다.
- 카드 생성은 학습 세트 화면 안에서 앞면/뒷면을 여러 개 빠르게 입력하는 흐름을 우선한다.

## 작업 전 읽을 문서

작업 유형에 따라 아래 문서를 먼저 읽는다.

- 프로젝트 구조, MVP 범위, 도메인 변경: `ARCHITECTURE.md`
- Spring Boot 백엔드 작업: `SPRING.md`
- Next.js/PWA 프론트엔드 작업: `FRONTEND.md`
- API URL, 응답, 에러 형식 작업: `API_STYLE.md`
- Git, 브랜치, 커밋 관련 작업: `GIT.md`

상세 설계 문서는 아래 위치에 있다.

```text
docs/architecture/
  step1_user_scenario_mvp1.md
  step2_information_architecture_mvp1.md
  step3_erd_mvp1.md
  step4_api_design_mvp1.md
  step5_screen_design_mvp1.md
```

## 설계 우선 규칙

- 구현 전에 관련 설계 문서를 먼저 확인한다.
- 설계 문서와 코드가 충돌하면 사용자에게 알린다.
- MVP1 범위 밖 기능은 사용자가 명시적으로 요청하지 않는 한 구현하지 않는다.
- 구조 변경은 `ARCHITECTURE.md`를 기준으로 판단한다.
- 화면 작업은 `docs/architecture/step5_screen_design_mvp1.md`를 우선 기준으로 삼는다.
- PassMate 화면은 데스크톱 웹 서비스를 우선으로 설계하고, 모바일 PWA는 복습과 핵심 조회 중심으로 축소한다.
- 화면의 기본 구조는 Header, Sidebar, Main Content를 사용하는 관리형 웹 서비스 레이아웃이다.
- 학습 세트와 카드는 독립 메뉴로 만들지 않고 폴더 상세 흐름 안에서 접근한다.
- FlashCard 생성/수정은 별도 페이지보다 모달 또는 우측 패널 방식을 우선한다.

## 기술별 규칙

- 백엔드 작업은 `SPRING.md`를 따른다.
- 프론트엔드 작업은 `FRONTEND.md`를 따른다.
- API 설계와 응답 형식은 `API_STYLE.md`를 따른다.
- Git 작업과 한국어 커밋 메시지 작성은 `GIT.md`를 따른다.

## PassMate 작업 완료 기준

작업은 다음 조건을 만족해야 완료된 것으로 본다.

- MVP1 범위를 벗어나지 않는다.
- 관련 설계 문서와 기술별 규칙을 위반하지 않는다.
- Material, FlashCard, ReviewHistory의 관계를 깨지 않는다.
- 관련 화면 또는 API 흐름이 실제로 동작한다.
- 가능한 테스트, 타입체크, 린트, 빌드를 실행한다.
- 실행하지 못한 검증이 있으면 이유를 설명한다.

--
## Git 보안 규칙

커밋 또는 Push 전에 반드시 보안 점검을 수행한다.

### 반드시 확인

- `git diff`
- `git diff --cached`
- `git status`

위 결과를 검토하여 아래 항목이 포함되어 있으면 커밋을 중단한다.

- API Key
- Secret
- Token
- Password
- OAuth Client Secret
- JWT Secret
- Database 접속정보
- SSH Key
- 인증서(.pem, .key, .jks, .p12)
- 개인정보

### 금지

다음 행위는 절대 수행하지 않는다.

- `.gitignore`를 우회하기 위한 `git add -f`
- 실제 Secret을 코드에 하드코딩
- 실제 `.env` 내용을 README, 문서, 예제 코드에 복사
- 실제 운영 서버 정보를 Git에 커밋

보안이 의심되는 경우에는 절대 커밋하지 말고 사용자에게 먼저 확인을 요청한다.

--
## 사용자 작업 안내 규칙

AI가 작업을 완료한 후 사용자가 직접 수행해야 하는 작업이 있다면 반드시 마지막에 **"사용자 작업 필요"** 섹션을 추가한다.

다음과 같은 작업은 반드시 안내한다.

* 환경변수(.env) 생성 또는 수정
* API Key 발급
* OAuth 설정
* 외부 서비스(Firebase, Supabase, AWS 등) 설정
* 데이터베이스 생성 또는 마이그레이션
* 패키지 설치
* Docker 실행
* CLI 명령 실행
* 운영체제 설정 변경
* IDE 설정
* 계정 생성 또는 권한 설정
* 수동으로 생성해야 하는 파일
* 사용자가 직접 입력해야 하는 값

반드시 아래 형식으로 작성한다.

```text
## 사용자 작업 필요

1. .env.local 파일 생성

다음 값을 입력하세요.

OPENAI_API_KEY=...
DATABASE_URL=...

2. Google OAuth Client 생성

- Google Cloud Console 접속
- OAuth Client 생성
- Client ID를 .env.local에 입력

3. 실행

npm install
npm run dev
```

사용자가 직접 수행해야 하는 작업이 하나라도 있다면 절대 생략하지 않는다.

AI가 대신 수행할 수 없는 작업은 반드시 사용자에게 명확하게 안내한다.
