package com.passmate.domain.flashcard.service;

import com.passmate.domain.flashcard.dto.FlashCardDto;
import com.passmate.domain.flashcard.entity.FlashCard;
import com.passmate.domain.flashcard.exception.CardValidationException;
import com.passmate.domain.error.ResourceNotFoundException;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FlashCardService {

    private final FlashCardRepository flashCardRepository;
    private final ReviewHistoryRepository reviewHistoryRepository;

    public FlashCardDto.Response getFlashCard(Long flashCardId, Long materialId) {
        FlashCard flashCard = flashCardRepository.findByIdAndMaterialId(flashCardId, materialId)
                .orElseThrow(() -> cardNotFound());
        return toResponse(flashCard);
    }

    public FlashCardDto.ListResponse getMaterialFlashCards(Long materialId) {
        List<FlashCard> flashCards = flashCardRepository.findByMaterialId(materialId);
        List<FlashCardDto.Response> items = flashCards.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return FlashCardDto.ListResponse.builder()
                .items(items)
                .build();
    }

    @Transactional
    public FlashCardDto.Response createFlashCard(Long materialId, FlashCardDto.CreateRequest request) {
        validateCard(request != null ? request.getFront() : null, request != null ? request.getBack() : null);
        FlashCard flashCard = FlashCard.builder()
                .materialId(materialId)
                .front(request.getFront().trim())
                .back(request.getBack().trim())
                .build();

        FlashCard savedFlashCard = flashCardRepository.save(flashCard);
        return toResponse(savedFlashCard);
    }

    @Transactional
    public FlashCardDto.Response updateFlashCard(Long flashCardId, Long materialId, FlashCardDto.UpdateRequest request) {
        validateCard(request != null ? request.getFront() : null, request != null ? request.getBack() : null);
        FlashCard flashCard = flashCardRepository.findByIdAndMaterialId(flashCardId, materialId)
                .orElseThrow(() -> cardNotFound());

        flashCard.update(request.getFront().trim(), request.getBack().trim());
        FlashCard updatedFlashCard = flashCardRepository.save(flashCard);
        return toResponse(updatedFlashCard);
    }

    @Transactional
    public void deleteFlashCard(Long flashCardId, Long materialId) {
        FlashCard flashCard = flashCardRepository.findByIdAndMaterialId(flashCardId, materialId)
                .orElseThrow(() -> cardNotFound());
        reviewHistoryRepository.deleteByFlashCardId(flashCardId);
        flashCardRepository.delete(flashCard);
    }

    private void validateCard(String front, String back) {
        if (front == null || front.isBlank()) {
            throw new CardValidationException("카드 앞면을 입력해 주세요.");
        }
        if (back == null || back.isBlank()) {
            throw new CardValidationException("카드 뒷면을 입력해 주세요.");
        }
        if (front.trim().length() > 300) {
            throw new CardValidationException("카드 앞면은 300자 이하로 입력해 주세요.");
        }
        if (back.trim().length() > 600) {
            throw new CardValidationException("카드 뒷면은 600자 이하로 입력해 주세요.");
        }
    }

    private ResourceNotFoundException cardNotFound() {
        return new ResourceNotFoundException("FLASH_CARD_NOT_FOUND", "카드를 찾을 수 없습니다.");
    }

    private FlashCardDto.Response toResponse(FlashCard flashCard) {
        return FlashCardDto.Response.builder()
                .id(flashCard.getId())
                .materialId(flashCard.getMaterialId())
                .front(flashCard.getFront())
                .back(flashCard.getBack())
                .nextReviewAt(flashCard.getNextReviewAt())
                .createdAt(flashCard.getCreatedAt())
                .updatedAt(flashCard.getUpdatedAt())
                .build();
    }
}
