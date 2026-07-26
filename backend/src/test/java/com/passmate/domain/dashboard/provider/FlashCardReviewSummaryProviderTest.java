package com.passmate.domain.dashboard.provider;

import com.passmate.domain.dashboard.dto.DashboardDto;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FlashCardReviewSummaryProviderTest {

    @Mock
    private FlashCardRepository flashCardRepository;

    @Mock
    private ReviewHistoryRepository reviewHistoryRepository;

    @InjectMocks
    private FlashCardReviewSummaryProvider provider;

    @Test
    void returnsPendingAndCompletedCountsForToday() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 26, 14, 30);
        LocalDateTime startAt = LocalDateTime.of(2026, 7, 26, 0, 0);
        LocalDateTime endAt = LocalDateTime.of(2026, 7, 27, 0, 0);
        when(flashCardRepository.countDueCardsByUserId(1L, now)).thenReturn(12L);
        when(reviewHistoryRepository
                .countByUserIdAndReviewedAtGreaterThanEqualAndReviewedAtLessThan(1L, startAt, endAt))
                .thenReturn(5L);

        DashboardDto.LearningQueue summary = provider.getSummary(1L, now);

        assertEquals(FlashCardReviewSummaryProvider.TYPE, summary.getType());
        assertEquals(12L, summary.getPendingCount());
        assertEquals(5L, summary.getCompletedTodayCount());
    }
}
