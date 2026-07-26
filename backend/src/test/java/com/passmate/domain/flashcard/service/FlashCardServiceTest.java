package com.passmate.domain.flashcard.service;

import com.passmate.domain.flashcard.dto.FlashCardDto;
import com.passmate.domain.flashcard.entity.FlashCard;
import com.passmate.domain.flashcard.exception.CardValidationException;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FlashCardServiceTest {

    @Mock
    private FlashCardRepository flashCardRepository;

    @Mock
    private ReviewHistoryRepository reviewHistoryRepository;

    @InjectMocks
    private FlashCardService flashCardService;

    @Test
    void createFlashCardRejectsBlankContent() {
        FlashCardDto.CreateRequest request = FlashCardDto.CreateRequest.builder()
                .front(" ")
                .back("답변")
                .build();

        assertThrows(
                CardValidationException.class,
                () -> flashCardService.createFlashCard(1L, request)
        );
        verify(flashCardRepository, never()).save(any());
    }

    @Test
    void createFlashCardRejectsNullRequest() {
        assertThrows(
                CardValidationException.class,
                () -> flashCardService.createFlashCard(1L, null)
        );
        verify(flashCardRepository, never()).save(any());
    }

    @Test
    void createFlashCardRejectsBlankBack() {
        FlashCardDto.CreateRequest request = FlashCardDto.CreateRequest.builder()
                .front("질문")
                .back(" ")
                .build();

        assertThrows(
                CardValidationException.class,
                () -> flashCardService.createFlashCard(1L, request)
        );
        verify(flashCardRepository, never()).save(any());
    }

    @Test
    void createFlashCardAllowsBoundaryLengthsAndTrimsContent() {
        String front = "가".repeat(300);
        String back = "나".repeat(600);
        FlashCardDto.CreateRequest request = FlashCardDto.CreateRequest.builder()
                .front(" " + front + " ")
                .back(" " + back + " ")
                .build();
        when(flashCardRepository.save(any(FlashCard.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        FlashCardDto.Response response = flashCardService.createFlashCard(1L, request);

        assertEquals(front, response.getFront());
        assertEquals(back, response.getBack());
        verify(flashCardRepository).save(argThat(card ->
                front.equals(card.getFront()) && back.equals(card.getBack())
        ));
    }

    @Test
    void createFlashCardRejectsContentOverMaximumLength() {
        FlashCardDto.CreateRequest request = FlashCardDto.CreateRequest.builder()
                .front("가".repeat(301))
                .back("답변")
                .build();

        assertThrows(
                CardValidationException.class,
                () -> flashCardService.createFlashCard(1L, request)
        );
        verify(flashCardRepository, never()).save(any());
    }

    @Test
    void updateFlashCardRejectsBackOverMaximumLengthBeforeLookup() {
        FlashCardDto.UpdateRequest request = FlashCardDto.UpdateRequest.builder()
                .front("질문")
                .back("나".repeat(601))
                .build();

        assertThrows(
                CardValidationException.class,
                () -> flashCardService.updateFlashCard(3L, 2L, request)
        );
        verify(flashCardRepository, never()).findByIdAndMaterialId(3L, 2L);
    }

    @Test
    void deleteFlashCardDeletesReviewHistoryFirst() {
        FlashCard flashCard = FlashCard.builder()
                .id(3L)
                .materialId(2L)
                .front("질문")
                .back("답변")
                .build();
        when(flashCardRepository.findByIdAndMaterialId(3L, 2L))
                .thenReturn(Optional.of(flashCard));

        flashCardService.deleteFlashCard(3L, 2L);

        InOrder inOrder = inOrder(reviewHistoryRepository, flashCardRepository);
        inOrder.verify(reviewHistoryRepository).deleteByFlashCardId(3L);
        inOrder.verify(flashCardRepository).delete(flashCard);
    }
}
