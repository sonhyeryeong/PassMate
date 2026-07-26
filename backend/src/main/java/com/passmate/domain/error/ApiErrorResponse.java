package com.passmate.domain.error;

public record ApiErrorResponse(
        String code,
        String message
) {
}
