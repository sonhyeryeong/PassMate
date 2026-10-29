# Supabase 연결 준비

## 현재 상태

무료 구성은 화면 Vercel Hobby, Spring 서버 Render Free, DB Supabase Free다. 기본 HTTPS 주소를 사용하고 도메인은 구매하지 않는다. Supabase Auth 대신 Spring에서 아이디·비밀번호와 Google 로그인을 구현할 예정이다.

현재 추가한 것은 **DB 전환 기반**이다. `postgres` 프로필은 localhost에만 바인딩하는 연결 검증용이며, 인증 없는 현재 앱을 공개 배포하는 설정이 아니다. 로그인·사용자 격리·배포 프록시·버전 점검을 완료한 뒤 배포 설정을 추가한다.

- 기본 실행은 기존 H2 파일을 계속 사용하며 Flyway가 실행되지 않는다.
- `postgres` 프로필은 필수 환경변수로 PostgreSQL에 접속한다. 값이 없으면 H2로 대체하지 않고 실패한다.
- Flyway가 별도 `passmate` 스키마에 현재 학습 테이블과 외래키를 생성한다. Hibernate는 스키마를 자동 변경하지 않고 검증한다.
- Supabase의 `public` 스키마나 `auth.users`는 사용하지 않는다. `passmate`를 Data API 노출 스키마에 추가하지 않는다.
- V1의 이메일 필수 조건은 현재 코드와 맞춘 것이다. 인증 구현 단계에서 후속 SQL로 변경하고 자격 정보·세션 테이블을 추가한다. 이미 적용한 SQL은 수정하지 않는다.
- 기존 H2 자료를 복사하거나 삭제하지 않는다. 데이터가 이미 들어 있는 DB를 임의로 baseline 처리하지 않는다.

## 사용자 작업 필요

### 1. 무료 Supabase 프로젝트 생성

[Supabase](https://supabase.com/dashboard)에서 Free 조직 안에 새 프로젝트를 만든다. 프로젝트 이름은 `passmate-beta`처럼 식별하기 쉽게 정하고, DB 비밀번호는 비밀번호 관리 도구에 저장한다. 유료 업그레이드·IPv4 부가 상품은 신청할 필요가 없다.

이 단계에서는 합성 테스트 자료만 사용한다. 실제 사용자의 자료를 넣지 않는다.

### 2. 접속 정보와 인증서 준비

프로젝트의 **Connect → Session pooler**에서 호스트·사용자 이름·포트(5432)를 확인한다. Spring 연결에는 Transaction pooler(6543)를 사용하지 않는다. Session pooler는 IPv4 환경에서도 연결할 수 있다. [공식 Spring 안내](https://supabase.com/docs/guides/getting-started/quickstarts/spring-boot)

DB 설정의 SSL 인증서를 내려받아 저장소 밖에 보관한다. 인증서 경로를 JDBC URL의 `sslrootcert`에 지정하고 `sslmode=verify-full`을 사용한다. 경로의 공백 등은 URL 인코딩한다. [연결·TLS 안내](https://supabase.com/docs/guides/database/connecting-to-postgres)

### 3. 로컬 연결 검증

현재 작업 PC에는 대시보드에서 확인한 서울 Session pooler 주소와 사용자 이름, 내려받은 CA 인증서 경로를 `backend/.local/supabase.json`에 준비했다. 이 폴더는 Git에서 제외한다. JSON에는 비밀번호를 저장하지 않고 로컬 전용 YAML에 보관한다. 외부 DB 접속 정보나 인증서를 저장소에 커밋하지 않는다.

이 PC에서는 로컬 YAML에 비밀번호를 한 번 입력한 뒤 프로젝트 루트 PowerShell에서 다음 명령을 실행한다. 일반 실행은 입력 프롬프트 없이 동작하고 실행이 끝나면 스크립트가 변경한 환경변수를 원래 값으로 복원한다.

```powershell
.\backend\scripts\Start-Supabase.ps1
```

이 스크립트는 새 `passmate` 스키마에 migration을 적용하고 Spring을 localhost에서 실행한다. `Started PassMateApplication`이 나타나면 기동 성공이다. 종료는 Ctrl+C다. 파일·도구 설정만 점검하려면 `-CheckOnly` 옵션을 사용한다. 다른 PC에서는 같은 JSON에 Host, Username, CertificatePath, MavenPath, JavaHome을 해당 PC에 맞게 준비하거나 아래 환경변수 방식으로 실행한다. Maven이 임시 폴더에 있다면 정리 후 경로를 다시 설정해야 한다.

2026-10-29에 이 PC에서 서울 풀러의 TCP 연결과 공식 CA를 사용한 TLS 인증서·호스트 이름 검증(TLS 1.3)을 확인했다. 이후 같은 날 새 DB 비밀번호로 JDBC 인증과 SELECT 1이 성공했다. Spring의 postgres 프로필에서 passmate 스키마 및 Flyway V1 적용, JPA 스키마 검증과 localhost:8080 기동까지 확인했다. GET /api/users도 HTTP 200을 반환했다. 기존 인증 실패의 정확한 원인을 비밀번호 오입력 또는 제공자 문제로 확정하지는 않는다. 현재 Flyway가 PostgreSQL 17.11을 공식 검증 범위 밖으로 알리는 경고가 있으므로 공개 배포 전 버전 호환성 점검은 남아 있다.

아래는 값의 형식이다. 실제 비밀번호나 연결 정보를 채팅·소스 파일에 붙이지 않는다. IDE의 로컬 환경변수 설정 또는 현재 터미널의 환경변수로 제공한다. Spring은 `.env` 파일을 자동으로 읽지 않는다.

```text
SPRING_PROFILES_ACTIVE=postgres
PASSMATE_DB_URL=jdbc:postgresql://<SESSION_POOLER_HOST>:5432/postgres?sslmode=verify-full&sslrootcert=<CERTIFICATE_PATH>
PASSMATE_DB_USERNAME=<SESSION_POOLER_USERNAME>
PASSMATE_DB_PASSWORD=<DATABASE_PASSWORD>
```

프로젝트 루트에서 실행한다.

```powershell
mvn -f backend/pom.xml spring-boot:run
```

첫 실행은 `passmate` 스키마와 `flyway_schema_history`를 만든다. 재실행 시 V1을 재적용하지 않아야 한다. 종료 후 `SPRING_PROFILES_ACTIVE`와 위 DB 변수를 해제하면 기존 로컬 H2 설정으로 돌아간다.

프로젝트 관리자 접속은 초기 합성 데이터 검증에만 사용한다. 공개 배포 전에 migration 권한과 런타임의 제한된 CRUD 권한을 분리해야 한다.

### 4. 이후 배포 설정

인증 구현이 끝나면 Vercel Hobby·Render Free 계정 및 Google OAuth Client를 설정한다. 아직 앱을 배포하거나 운영 DB 자격 증명을 프론트엔드 환경변수에 넣지 않는다. 구체적인 callback URL과 배포 변수는 인증 구현 후 확정한다.

## 자동 검증

인증 오류를 Spring 설정과 구분하려면 `backend/.local/supabase.json`의 `JdbcDriverPath`를 설치된 PostgreSQL JDBC JAR 경로로 설정하고 `./backend/scripts/Start-Supabase.ps1 -Diagnose`를 실행한다. 현재 작업 PC에는 이 경로도 준비했다. 이 모드는 같은 TLS·계정 설정으로 JDBC 연결과 `SELECT 1`만 실행하며 migration이나 데이터 변경은 하지 않는다. 결과에 비밀번호를 출력하지 않는다. `DB_AUTH_AND_SELECT_OK`이면 JDBC 인증 성공, `DB_AUTH_REJECTED_WITHOUT_SPRING`이면 Spring 없이도 DB가 인증을 거부한 것이다.

`PostgresMigrationTest`는 `PASSMATE_POSTGRES_TEST=true`일 때 실제 PostgreSQL에 연결해 최초 migration·재실행, JPA 모델 일치, 고아 카드 저장 거부, 폴더와 하위 기록의 삭제 순서를 검사한다. 테스트에는 폐기 가능한 전용 DB만 사용한다. Supabase 운영 프로젝트를 테스트 대상으로 지정하지 않는다.

CI에는 PostgreSQL 17 임시 서비스와 해당 환경변수를 설정했다. 일반 H2 회귀 테스트도 함께 실행한다. 이 테스트 통과는 Supabase 네트워크·TLS·무료 호스팅·Google 인증 검증을 대신하지 않는다.

무료 한도와 휴면 조건은 [공개 베타 설계](architecture/PUBLIC_BETA_DESIGN.md#6-무료-우선-배포안)를 따른다.

## 일반 인증 구현 후 재시작

현재 코드는 V2(이메일 선택화·로그인 자격 정보)와 V3(JDBC 세션)를 포함한다. 기존 V1과 학습 자료는 보존한다. 실제 Supabase에는 재시작 후 적용 여부를 확인해야 한다.

1. 기존 Spring 실행 터미널에서 Ctrl+C로 종료한다.
2. `backend/.local/application-local.yml`의 `PASSMATE_DB_PASSWORD`를 한 번 입력한 뒤 프로젝트 루트에서 `./backend/scripts/Start-Supabase.ps1`을 실행한다. 일반 실행에서는 비밀번호를 다시 묻지 않는다.
3. 프론트엔드는 `cd frontend` 후 `npm run dev`로 실행한다. 기본 `/api` 프록시가 localhost:8080에 연결한다.
4. 브라우저 `/signup`에서 새 계정을 만든 뒤 `/login`에서 로그인한다. 이전 로컬 프로필은 자동 연결되지 않는다.

현재 `/api/users`는 제거됐다. 인증 전 `/api/users/me`의 401은 정상이며 로그인 후 200으로 확인한다. 이 절차는 공개 배포나 Google 로그인 설정을 대신하지 않는다.

## 로컬 YAML과 배포 환경변수

일반 실행 스크립트는 `backend/.local/application-local.yml`을 Spring의 추가 설정 파일로 지정한다. 파일은 소스 리소스 폴더 밖에 있으며 `.local/` 전체가 Git에서 제외된다. 실제 파일을 커밋하거나 배포 패키지에 복사하지 않는다.

- 최초 설정: `backend/scripts/application-local.example.yml`을 위 경로로 복사하고 값을 입력한다. 현재 작업 PC에는 접속 URL·사용자 이름을 채운 파일을 준비했으며 비밀번호만 입력하면 된다.
- 비밀번호는 YAML 작은따옴표 안에 작성한다. 비밀번호 자체에 작은따옴표가 있으면 두 번 쓴다. 예: 합성 값 `ab'cd`는 `'ab''cd'`로 작성한다. 값에 `${...}`가 포함되면 Spring의 변수 치환 대상이 될 수 있으므로 해당 경우 환경변수 주입을 사용한다.
- 기존 `PASSMATE_DB_*` 환경변수가 설정돼 있으면 YAML보다 우선한다. 파일 수정이 반영되지 않으면 IDE·터미널의 기존 환경변수를 확인한다.
- `-SecretsPath`로 다른 로컬 YAML 경로를 지정할 수 있다. `-CheckOnly`는 파일 존재와 실행 환경만 확인하며 YAML 내용·DB 인증을 검증하지 않는다.
- `-Diagnose`는 Spring을 사용하지 않는 별도 JDBC 진단이므로 기존처럼 비밀번호를 직접 입력한다.
- 배포에서는 이 Windows 실행 스크립트나 로컬 YAML을 복사하지 않는다. 호스팅 서비스에 `PASSMATE_DB_URL`, `PASSMATE_DB_USERNAME`, `PASSMATE_DB_PASSWORD`를 등록한다. 공개 서버 바인딩·HTTPS·쿠키 등 배포 설정은 별도로 완료해야 한다.
