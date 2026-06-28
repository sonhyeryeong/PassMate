# PassMate Spring Boot 규칙

## 목적

이 문서는 PassMate 백엔드의 Spring Boot 구현 규칙이다.

백엔드는 명확한 도메인 경계, 얇은 Controller, 검증 가능한 Service, 안전한 JPA 사용을 우선한다.

## 기본 원칙

- Controller에는 비즈니스 로직을 넣지 않는다.
- Entity를 API 응답으로 직접 반환하지 않는다.
- Request DTO와 Response DTO를 분리한다.
- 트랜잭션 범위는 최소화한다.
- 조회 로직과 변경 로직을 명확히 구분한다.
- 인증, 권한, 데이터 소유권 검사는 보수적으로 처리한다.

## 패키지 구조

기본 도메인 구조는 다음을 따른다.

```text
domain/
  user/
  deck/
  category/
  material/
  flashcard/
  review/
```

각 도메인은 필요한 범위에서 아래 구조를 사용한다.

```text
controller/
service/
repository/
entity/
dto/
```

예시:

```text
domain/
  deck/
    controller/
    service/
    repository/
    entity/
    dto/
```

공통 예외, 공통 응답, 설정, 보안 설정은 도메인 패키지에 섞지 않고 별도 공통 패키지에 둔다.

## Controller

- Controller는 얇게 유지한다.
- 요청 검증, 인증 정보 전달, Service 호출, 응답 반환만 담당한다.
- 비즈니스 규칙을 Controller에 작성하지 않는다.
- `@Valid`를 사용해 Request DTO를 검증한다.
- Entity를 직접 반환하지 않는다.

## Service

- 핵심 비즈니스 로직은 Service에 둔다.
- Service 메서드는 하나의 유스케이스를 표현하게 작성한다.
- 읽기 전용 메서드에는 `@Transactional(readOnly = true)`를 사용한다.
- 변경 작업에는 명확한 트랜잭션 경계를 둔다.
- 외부 API 호출과 DB 트랜잭션을 같은 범위에 오래 묶지 않는다.

## Repository

- 단순 CRUD는 Spring Data JPA Repository를 사용한다.
- 복잡한 조회는 별도 Repository 구현이나 QueryDSL 사용을 고려한다.
- Controller나 DTO에서 직접 Repository를 호출하지 않는다.
- N+1 문제가 생길 수 있는 조회는 fetch join, EntityGraph, 전용 조회 쿼리를 검토한다.

## Entity

- Entity는 DB 매핑과 도메인 상태 변경 책임을 가진다.
- Entity에 화면 응답 형식이나 API 전용 로직을 넣지 않는다.
- Setter를 무분별하게 열지 않는다.
- 상태 변경 메서드는 의도가 드러나는 이름을 사용한다.
- 연관관계는 필요한 방향으로만 둔다.

## DTO

Entity 직접 반환은 금지한다.

Request DTO와 Response DTO를 분리한다.

예시:

```text
CreateDeckRequest
UpdateDeckRequest
DeckResponse
TodayReviewResponse
ReviewResultRequest
```

DTO 이름은 유스케이스와 응답 목적이 드러나게 짓는다.

## JPA

- Lazy Loading을 기본으로 한다.
- 즉시 로딩은 명확한 이유가 있을 때만 사용한다.
- 양방향 연관관계는 꼭 필요할 때만 사용한다.
- N+1 문제를 항상 의식한다.
- 대량 조회, 통계, 목록 화면은 전용 조회 쿼리를 고려한다.
- 영속성 컨텍스트 밖에서 Lazy Loading이 터지지 않게 DTO 변환 위치를 신중히 정한다.

## 트랜잭션

- 트랜잭션 범위는 가능한 한 작게 유지한다.
- 조회에는 `readOnly = true`를 적극 사용한다.
- 외부 API 호출과 DB 작업은 가능한 한 분리한다.
- 한 트랜잭션 안에서 너무 많은 책임을 처리하지 않는다.
- 실패 시 롤백되어야 하는 단위를 명확히 한다.

## Exception

- `GlobalExceptionHandler`를 사용한다.
- `RuntimeException`을 직접 던지지 않는다.
- 도메인별 커스텀 Exception을 사용한다.
- 에러 응답은 `API_STYLE.md`의 형식을 따른다.
- 내부 구현 세부사항이나 민감한 정보를 에러 메시지에 노출하지 않는다.

## Validation

- Request DTO에는 필요한 Bean Validation을 작성한다.
- Service에서는 비즈니스 규칙 검증을 수행한다.
- 존재 여부, 소유권, 상태 전이 가능 여부를 명확히 검증한다.

## 테스트

- Service의 핵심 비즈니스 규칙은 단위 테스트를 작성한다.
- Repository의 복잡한 쿼리는 통합 테스트를 고려한다.
- Controller는 요청 검증과 응답 형식 중심으로 테스트한다.
- 버그 수정 시 재발 방지 테스트를 추가한다.

