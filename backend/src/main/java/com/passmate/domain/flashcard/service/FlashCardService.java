package com.passmate.domain.flashcard.service;

import com.passmate.domain.flashcard.dto.FlashCardDto;
import com.passmate.domain.flashcard.entity.FlashCard;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
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

    public FlashCardDto.Response getFlashCard(Long flashCardId, Long materialId) {
        FlashCard flashCard = flashCardRepository.findByIdAndMaterialId(flashCardId, materialId)
                .orElseThrow(() -> new IllegalArgumentException("FlashCard not found"));
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
        FlashCard flashCard = FlashCard.builder()
                .materialId(materialId)
                .front(request.getFront())
                .back(request.getBack())
                .build();

        FlashCard savedFlashCard = flashCardRepository.save(flashCard);
        return toResponse(savedFlashCard);
    }

    @Transactional
    public FlashCardDto.Response updateFlashCard(Long flashCardId, Long materialId, FlashCardDto.UpdateRequest request) {
        FlashCard flashCard = flashCardRepository.findByIdAndMaterialId(flashCardId, materialId)
                .orElseThrow(() -> new IllegalArgumentException("FlashCard not found"));

        flashCard.update(request.getFront(), request.getBack());
        FlashCard updatedFlashCard = flashCardRepository.save(flashCard);
        return toResponse(updatedFlashCard);
    }

    @Transactional
    public void deleteFlashCard(Long flashCardId, Long materialId) {
        FlashCard flashCard = flashCardRepository.findByIdAndMaterialId(flashCardId, materialId)
                .orElseThrow(() -> new IllegalArgumentException("FlashCard not found"));
        flashCardRepository.delete(flashCard);
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
