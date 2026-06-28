package com.passmate.domain.review.controller;

import com.passmate.domain.review.dto.ReviewDto;
import com.passmate.domain.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewDto.Response> getReview(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.getReview(reviewId));
    }

    @GetMapping("/cards/{cardId}")
    public ResponseEntity<ReviewDto.ListResponse> getFlashCardReviews(@PathVariable Long cardId) {
        return ResponseEntity.ok(reviewService.getFlashCardReviews(cardId));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ReviewDto.ListResponse> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getUserReviews(userId));
    }

    @GetMapping("/users/{userId}/today")
    public ResponseEntity<ReviewDto.UserReviewListResponse> getUserTodayReviews(
            @PathVariable Long userId,
            @RequestParam(required = false) LocalDateTime date) {
        LocalDateTime reviewDate = date != null ? date : LocalDateTime.now();
        return ResponseEntity.ok(reviewService.getUserTodayReviews(userId, reviewDate));
    }

    @PostMapping("/cards/{cardId}")
    public ResponseEntity<ReviewDto.Response> createReview(
            @PathVariable Long cardId,
            @RequestParam(required = false) Long userId,
            @RequestBody ReviewDto.CreateRequest request) {
        // TODO: 인증 시스템 구현 후 userId는 현재 사용자로 대체
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(userId, cardId, request));
    }
}
