# PassMate

PassMate는 학습 자료를 Deck, Category, Material, FlashCard로 정리하고 반복 복습하는 개인 학습용 PWA입니다.

현재 단계는 MVP1이며, 인증 없이 로컬 개발용 사용자 선택 방식으로 동작합니다.

## 기술 스택

- Backend: Spring Boot 3.3.0, Java 17, Maven, Spring Data JPA
- Database: H2 file DB
- Frontend: Next.js 14, React 18, TypeScript

## 사전 설치

아래 도구가 필요합니다.

- Java 17
- Maven 3.x
- Node.js LTS
- npm

설치 여부는 새 PowerShell에서 확인합니다.

```powershell
java -version
mvn -v
node -v
npm -v
```

자세한 설치 방법은 [INSTALL_MANUAL.md](INSTALL_MANUAL.md)를 참고합니다.

## 처음 셋업하기

저장소를 받은 뒤 프로젝트 루트로 이동합니다.

```powershell
cd D:\workspace\PassMate
```

프론트엔드 의존성을 설치합니다.

```powershell
cd frontend
npm.cmd install
```

백엔드는 Maven이 실행 시 필요한 의존성을 자동으로 받습니다.

## 서버 실행

백엔드와 프론트엔드는 각각 다른 PowerShell 창에서 실행합니다.

### 1. 백엔드 실행

```powershell
cd D:\workspace\PassMate\backend
mvn spring-boot:run
```

백엔드 서버 주소:

```text
http://localhost:8080/api
```

H2 콘솔:

```text
http://localhost:8080/api/h2-console
```

H2 접속 정보:

```text
JDBC URL: jdbc:h2:file:./data/passmate
User Name: sa
Password:
```

비밀번호는 비워 둡니다.

### 2. 프론트엔드 실행

```powershell
cd D:\workspace\PassMate\frontend
npm.cmd run dev
```

프론트엔드 주소:

```text
http://localhost:3000
```

프론트엔드는 기본적으로 아래 API 주소를 사용합니다.

```text
http://localhost:8080/api
```

다른 백엔드 주소를 사용해야 하면 `frontend/.env.local`에 값을 추가합니다.

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

## 개발 검증 명령

백엔드 컴파일 및 테스트:

```powershell
cd D:\workspace\PassMate\backend
mvn test
```

프론트엔드 타입 체크:

```powershell
cd D:\workspace\PassMate\frontend
npm.cmd run type-check
```

프론트엔드 프로덕션 빌드:

```powershell
cd D:\workspace\PassMate\frontend
npm.cmd run build
```

## 현재 MVP1 흐름

현재 구현된 주요 흐름은 다음과 같습니다.

1. 사용자 생성 또는 기존 사용자 선택
2. Deck 생성 및 목록 조회
3. Deck 안에 Category 생성
4. Category 안에 Material 생성
5. Material 안에 FlashCard 생성

ReviewHistory 도메인과 API 골격은 있지만, 프론트엔드의 복습 화면은 아직 MVP 구현이 더 필요합니다.

## 프로젝트 구조

```text
PassMate/
  backend/
    src/main/java/com/passmate/
    src/main/resources/application.yml
    pom.xml
  frontend/
    src/app/
    src/components/
    src/lib/
    src/types/
    package.json
  docs/
    architecture/
```

## 로컬 데이터

백엔드는 H2 file DB를 사용합니다.

로컬 DB 파일은 `backend/data/` 아래에 생성되며 Git에 커밋하지 않습니다.

로컬 데이터를 초기화하려면 서버를 종료한 뒤 `backend/data/` 폴더를 삭제하고 다시 실행합니다.

## 자주 생기는 문제

### 프론트엔드에서 API 요청이 실패하는 경우

- 백엔드가 먼저 실행 중인지 확인합니다.
- 백엔드 주소가 `http://localhost:8080/api`인지 확인합니다.
- 브라우저 콘솔에서 CORS 또는 네트워크 에러를 확인합니다.

### 8080 또는 3000 포트가 이미 사용 중인 경우

이미 실행 중인 Spring Boot 또는 Next.js 프로세스를 종료한 뒤 다시 실행합니다.

### Git에서 dubious ownership 경고가 나오는 경우

Windows 사용자나 실행 계정이 달라서 발생할 수 있습니다.

```powershell
git config --global --add safe.directory D:/workspace/PassMate
```

## 참고 문서

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [SPRING.md](SPRING.md)
- [FRONTEND.md](FRONTEND.md)
- [API_STYLE.md](API_STYLE.md)
- [docs/architecture](docs/architecture)
