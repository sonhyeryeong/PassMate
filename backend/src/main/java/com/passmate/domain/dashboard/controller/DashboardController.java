package com.passmate.domain.dashboard.controller;

import com.passmate.domain.dashboard.dto.DashboardDto;
import com.passmate.domain.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardDto.Response> getDashboard(
            @RequestParam Long userId,
            @RequestParam(required = false) LocalDateTime date) {
        LocalDateTime calculatedAt = date != null ? date : LocalDateTime.now();
        return ResponseEntity.ok(dashboardService.getDashboard(userId, calculatedAt));
    }
}
