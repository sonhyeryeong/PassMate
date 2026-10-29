package com.passmate.domain.review.service;

import com.passmate.domain.error.ResourceNotFoundException;
import com.passmate.domain.error.InvalidRequestException;
import com.passmate.domain.flashcard.entity.FlashCard;
import com.passmate.domain.review.dto.ReviewDto;
import com.passmate.domain.review.entity.ReviewHistory;
import com.passmate.domain.review.entity.ReviewResult;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import com.passmate.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewHistoryRepository reviewHistoryRepository;

    @Mock
    private FlashCardRepository flashCardRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReviewService reviewService;

    @ParameterizedTest
    @CsvSource({"AGAIN, 10", "HARD, 1440", "GOOD, 4320", "EASY, 10080"})
    void savesResultAndSchedulesNextReview(ReviewResult result, long intervalMinutes) {
        LocalDateTime reviewedAt = LocalDateTime.of(2026, 10, 31, 23, 55);
        FlashCard card = FlashCard.builder().id(3L).materialId(2L)
                .nextReviewAt(reviewedAt.minusDays(1)).build();
        when(flashCardRepository.findUserFlashCard(1L, 3L)).thenReturn(Optional.of(card));
        when(reviewHistoryRepository.save(any(ReviewHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReviewDto.Response response = reviewService.createReview(1L, 3L,
                ReviewDto.CreateRequest.builder().result(result).reviewedAt(reviewedAt).build());

        ArgumentCaptor<ReviewHistory> captor = ArgumentCaptor.forClass(ReviewHistory.class);
        verify(reviewHistoryRepository).save(captor.capture());
        ReviewHistory saved = captor.getValue();
        assertEquals(1L, saved.getUserId());
        assertEquals(3L, saved.getFlashCardId());
        assertEquals(result, saved.getResult());
        assertEquals(reviewedAt, saved.getReviewedAt());
        assertEquals(reviewedAt.plusMinutes(intervalMinutes), card.getNextReviewAt());
        assertEquals(saved.getUserId(), response.getUserId());
        assertEquals(saved.getFlashCardId(), response.getFlashCardId());
        assertEquals(result, response.getResult());
        assertEquals(reviewedAt, response.getReviewedAt());
    }

    @Test
    void usesServerTimeWhenReviewedAtIsOmitted() {
        FlashCard card = FlashCard.builder().id(3L).materialId(2L).build();
        when(flashCardRepository.findUserFlashCard(1L, 3L)).thenReturn(Optional.of(card));
        when(reviewHistoryRepository.save(any(ReviewHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));
        LocalDateTime before = LocalDateTime.now();

        ReviewDto.Response response = reviewService.createReview(1L, 3L,
                ReviewDto.CreateRequest.builder().result(ReviewResult.GOOD).build());

        LocalDateTime after = LocalDateTime.now();
        assertFalse(response.getReviewedAt().isBefore(before));
        assertFalse(response.getReviewedAt().isAfter(after));
        assertEquals(response.getReviewedAt().plusDays(3), card.getNextReviewAt());
    }

    @ParameterizedTest
    @NullSource
    @MethodSource("requestsWithoutResult")
    void rejectsMissingResultBeforeAccessingData(ReviewDto.CreateRequest request) {
        InvalidRequestException exception = assertThrows(InvalidRequestException.class,
                () -> reviewService.createReview(1L, 3L, request));

        assertEquals("REVIEW_RESULT_REQUIRED", exception.getCode());
        verifyNoInteractions(flashCardRepository, reviewHistoryRepository);
    }

    private static Stream<ReviewDto.CreateRequest> requestsWithoutResult() {
        return Stream.of(ReviewDto.CreateRequest.builder().build());
    }

    @Test
    void rejectsMissingOrUnownedCardWithoutSavingHistory() {
        when(flashCardRepository.findUserFlashCard(1L, 3L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> reviewService.createReview(1L, 3L,
                        ReviewDto.CreateRequest.builder().result(ReviewResult.GOOD).build()));

        assertEquals("FLASH_CARD_NOT_FOUND", exception.getCode());
        verifyNoInteractions(reviewHistoryRepository);
    }

    @Test
    void propagatesHistorySaveFailure() {
        FlashCard card = FlashCard.builder().id(3L).materialId(2L).build();
        when(flashCardRepository.findUserFlashCard(1L, 3L)).thenReturn(Optional.of(card));
        IllegalStateException failure = new IllegalStateException("저장 실패");
        when(reviewHistoryRepository.save(any(ReviewHistory.class))).thenThrow(failure);

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> reviewService.createReview(1L, 3L,
                        ReviewDto.CreateRequest.builder().result(ReviewResult.GOOD).build()));

        assertSame(failure, exception);
    }

    @Test
    void rejectsHistoryRequestForMissingUser() {
        when(userRepository.existsById(99L)).thenReturn(false);

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> reviewService.getUserReviewHistory(99L)
        );

        assertEquals("USER_NOT_FOUND", exception.getCode());
        verify(reviewHistoryRepository, never()).findHistoryItemsByUserId(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.any(Pageable.class)
        );
    }

    @Test
    void limitsRecentHistoryToOneHundredItems() {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(reviewHistoryRepository.findHistoryItemsByUserId(
                org.mockito.ArgumentMatchers.eq(1L),
                org.mockito.ArgumentMatchers.any(Pageable.class)
        )).thenReturn(List.of());

        reviewService.getUserReviewHistory(1L);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(reviewHistoryRepository).findHistoryItemsByUserId(
                org.mockito.ArgumentMatchers.eq(1L),
                pageableCaptor.capture()
        );
        assertEquals(0, pageableCaptor.getValue().getPageNumber());
        assertEquals(100, pageableCaptor.getValue().getPageSize());
    }
}
