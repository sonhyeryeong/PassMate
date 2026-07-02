# Step 5. PassMate MVP1 화면 설계

## 목적

이 문서는 PassMate MVP1의 화면 구조와 화면별 책임을 정의한다.

PassMate는 PWA로 제공하지만, MVP1의 자료 입력과 관리는 PC 웹에서 주로 사용한다고 가정한다. 모바일 PWA는 전체 관리 기능보다 오늘의 복습, 폴더/학습 세트 조회, MyPage 중심으로 축소한다.

## 설계 전제

- 데스크톱 웹 우선으로 설계한다.
- 기준 해상도는 1440px 데스크톱 웹 화면이다.
- 전체 구조는 Header, Sidebar, Main Content를 기본으로 한다.
- 사용자에게 보이는 핵심 구조는 `폴더 > 학습 세트 > 카드`이다.
- 내부 도메인의 Deck은 화면에서 폴더로 표현한다.
- 내부 도메인의 Material은 화면에서 학습 세트로 표현한다.
- 내부 도메인의 FlashCard는 화면에서 카드로 표현한다.
- Category는 MVP1에서 필수 화면 단계로 노출하지 않는다.
- 카드 생성/수정은 퀴즐렛처럼 학습 세트 화면 안에서 빠르게 처리한다.
- Review 화면은 웹과 모바일 모두에서 쓰기 쉽도록 카드 중심으로 단순하게 유지한다.
- MVP1에서 AI, PDF 업로드, OCR, 퀴즈, 결제, 공유 Deck 기능은 만들지 않는다.

## 필요한 화면 목록

MVP1 화면은 다음으로 구성한다.

- Dashboard
- 폴더 목록
- 폴더 상세
- 학습 세트 생성/수정
- 학습 세트 상세
- 카드 빠른 생성/수정
- 오늘의 복습
- Review History
- MyPage

## 최상위 메뉴

Sidebar의 주요 메뉴는 다음으로 구성한다.

- Dashboard
- 폴더
- Review
- MyPage

학습 세트와 카드는 Sidebar에 노출하지 않는다. 사용자는 폴더 목록에서 시작해 `폴더 > 학습 세트 > 카드` 흐름으로 접근한다.

## 데스크톱 웹 기본 레이아웃

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header                                                                       │
│ PassMate / 현재 위치 / 검색 또는 사용자 정보                                 │
├───────────────┬──────────────────────────────────────────────────────────────┤
│ Sidebar       │ Main Content                                                  │
│               │                                                              │
│ Dashboard     │ 페이지 제목 / 주요 액션                                      │
│ 폴더          │ ┌──────────────────────────────────────────────────────────┐ │
│ Review        │ │ Summary, Set List, Card Editor, Detail Panel             │ │
│ MyPage        │ └──────────────────────────────────────────────────────────┘ │
│               │                                                              │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

### Desktop Layout 기준

- Header 높이: 56px ~ 64px
- Sidebar 너비: 220px ~ 240px
- Main Content 최대 너비: 1120px ~ 1280px
- Main Content padding: 24px ~ 32px
- 목록 화면은 카드 그리드 또는 테이블형 리스트를 사용한다.
- 생성 폼은 페이지 전체를 차지하지 않고, 모달 또는 우측 패널로 연다.
- 학습 세트 생성/수정 화면은 카드 입력을 빠르게 반복할 수 있는 테이블형 편집 UI를 우선한다.

## 모바일 PWA 축소 구조

모바일에서는 관리 기능을 모두 같은 밀도로 제공하지 않는다. 복습과 조회를 우선한다.

```text
┌─────────────────────────┐
│ Mobile Header           │
├─────────────────────────┤
│ Main                    │
│ - Today Review          │
│ - 폴더 조회             │
│ - 학습 세트 조회        │
│ - MyPage                │
├─────────────────────────┤
│ Bottom Navigation       │
│ 폴더 / Review / MyPage  │
└─────────────────────────┘
```

### Mobile Layout 기준

- Bottom Navigation을 사용할 수 있다.
- Dashboard는 모바일에서 Review 중심 요약으로 축소한다.
- 폴더와 학습 세트는 조회와 복습 시작 중심으로 제공한다.
- 카드 대량 입력과 편집은 데스크톱 사용을 우선한다.
- Review 화면은 모바일에서도 동일한 카드 중심 UI를 사용한다.

## 화면별 설계

### 1. Dashboard

목적:

- 사용자가 오늘 할 일을 빠르게 파악하고 복습을 시작한다.

필수 요소:

- 오늘 복습할 카드 수
- 전체 폴더 수
- 전체 학습 세트 수
- 이번 주 복습 수
- 최근 학습 세트
- 바로 복습 시작 버튼

Desktop Wireframe:

```text
┌ Dashboard ──────────────────────────────────────────────────────────────────┐
│ [오늘 복습 12] [폴더 5] [학습 세트 18] [이번 주 복습 48]                    │
│                                                                              │
│ ┌ Recent Study Sets ────────────────┐ ┌ Review CTA ──────────────────────┐ │
│ │ 데이터베이스 정규화               │ │ 오늘 복습할 카드가 12장 있습니다 │ │
│ │ 네트워크 핵심 용어                │ │ [바로 복습 시작]                 │ │
│ │ Spring Boot 면접                  │ └──────────────────────────────────┘ │
│ └───────────────────────────────────┘                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

주요 컴포넌트:

- `DashboardStats`
- `RecentStudySetList`
- `ReviewStartPanel`
- `EmptyDashboardState`

### 2. 폴더 목록

목적:

- 사용자가 학습 주제 목록을 확인하고 새 폴더를 만든다.

필수 요소:

- 폴더 카드 목록
- 새 폴더 생성 버튼
- 빈 상태
- 로딩 상태
- 에러 상태

Desktop Wireframe:

```text
┌ 폴더 ─────────────────────────────────────────────── [새 폴더] ┐
│ ┌ Folder Card ┐ ┌ Folder Card ┐ ┌ Folder Card ┐ ┌ Folder Card ┐ │
│ │ 정보처리기사 │ │ 영어 단어   │ │ Spring 면접 │ │ 알고리즘     │ │
│ │ 학습 세트 5개│ │ 학습 세트 8개│ │ 학습 세트 3개│ │ 학습 세트 4개│ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

주요 컴포넌트:

- `FolderListPage`
- `PageHeader`
- `FolderCardGrid`
- `FolderCard`
- `CreateFolderDialog`
- `FolderListEmptyState`
- `FolderListSkeleton`
- `ErrorState`

### 3. 폴더 상세

목적:

- 특정 폴더의 정보를 확인하고 학습 세트를 관리한다.

필수 요소:

- 폴더 이름
- 폴더 설명
- 학습 세트 목록
- 학습 세트 생성 버튼
- 폴더 수정 버튼
- 폴더 삭제 버튼

Desktop Wireframe:

```text
┌ 폴더 > 정보처리기사 ───────────────────── [수정] [삭제] [학습 세트 만들기] ┐
│ 설명: 필기 시험 대비                                                         │
│                                                                               │
│ 학습 세트                                                                     │
│ ┌ 데이터베이스 정규화 ┐ ┌ 네트워크 핵심 용어 ┐ ┌ 운영체제 프로세스 ┐        │
│ │ 카드 24개           │ │ 카드 18개          │ │ 카드 16개          │        │
└───────────────────────────────────────────────────────────────────────────────┘
```

주요 컴포넌트:

- `FolderDetailPage`
- `Breadcrumb`
- `FolderSummary`
- `StudySetList`
- `StudySetCard`
- `CreateStudySetDialog`
- `EditFolderDialog`
- `DeleteConfirmDialog`

### 4. 학습 세트 생성/수정

목적:

- 사용자가 퀴즐렛처럼 학습 세트 정보와 카드 목록을 한 번에 작성한다.

필수 요소:

- 학습 세트 제목
- 학습 세트 설명 또는 메모
- 카드 입력 리스트
- 카드 행 추가 버튼
- 카드 행 삭제 버튼
- 저장 버튼
- 취소 버튼
- 검증 메시지
- 저장 중 상태

Desktop Wireframe:

```text
┌ 새 학습 세트 만들기 ───────────────────────────────────────────── [저장] ┐
│ 제목  [ 데이터베이스 정규화                                      ]       │
│ 설명  [ 정규화와 이상 현상 핵심 정리                              ]       │
│                                                                            │
│ 카드                                                                        │
│ ┌────┬──────────────────────────────┬───────────────────────────────────┐ │
│ │ #  │ 앞면                         │ 뒷면                              │ │
│ ├────┼──────────────────────────────┼───────────────────────────────────┤ │
│ │ 1  │ 제1정규형이란?               │ 모든 속성 값이 원자값인 상태       │ │
│ │ 2  │ 부분 함수 종속이란?          │ 기본키 일부에만 종속되는 상태      │ │
│ │ 3  │                              │                                   │ │
│ └────┴──────────────────────────────┴───────────────────────────────────┘ │
│ [+ 카드 추가]                                                               │
└────────────────────────────────────────────────────────────────────────────┘
```

주요 컴포넌트:

- `StudySetEditorPage`
- `StudySetMetaForm`
- `CardEditorTable`
- `CardEditorRow`
- `AddCardRowButton`
- `StudySetSaveBar`
- `ValidationMessage`

### 5. 학습 세트 상세

목적:

- 학습 세트의 내용과 카드 목록을 확인하고 복습을 시작한다.

필수 요소:

- 상단 breadcrumb: 폴더 > 학습 세트
- 학습 세트 제목
- 학습 세트 설명
- 카드 목록
- 카드 추가/수정 진입
- 학습 세트 수정 버튼
- 학습 세트 삭제 버튼
- 복습 시작 버튼

Desktop Wireframe:

```text
┌ 폴더 > 정보처리기사 > 데이터베이스 정규화 ───── [복습 시작] [수정] [삭제] ┐
│ 설명: 정규화와 이상 현상 핵심 정리                                          │
│                                                                              │
│ ┌ 카드 목록 ──────────────────────────────────────────────────────────────┐ │
│ │ Q. 제1정규형이란?                 A. 모든 속성 값이 원자값인 상태       │ │
│ │ Q. 부분 함수 종속이란?            A. 기본키 일부에만 종속되는 상태      │ │
│ │ Q. 이상 현상이란?                 A. 삽입/삭제/갱신 이상               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

주요 컴포넌트:

- `StudySetDetailPage`
- `Breadcrumb`
- `StudySetSummary`
- `StudySetActionBar`
- `FlashCardList`
- `FlashCardListItem`
- `FlashCardEditorPanel`
- `DeleteConfirmDialog`

### 6. 카드 빠른 생성/수정

목적:

- 학습 세트에 속한 카드의 앞면과 뒷면을 빠르게 작성하거나 수정한다.

표현 방식:

- 데스크톱: 학습 세트 편집 화면의 테이블형 카드 입력을 우선한다.
- 데스크톱 상세 화면: 우측 패널 또는 모달로 단일 카드 추가/수정을 제공한다.
- 모바일: 전체 화면 모달 또는 바텀시트를 사용할 수 있다.

필수 요소:

- 앞면 입력
- 뒷면 입력
- 저장 버튼
- 취소 버튼
- 검증 메시지
- 저장 중 상태

단일 카드 패널 Wireframe:

```text
┌ Card Panel ───────────────┐
│ 앞면                      │
│ ┌───────────────────────┐ │
│ │ 질문 입력              │ │
│ └───────────────────────┘ │
│ 뒷면                      │
│ ┌───────────────────────┐ │
│ │ 답변 입력              │ │
│ └───────────────────────┘ │
│ [취소] [저장]             │
└───────────────────────────┘
```

주요 컴포넌트:

- `FlashCardEditorPanel`
- `FlashCardForm`
- `CardEditorTable`
- `CardEditorRow`
- `FormField`
- `ValidationMessage`
- `PanelHeader`

### 7. 오늘의 복습

목적:

- 오늘 복습할 카드를 한 장씩 학습하고 결과를 저장한다.

필수 요소:

- 현재 진행 상태: 예) 3 / 20
- 카드 앞면
- 뒷면 보기 버튼
- 카드 뒷면
- 결과 버튼: 다시 / 어려움 / 좋음 / 쉬움
- 완료 화면
- 오늘 복습할 카드가 없을 때의 빈 상태

Desktop/Mobile 공통 Wireframe:

```text
┌ Review ───────────────────────────────────────────────┐
│ 3 / 20                                                │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 카드 앞면                                        │ │
│ │                                                  │ │
│ │ [뒷면 보기]                                      │ │
│ │                                                  │ │
│ │ 카드 뒷면                                        │ │
│ └──────────────────────────────────────────────────┘ │
│ [다시] [어려움] [좋음] [쉬움]                         │
└───────────────────────────────────────────────────────┘
```

주요 컴포넌트:

- `ReviewPage`
- `ReviewProgress`
- `ReviewCard`
- `RevealAnswerButton`
- `ReviewResultButtons`
- `ReviewCompleteState`
- `ReviewEmptyState`

### 8. Review History

목적:

- 최근 복습 기록을 조회한다.

필수 요소:

- 최근 복습 기록 목록
- 카드 질문
- 복습 결과
- 복습 시간
- 폴더/학습 세트 필터

Desktop Wireframe:

```text
┌ Review History ───────────────────── 폴더 [전체] 학습 세트 [전체] ┐
│ 질문                         결과       시간                       │
│ 제1정규형이란?               좋음       2026-07-02 19:20           │
│ 트랜잭션 ACID란?             어려움     2026-07-02 19:12           │
└───────────────────────────────────────────────────────────────────┘
```

주요 컴포넌트:

- `ReviewHistoryPage`
- `ReviewHistoryFilters`
- `ReviewHistoryTable`
- `ReviewResultBadge`
- `ReviewHistoryEmptyState`

### 9. MyPage

목적:

- 사용자 기본 정보를 확인하고 로그아웃한다.

필수 요소:

- 이메일
- 닉네임
- 로그아웃 버튼

Desktop Wireframe:

```text
┌ MyPage ───────────────────────────────┐
│ Profile                               │
│ 이메일    sujin@example.com           │
│ 닉네임    수진                         │
│ [로그아웃]                             │
└───────────────────────────────────────┘
```

주요 컴포넌트:

- `MyPage`
- `ProfilePanel`
- `LogoutButton`

## Next.js 구현 구조 제안

사용자에게 보이는 이름은 폴더, 학습 세트, 카드이지만 기존 API와 내부 도메인 이름은 MVP1 동안 유지할 수 있다.

```text
frontend/src/
  app/
    page.tsx                         # Dashboard
    folder/
      page.tsx                       # 폴더 목록
      [folderId]/
        page.tsx                     # 폴더 상세
        set/
          new/
            page.tsx                 # 학습 세트 생성
          [setId]/
            page.tsx                 # 학습 세트 상세
            edit/
              page.tsx               # 학습 세트 수정
    review/
      page.tsx                       # 오늘의 복습
      history/
        page.tsx                     # Review History
    mypage/
      page.tsx                       # MyPage
  components/
    layout/
      AppShell.tsx
      Header.tsx
      Sidebar.tsx
      MobileBottomNav.tsx
      PageHeader.tsx
      Breadcrumb.tsx
    folder/
      FolderCard.tsx
      FolderCardGrid.tsx
      FolderFormDialog.tsx
    study-set/
      StudySetCard.tsx
      StudySetList.tsx
      StudySetMetaForm.tsx
      StudySetActionBar.tsx
    flashcard/
      CardEditorTable.tsx
      CardEditorRow.tsx
      FlashCardList.tsx
      FlashCardEditorPanel.tsx
      FlashCardForm.tsx
    review/
      ReviewCard.tsx
      ReviewProgress.tsx
      ReviewResultButtons.tsx
      ReviewHistoryTable.tsx
    common/
      EmptyState.tsx
      ErrorState.tsx
      LoadingState.tsx
      ConfirmDialog.tsx
  lib/
    deckApi.ts        # 내부 Deck API, 화면에서는 folder로 래핑 가능
    categoryApi.ts    # 기본 Category 처리
    materialApi.ts    # 내부 Material API, 화면에서는 study set
    flashcardApi.ts
    reviewApi.ts
    userApi.ts
  types/
```

## API/도메인 네이밍 원칙

MVP1에서는 대규모 백엔드 리네이밍을 피한다.

- API와 Entity는 기존 `Deck`, `Category`, `Material`, `FlashCard`를 유지할 수 있다.
- 프론트 화면과 사용자 문구는 `폴더`, `학습 세트`, `카드`를 사용한다.
- 프론트 타입은 기존 API 타입을 그대로 쓰되, 화면 컴포넌트명은 사용자 용어를 우선한다.
- Category는 기본 Category 자동 생성 또는 기본 Category 조회를 통해 사용자 단계에서 숨긴다.

## 공통 컴포넌트 원칙

- `AppShell`은 데스크톱에서 Header + Sidebar + Main Content를 제공한다.
- 모바일에서는 Sidebar를 숨기고 Bottom Navigation을 사용한다.
- `PageHeader`는 제목, 설명, 주요 액션 버튼을 담당한다.
- `Breadcrumb`는 폴더 상세 흐름에서만 사용한다.
- 학습 세트 생성/수정은 카드 여러 개를 한 번에 작성할 수 있어야 한다.
- 카드 단일 생성/수정은 Dialog 또는 Side Panel로 제공한다.
- 목록에는 로딩, 빈 상태, 에러 상태를 항상 포함한다.
- 삭제는 `ConfirmDialog`로 확인 후 처리한다.

## 반응형 기준

```text
Mobile:  0px   ~ 767px
Tablet:  768px ~ 1023px
Desktop: 1024px 이상
Target:  1440px desktop
```

Desktop:

- Sidebar 표시
- Header 상단 고정
- Main Content 넓은 작업 공간 사용
- 학습 세트 편집은 테이블형 카드 입력 사용
- 단일 카드 편집은 우측 패널 사용

Mobile:

- Sidebar 숨김
- Bottom Navigation 사용
- Review 화면 우선
- 폴더와 학습 세트는 조회 중심
- 복잡한 카드 대량 편집은 최소화

## MVP1 제외 범위

아래 기능은 화면에 노출하지 않는다.

- AI 카드 생성
- AI 설명
- PDF 업로드
- OCR
- Quiz
- 결제
- 공유 Deck
- 팀/조직 기능
- 공개 마켓플레이스
