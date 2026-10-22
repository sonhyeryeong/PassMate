# PassMate 문서 구조 개편 결과

## 적용 상태

2026-10-22 기준 `docs/memory-first-vision` 브랜치에서 기존 단계별 설계 문서 다섯 개를 역할별 문서 네 개로 통합했다. 기존 파일의 전체 내용은 Git 이력에 보존되어 있다.

| 문서 | 단일 책임 |
| --- | --- |
| [PRODUCT_VISION.md](PRODUCT_VISION.md) | 제품 목적과 기능 도입 판단 |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | MVP 범위, 도메인 관계와 설계 원칙 |
| [USER_FLOW.md](architecture/USER_FLOW.md) | 사용자 시나리오와 정보 구조 |
| [DATA_MODEL.md](architecture/DATA_MODEL.md) | ERD, 복습 상태 및 이력 |
| [API_CONTRACT.md](architecture/API_CONTRACT.md) | API 계약 |
| [SCREEN_SPEC.md](architecture/SCREEN_SPEC.md) | 화면, 라우트 및 상호작용 |
| AGENTS.md | 읽을 문서 라우팅, 작업 검증 및 문서 동기화 규칙 |

## 이전 파일 대응

- step1 사용자 시나리오 + step2 정보 구조 → USER_FLOW.md
- step3 ERD → DATA_MODEL.md
- step4 API 설계 → API_CONTRACT.md
- step5 화면 설계 → SCREEN_SPEC.md

README.md, AGENTS.md, ARCHITECTURE.md의 경로를 변경했다. 외부에서 기존 GitHub 파일 URL을 사용했다면 새 경로로 교체해야 한다.

## 정적 코드 대조 결과

- 복습 화면은 현재 구현되어 있다. 과거 '복습 UI 미완성' 표기는 최신 코드와 불일치했다.
- 복습 결과에 따른 일정 계산은 현재 AGAIN 10분, HARD 1일, GOOD 3일, EASY 7일이다. 개인화된 적응형 알고리즘은 아니다.
- `/deck/...` 일부 경로는 `/folder/...`로 이동하는 호환 라우트이므로 임의 삭제하지 않는다.
- 학습 세트 상세의 '복습 시작' 버튼은 전체 `/review`로 이동한다. 세트별 복습은 검토가 필요하다.

## 유지보수 규칙

1. 제품 목적·범위는 승인 없이 변경하지 않는다.
2. 사용자 행동·데이터·API·화면 계약이 바뀔 때만 해당 원본 문서를 같은 작업 단위에서 갱신한다.
3. 다른 문서에서는 같은 정책을 복사하지 않고 원본에 링크한다.
4. 코드와 문서의 차이는 '현재 구현 / 목표 설계 / 미구현'으로 구분한다.
5. 작업 완료 보고에 문서 갱신 여부, 실행한 테스트, 미확인 사항을 기록한다.

## 검증 및 잔여 작업

- GitHub 상의 새 문서 생성, 이전 문서 삭제, 주요 참조 파일 경로 변경을 확인했다.
- 앱 실행·빌드·브라우저 E2E 테스트는 수행하지 않았다.
- 전체 코드 주석·외부 문서·이슈에 있는 구형 문서 URL까지 자동 갱신되었는지는 확인하지 않았다.
- 상세 문서에는 기존 설계의 미래 목표와 현재 구현이 혼재할 수 있어, 다음 기능 개발 시 관련 계약을 우선 대조한다.
