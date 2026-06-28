package com.passmate.domain.flashcard.controller;

import com.passmate.domain.flashcard.dto.FlashCardDto;
import com.passmate.domain.flashcard.service.FlashCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/materials/{materialId}/cards")
@RequiredArgsConstructor
public class FlashCardController {

    private final FlashCardService flashCardService;

    @GetMapping
    public ResponseEntity<FlashCardDto.ListResponse> getMaterialFlashCards(
            @PathVariable Long materialId) {
        return ResponseEntity.ok(flashCardService.getMaterialFlashCards(materialId));
    }

    @GetMapping("/{cardId}")
    public ResponseEntity<FlashCardDto.Response> getFlashCard(
            @PathVariable Long materialId,
            @PathVariable Long cardId) {
        return ResponseEntity.ok(flashCardService.getFlashCard(cardId, materialId));
    }

    @PostMapping
    public ResponseEntity<FlashCardDto.Response> createFlashCard(
            @PathVariable Long materialId,
            @RequestBody FlashCardDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(flashCardService.createFlashCard(materialId, request));
    }

    @PatchMapping("/{cardId}")
    public ResponseEntity<FlashCardDto.Response> updateFlashCard(
            @PathVariable Long materialId,
            @PathVariable Long cardId,
            @RequestBody FlashCardDto.UpdateRequest request) {
        return ResponseEntity.ok(flashCardService.updateFlashCard(cardId, materialId, request));
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> deleteFlashCard(
            @PathVariable Long materialId,
            @PathVariable Long cardId) {
        flashCardService.deleteFlashCard(cardId, materialId);
        return ResponseEntity.noContent().build();
    }
}
