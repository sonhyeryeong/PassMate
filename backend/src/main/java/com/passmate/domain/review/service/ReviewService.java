package com.passmate.domain.review.service;

import com.passmate.domain.review.dto.ReviewDto;
import com.passmate.domain.review.entity.ReviewHistory;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewHistoryRepository reviewHistoryRepository;

    public ReviewDto.Response getReview(Long reviewId) {
        ReviewHistory review = reviewHistoryRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        return toResponse(review);
    }

    public ReviewDto.ListResponse getFlashCardReviews(Long flashCardId) {
        List<ReviewHistory> reviews = reviewHistoryRepository.findByFlashCardId(flashCardId);
        List<ReviewDto.Response> items = reviews.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ReviewDto.ListResponse.builder()
                .items(items)
                .build();
    }

    public ReviewDto.ListResponse getUserReviews(Long userId) {
        List<ReviewHistory> reviews = reviewHistoryRepository.findByUserIdOrderByReviewedAtDesc(userId);
        List<ReviewDto.Response> items = reviews.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ReviewDto.ListResponse.builder()
                .items(items)
                .build();
    }

    public ReviewDto.UserReviewListResponse getUserTodayReviews(Long userId, LocalDateTime date) {
        LocalDateTime startAt = date.toLocalDate().atStartOfDay();
        LocalDateTime endAt = startAt.plusDays(1);
        List<ReviewHistory> reviews = reviewHistoryRepository.findByUserIdAndReviewedAtBetween(userId, startAt, endAt);
        List<ReviewDto.Response> items = reviews.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ReviewDto.UserReviewListResponse.builder()
                .items(items)
                .reviewedDate(date)
                .build();
    }

    @Transactional
    public ReviewDto.Response createReview(Long userId, Long flashCardId, ReviewDto.CreateRequest request) {
        ReviewHistory review = ReviewHistory.builder()
                .userId(userId)
                .flashCardId(flashCardId)
                .result(request.getResult())
                .reviewedAt(request.getReviewedAt() != null ? request.getReviewedAt() : LocalDateTime.now())
                .build();

        ReviewHistory savedReview = reviewHistoryRepository.save(review);
        return toResponse(savedReview);
    }

    private ReviewDto.Response toResponse(ReviewHistory review) {
        return ReviewDto.Response.builder()
                .id(review.getId())
                .userId(review.getUserId())
                .flashCardId(review.getFlashCardId())
                .result(review.getResult())
                .reviewedAt(review.getReviewedAt())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
