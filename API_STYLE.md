# PassMate API 스타일 규칙

## 목적

이 문서는 PassMate API의 URL, 응답, 에러, 상태 코드 스타일을 통일하기 위한 규칙이다.

API는 프론트엔드가 예측 가능하게 사용할 수 있도록 단순하고 일관되게 설계한다.

## 기본 원칙

- URL은 리소스 중심으로 설계한다.
- HTTP Method로 행동을 표현한다.
- 응답 형식은 일관되게 유지한다.
- Entity를 직접 노출하지 않는다.
- 에러는 기계가 읽을 수 있는 `code`와 사용자가 이해할 수 있는 `message`를 포함한다.

## URL 규칙

기본 prefix는 `/api`를 사용한다.

```text
/api/users
/api/decks
/api/categories
/api/materials
/api/cards
/api/reviews
```

리소스 이름은 복수형을 사용한다.

예시:

```text
GET    /api/decks
POST   /api/decks
GET    /api/decks/{deckId}
PATCH  /api/decks/{deckId}
DELETE /api/decks/{deckId}
```

하위 리소스가 명확한 경우 중첩 URL을 사용할 수 있다.

```text
GET  /api/decks/{deckId}/categories
GET  /api/materials/{materialId}/cards
POST /api/cards/{cardId}/reviews
```

## HTTP Method

- `GET`: 조회
- `POST`: 생성 또는 명령성 작업
- `PATCH`: 일부 수정
- `PUT`: 전체 교체가 명확할 때만 사용
- `DELETE`: 삭제

## 성공 응답

단일 리소스 응답 예시:

```json
{
  "id": 1,
  "name": "정보처리기사"
}
```

목록 응답 예시:

```json
{
  "items": [
    {
      "id": 1,
      "name": "정보처리기사"
    }
  ]
}
```

페이지네이션이 필요한 경우:

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

## 에러 응답

에러 응답은 다음 형식을 따른다.

```json
{
  "code": "DECK_NOT_FOUND",
  "message": "Deck을 찾을 수 없습니다."
}
```

필드 검증 에러가 필요한 경우:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "입력값을 확인해주세요.",
  "fields": [
    {
      "field": "name",
      "message": "이름은 필수입니다."
    }
  ]
}
```

## 상태 코드

- `200 OK`: 조회 또는 수정 성공
- `201 Created`: 생성 성공
- `204 No Content`: 응답 본문 없는 삭제 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `409 Conflict`: 현재 상태와 충돌
- `500 Internal Server Error`: 서버 오류

## 네이밍

- JSON 필드는 camelCase를 사용한다.
- DB 컬럼명이나 Java 필드명을 API에 그대로 노출하지 않는다.
- ID 필드는 문맥이 명확하면 `id`, 중첩 문맥에서는 `deckId`, `materialId`처럼 작성한다.

## 보안

- 클라이언트에 내부 예외명, 스택트레이스, SQL, 서버 경로를 노출하지 않는다.
- 인증이 필요한 API는 명확히 보호한다.
- 사용자 소유 리소스는 항상 소유권을 확인한다.

