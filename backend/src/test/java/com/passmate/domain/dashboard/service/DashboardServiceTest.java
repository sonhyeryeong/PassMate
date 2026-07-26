package com.passmate.domain.dashboard.service;

import com.passmate.domain.dashboard.dto.DashboardDto;
import com.passmate.domain.dashboard.provider.LearningQueueSummaryProvider;
import com.passmate.domain.deck.repository.DeckRepository;
import com.passmate.domain.error.ResourceNotFoundException;
import com.passmate.domain.user.entity.User;
import com.passmate.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private LearningQueueSummaryProvider firstProvider;

    @Mock
    private LearningQueueSummaryProvider secondProvider;

    @Test
    void aggregatesAllLearningQueueSummaries() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 26, 14, 30);
        User user = User.builder()
                .id(1L)
                .nickname("수진")
                .email("sujin@example.com")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(deckRepository.countByUserId(1L)).thenReturn(3L);
        when(firstProvider.getSummary(1L, now)).thenReturn(queue("FLASH_CARD_REVIEW", 12, 5));
        when(secondProvider.getSummary(1L, now)).thenReturn(queue("LISTENING_REVIEW", 4, 2));

        DashboardService service = new DashboardService(
                userRepository,
                deckRepository,
                List.of(firstProvider, secondProvider)
        );

        DashboardDto.Response response = service.getDashboard(1L, now);

        assertEquals(1L, response.getUser().getId());
        assertEquals("수진", response.getUser().getNickname());
        assertEquals(16L, response.getSummary().getPendingLearningCount());
        assertEquals(7L, response.getSummary().getCompletedTodayCount());
        assertEquals(3L, response.getSummary().getFolderCount());
        assertEquals(2, response.getLearningQueues().size());
        assertEquals(now, response.getCalculatedAt());
    }

    @Test
    void rejectsUnknownUserBeforeCollectingSummaries() {
        LocalDateTime now = LocalDateTime.of(2026, 7, 26, 14, 30);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        DashboardService service = new DashboardService(
                userRepository,
                deckRepository,
                List.of(firstProvider)
        );

        assertThrows(ResourceNotFoundException.class, () -> service.getDashboard(99L, now));
        verify(firstProvider, never()).getSummary(99L, now);
        verify(deckRepository, never()).countByUserId(99L);
    }

    private DashboardDto.LearningQueue queue(
            String type,
            long pendingCount,
            long completedTodayCount) {
        return DashboardDto.LearningQueue.builder()
                .type(type)
                .pendingCount(pendingCount)
                .completedTodayCount(completedTodayCount)
                .build();
    }
}
