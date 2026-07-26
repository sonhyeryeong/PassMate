package com.passmate.common.exception;

import com.passmate.domain.flashcard.exception.ApiErrorResponse;
import com.passmate.domain.flashcard.exception.CardValidationException;
import com.passmate.domain.flashcard.exception.FlashCardExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class FlashCardExceptionHandlerTest {

    private final FlashCardExceptionHandler handler = new FlashCardExceptionHandler();

    @Test
    void cardValidationReturnsBadRequestContract() {
        ResponseEntity<ApiErrorResponse> response = handler.handleCardValidation(
                new CardValidationException("카드 앞면을 입력해 주세요.")
        );

        assertEquals(400, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("CARD_VALIDATION_ERROR", response.getBody().code());
        assertEquals("카드 앞면을 입력해 주세요.", response.getBody().message());
    }
}
