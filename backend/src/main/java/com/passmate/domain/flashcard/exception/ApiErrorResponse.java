package com.passmate.domain.flashcard.exception;

public record ApiErrorResponse(
        String code,
        String message
) {
}
