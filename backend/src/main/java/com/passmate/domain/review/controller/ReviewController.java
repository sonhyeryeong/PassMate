package com.passmate.domain.review.controller;

import com.passmate.domain.review.dto.ReviewDto;
import com.passmate.domain.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import com.passmate.common.security.CurrentUser;
import com.passmate.common.security.Ownership;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final CurrentUser currentUser;
    private final Ownership ownership;


    private final ReviewService reviewService;

    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewDto.Response> getReview(@PathVariable Long reviewId) {
        Long userId = currentUser.id();
        ownership.review(reviewId);
        return ResponseEntity.ok(reviewService.getReview(reviewId));
    }

    @GetMapping("/cards/{cardId}")
    public ResponseEntity<ReviewDto.ListResponse> getFlashCardReviews(@PathVariable Long cardId) {
        Long userId = currentUser.id();
        ownership.card(cardId);
        return ResponseEntity.ok(reviewService.getFlashCardReviews(cardId));
    }

    @GetMapping("/history/raw")
    public ResponseEntity<ReviewDto.ListResponse> getUserReviews() {
        Long userId = currentUser.id();
        return ResponseEntity.ok(reviewService.getUserReviews(userId));
    }

    @GetMapping("/history")
    public ResponseEntity<ReviewDto.HistoryListResponse> getUserReviewHistory() {
        Long userId = currentUser.id();
        return ResponseEntity.ok(reviewService.getUserReviewHistory(userId));
    }

    @GetMapping("/today")
    public ResponseEntity<ReviewDto.TodayReviewResponse> getUserTodayReviews(
            @RequestParam(required = false) LocalDateTime date,
            @RequestParam(required = false) Long materialId) {
        Long userId = currentUser.id();
        LocalDateTime reviewDate = date != null ? date : LocalDateTime.now();
        return ResponseEntity.ok(reviewService.getUserTodayReviewCards(userId, reviewDate, materialId));
    }

    @GetMapping("/history/today")
    public ResponseEntity<ReviewDto.UserReviewListResponse> getUserTodayReviewHistory(
            @RequestParam(required = false) LocalDateTime date) {
        Long userId = currentUser.id();
        LocalDateTime reviewDate = date != null ? date : LocalDateTime.now();
        return ResponseEntity.ok(reviewService.getUserTodayReviews(userId, reviewDate));
    }

    @PostMapping("/cards/{cardId}")
    public ResponseEntity<ReviewDto.Response> createReview(
            @PathVariable Long cardId,
            @RequestBody ReviewDto.CreateRequest request) {
        Long userId = currentUser.id();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(userId, cardId, request));
    }
}
