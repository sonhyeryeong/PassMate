package com.passmate.domain.review.service;

import com.passmate.domain.flashcard.dto.FlashCardDto;
import com.passmate.domain.flashcard.entity.FlashCard;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.error.InvalidRequestException;
import com.passmate.domain.error.ResourceNotFoundException;
import com.passmate.domain.review.dto.ReviewDto;
import com.passmate.domain.review.entity.ReviewHistory;
import com.passmate.domain.review.entity.ReviewResult;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import com.passmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private static final int RECENT_HISTORY_LIMIT = 100;

    private final ReviewHistoryRepository reviewHistoryRepository;
    private final FlashCardRepository flashCardRepository;
    private final UserRepository userRepository;

    public ReviewDto.Response getReview(Long reviewId) {
        ReviewHistory review = reviewHistoryRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "REVIEW_NOT_FOUND",
                        "복습 기록을 찾을 수 없습니다."
                ));
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

    public ReviewDto.HistoryListResponse getUserReviewHistory(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("USER_NOT_FOUND", "프로필을 찾을 수 없습니다.");
        }

        List<ReviewDto.HistoryItemResponse> items = reviewHistoryRepository
                .findHistoryItemsByUserId(userId, PageRequest.of(0, RECENT_HISTORY_LIMIT))
                .stream()
                .map(this::toHistoryItemResponse)
                .toList();
        return ReviewDto.HistoryListResponse.builder()
                .items(items)
                .build();
    }

    public ReviewDto.TodayReviewResponse getUserTodayReviewCards(Long userId, LocalDateTime date) {
        List<FlashCard> flashCards = flashCardRepository.findDueCardsByUserId(userId, date);
        List<FlashCardDto.Response> items = flashCards.stream()
                .map(this::toFlashCardResponse)
                .collect(Collectors.toList());
        return ReviewDto.TodayReviewResponse.builder()
                .items(items)
                .reviewDate(date)
                .build();
    }

    @Transactional
    public ReviewDto.Response createReview(Long userId, Long flashCardId, ReviewDto.CreateRequest request) {
        if (request == null || request.getResult() == null) {
            throw new InvalidRequestException("REVIEW_RESULT_REQUIRED", "복습 결과를 선택해 주세요.");
        }

        FlashCard flashCard = flashCardRepository.findUserFlashCard(userId, flashCardId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "FLASH_CARD_NOT_FOUND",
                        "복습할 카드를 찾을 수 없습니다."
                ));
        LocalDateTime reviewedAt = request.getReviewedAt() != null ? request.getReviewedAt() : LocalDateTime.now();

        ReviewHistory review = ReviewHistory.builder()
                .userId(userId)
                .flashCardId(flashCardId)
                .result(request.getResult())
                .reviewedAt(reviewedAt)
                .build();

        flashCard.updateNextReviewAt(calculateNextReviewAt(request.getResult(), reviewedAt));
        ReviewHistory savedReview = reviewHistoryRepository.save(review);
        return toResponse(savedReview);
    }

    private LocalDateTime calculateNextReviewAt(ReviewResult result, LocalDateTime reviewedAt) {
        if (result == null || result == ReviewResult.AGAIN) {
            return reviewedAt.plusMinutes(10);
        }
        if (result == ReviewResult.HARD) {
            return reviewedAt.plusDays(1);
        }
        if (result == ReviewResult.GOOD) {
            return reviewedAt.plusDays(3);
        }
        return reviewedAt.plusDays(7);
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

    private FlashCardDto.Response toFlashCardResponse(FlashCard flashCard) {
        return FlashCardDto.Response.builder()
                .id(flashCard.getId())
                .materialId(flashCard.getMaterialId())
                .front(flashCard.getFront())
                .back(flashCard.getBack())
                .nextReviewAt(flashCard.getNextReviewAt())
                .createdAt(flashCard.getCreatedAt())
                .updatedAt(flashCard.getUpdatedAt())
                .build();
    }

    private ReviewDto.HistoryItemResponse toHistoryItemResponse(
            ReviewHistoryRepository.HistoryItemProjection item
    ) {
        return ReviewDto.HistoryItemResponse.builder()
                .id(item.getId())
                .flashCardId(item.getFlashCardId())
                .cardFront(item.getCardFront())
                .materialId(item.getMaterialId())
                .materialTitle(item.getMaterialTitle())
                .deckId(item.getDeckId())
                .deckName(item.getDeckName())
                .result(item.getResult())
                .reviewedAt(item.getReviewedAt())
                .build();
    }
}
