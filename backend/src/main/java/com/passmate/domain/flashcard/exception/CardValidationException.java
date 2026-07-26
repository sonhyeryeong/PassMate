package com.passmate.domain.flashcard.exception;

import com.passmate.domain.error.InvalidRequestException;

public class CardValidationException extends InvalidRequestException {

    public CardValidationException(String message) {
        super("CARD_VALIDATION_ERROR", message);
    }
}
