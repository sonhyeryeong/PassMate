package com.passmate.domain.dashboard.provider;

import com.passmate.domain.dashboard.dto.DashboardDto;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class FlashCardReviewSummaryProvider implements LearningQueueSummaryProvider {

    public static final String TYPE = "FLASH_CARD_REVIEW";

    private final FlashCardRepository flashCardRepository;
    private final ReviewHistoryRepository reviewHistoryRepository;

    @Override
    public DashboardDto.LearningQueue getSummary(Long userId, LocalDateTime now) {
        LocalDateTime startAt = now.toLocalDate().atStartOfDay();
        LocalDateTime endAt = startAt.plusDays(1);

        return DashboardDto.LearningQueue.builder()
                .type(TYPE)
                .pendingCount(flashCardRepository.countDueCardsByUserId(userId, now))
                .completedTodayCount(
                        reviewHistoryRepository.countByUserIdAndReviewedAtGreaterThanEqualAndReviewedAtLessThan(
                                userId,
                                startAt,
                                endAt
                        )
                )
                .build();
    }
}
