package com.passmate.domain.deck.controller;

import com.passmate.domain.deck.dto.DeckDto;
import com.passmate.domain.deck.service.DeckService;
import lombok.RequiredArgsConstructor;
import com.passmate.common.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/decks")
@RequiredArgsConstructor
public class DeckController {
    private final CurrentUser currentUser;

    private final DeckService deckService;

    @GetMapping
    public ResponseEntity<DeckDto.ListResponse> getUserDecks() {
        Long userId = currentUser.id();
        return ResponseEntity.ok(deckService.getUserDecks(userId));
    }

    @GetMapping("/{deckId}")
    public ResponseEntity<DeckDto.Response> getDeck(
            @PathVariable Long deckId) {
        Long userId = currentUser.id();
        return ResponseEntity.ok(deckService.getDeck(deckId, userId));
    }

    @PostMapping
    public ResponseEntity<DeckDto.Response> createDeck(
            @RequestBody DeckDto.CreateRequest request) {
        Long userId = currentUser.id();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(deckService.createDeck(userId, request));
    }

    @PatchMapping("/{deckId}")
    public ResponseEntity<DeckDto.Response> updateDeck(
            @PathVariable Long deckId,
            @RequestBody DeckDto.UpdateRequest request) {
        Long userId = currentUser.id();
        return ResponseEntity.ok(deckService.updateDeck(deckId, userId, request));
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<Void> deleteDeck(
            @PathVariable Long deckId) {
        Long userId = currentUser.id();
        deckService.deleteDeck(deckId, userId);
        return ResponseEntity.noContent().build();
    }
}
