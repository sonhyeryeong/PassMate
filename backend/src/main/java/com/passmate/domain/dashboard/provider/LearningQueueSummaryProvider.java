package com.passmate.domain.dashboard.provider;

import com.passmate.domain.dashboard.dto.DashboardDto;

import java.time.LocalDateTime;

public interface LearningQueueSummaryProvider {

    DashboardDto.LearningQueue getSummary(Long userId, LocalDateTime now);
}
