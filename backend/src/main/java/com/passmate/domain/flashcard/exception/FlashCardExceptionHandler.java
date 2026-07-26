package com.passmate.domain.flashcard.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class FlashCardExceptionHandler {

    @ExceptionHandler(CardValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleCardValidation(CardValidationException exception) {
        ApiErrorResponse response = new ApiErrorResponse(
                "CARD_VALIDATION_ERROR",
                exception.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
