package com.passmate.domain.error;

import com.passmate.domain.flashcard.exception.CardValidationException;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void returnsConfiguredStatusAndContractForApiException() {
        ResponseEntity<ApiErrorResponse> response = handler.handleApiException(
                new ResourceNotFoundException("DECK_NOT_FOUND", "폴더를 찾을 수 없습니다.")
        );

        assertEquals(404, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("DECK_NOT_FOUND", response.getBody().code());
        assertEquals("폴더를 찾을 수 없습니다.", response.getBody().message());
    }

    @Test
    void cardValidationUsesCommonBadRequestContract() {
        ResponseEntity<ApiErrorResponse> response = handler.handleApiException(
                new CardValidationException("카드 앞면을 입력해 주세요.")
        );

        assertEquals(400, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("CARD_VALIDATION_ERROR", response.getBody().code());
    }

    @Test
    void hidesUnexpectedExceptionDetails() {
        ResponseEntity<ApiErrorResponse> response = handler.handleUnexpectedException(
                new RuntimeException("unexpected implementation detail")
        );

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().code());
        assertEquals(
                "서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
                response.getBody().message()
        );
    }
}
