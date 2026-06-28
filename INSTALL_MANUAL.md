# PassMate 개발환경 - 빠른 설치 가이드

## 3가지 도구 설치 (2026년 1월 기준)

### 1. Java 17 설치 (필수)
**Temurin OpenJDK 17** (무료, 안정적)
- https://github.com/adoptium/temurin17-binaries/releases
- 또는 직접: https://adoptium.net/temurin/releases/?version=17
- Windows x64 `.msi` 파일 다운로드 → 실행

### 2. Node.js 설치 (필수)
**Node.js LTS** 
- https://nodejs.org/en/download/
- Windows 64-bit LTS 클릭 → `.msi` 파일 다운로드 → 실행
- npm은 자동으로 설치됨

### 3. Maven 설치 (필수)
**Apache Maven 3.9.6**
- 다운로드: https://maven.apache.org/download.cgi
- 또는 직접: https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip

**설치 방법:**
```
1. ZIP 파일 다운로드
2. C:\tools\ 폴더 생성 (없으면)
3. C:\tools\apache-maven-3.9.6 에 압축 해제
4. 환경변수 설정:
   - 시작 → "환경 변수" 검색
   - 시스템 변수에서 "새로 만들기"
   - 변수 이름: M2_HOME
   - 변수 값: C:\tools\apache-maven-3.9.6
   
5. PATH 편집:
   - PATH 선택 → 편집
   - 새로 추가: %M2_HOME%\bin
   
6. 적용 후 새 PowerShell/CMD 열기
```

## 설치 완료 확인 (새 창에서)

```powershell
java -version
node -v
npm -v
mvn -v
```

모두 버전이 출력되면 ✓ 완료!
