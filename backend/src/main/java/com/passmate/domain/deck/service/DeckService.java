package com.passmate.domain.deck.service;

import com.passmate.domain.deck.dto.DeckDto;
import com.passmate.domain.deck.entity.Deck;
import com.passmate.domain.deck.repository.DeckRepository;
import com.passmate.domain.error.ResourceNotFoundException;
import com.passmate.domain.error.InvalidRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeckService {

    private final DeckRepository deckRepository;

    public DeckDto.Response getDeck(Long deckId, Long userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("DECK_NOT_FOUND", "폴더를 찾을 수 없습니다."));
        return toResponse(deck);
    }

    public DeckDto.ListResponse getUserDecks(Long userId) {
        List<Deck> decks = deckRepository.findByUserId(userId);
        List<DeckDto.Response> items = decks.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return DeckDto.ListResponse.builder()
                .items(items)
                .build();
    }

    @Transactional
    public DeckDto.Response createDeck(Long userId, DeckDto.CreateRequest request) {
        validateName(request != null ? request.getName() : null);
        Deck deck = Deck.builder()
                .userId(userId)
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Deck savedDeck = deckRepository.save(deck);
        return toResponse(savedDeck);
    }

    @Transactional
    public DeckDto.Response updateDeck(Long deckId, Long userId, DeckDto.UpdateRequest request) {
        validateName(request != null ? request.getName() : null);
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("DECK_NOT_FOUND", "폴더를 찾을 수 없습니다."));

        deck.update(request.getName(), request.getDescription());
        Deck updatedDeck = deckRepository.save(deck);
        return toResponse(updatedDeck);
    }

    @Transactional
    public void deleteDeck(Long deckId, Long userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("DECK_NOT_FOUND", "폴더를 찾을 수 없습니다."));
        deckRepository.delete(deck);
    }

    private DeckDto.Response toResponse(Deck deck) {
        return DeckDto.Response.builder()
                .id(deck.getId())
                .userId(deck.getUserId())
                .name(deck.getName())
                .description(deck.getDescription())
                .createdAt(deck.getCreatedAt())
                .updatedAt(deck.getUpdatedAt())
                .build();
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidRequestException("DECK_VALIDATION_ERROR", "폴더 이름을 입력해 주세요.");
        }
    }
}
