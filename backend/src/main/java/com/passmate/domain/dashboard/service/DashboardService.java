package com.passmate.domain.dashboard.service;

import com.passmate.domain.dashboard.dto.DashboardDto;
import com.passmate.domain.dashboard.provider.LearningQueueSummaryProvider;
import com.passmate.domain.deck.repository.DeckRepository;
import com.passmate.domain.error.ResourceNotFoundException;
import com.passmate.domain.user.entity.User;
import com.passmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final List<LearningQueueSummaryProvider> learningQueueSummaryProviders;

    public DashboardDto.Response getDashboard(Long userId, LocalDateTime now) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "USER_NOT_FOUND",
                        "프로필을 찾을 수 없습니다."
                ));

        List<DashboardDto.LearningQueue> learningQueues = learningQueueSummaryProviders.stream()
                .map(provider -> provider.getSummary(userId, now))
                .toList();

        long pendingLearningCount = learningQueues.stream()
                .mapToLong(DashboardDto.LearningQueue::getPendingCount)
                .sum();
        long completedTodayCount = learningQueues.stream()
                .mapToLong(DashboardDto.LearningQueue::getCompletedTodayCount)
                .sum();

        return DashboardDto.Response.builder()
                .user(DashboardDto.UserSummary.builder()
                        .id(user.getId())
                        .nickname(user.getNickname())
                        .build())
                .summary(DashboardDto.Summary.builder()
                        .pendingLearningCount(pendingLearningCount)
                        .completedTodayCount(completedTodayCount)
                        .folderCount(deckRepository.countByUserId(userId))
                        .build())
                .learningQueues(learningQueues)
                .calculatedAt(now)
                .build();
    }
}
