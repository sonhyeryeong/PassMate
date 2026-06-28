package com.passmate.domain.deck.controller;

import com.passmate.domain.deck.dto.DeckDto;
import com.passmate.domain.deck.service.DeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;

    @GetMapping
    public ResponseEntity<DeckDto.ListResponse> getUserDecks(
            @RequestParam(required = false) Long userId) {
        // TODO: 인증 시스템 구현 후 userId는 현재 사용자로 대체
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        return ResponseEntity.ok(deckService.getUserDecks(userId));
    }

    @GetMapping("/{deckId}")
    public ResponseEntity<DeckDto.Response> getDeck(
            @PathVariable Long deckId,
            @RequestParam(required = false) Long userId) {
        // TODO: 인증 시스템 구현 후 userId는 현재 사용자로 대체
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        return ResponseEntity.ok(deckService.getDeck(deckId, userId));
    }

    @PostMapping
    public ResponseEntity<DeckDto.Response> createDeck(
            @RequestParam(required = false) Long userId,
            @RequestBody DeckDto.CreateRequest request) {
        // TODO: 인증 시스템 구현 후 userId는 현재 사용자로 대체
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(deckService.createDeck(userId, request));
    }

    @PatchMapping("/{deckId}")
    public ResponseEntity<DeckDto.Response> updateDeck(
            @PathVariable Long deckId,
            @RequestParam(required = false) Long userId,
            @RequestBody DeckDto.UpdateRequest request) {
        // TODO: 인증 시스템 구현 후 userId는 현재 사용자로 대체
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        return ResponseEntity.ok(deckService.updateDeck(deckId, userId, request));
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<Void> deleteDeck(
            @PathVariable Long deckId,
            @RequestParam(required = false) Long userId) {
        // TODO: 인증 시스템 구현 후 userId는 현재 사용자로 대체
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        deckService.deleteDeck(deckId, userId);
        return ResponseEntity.noContent().build();
    }
}
