package com.passmate.domain.review.dto;

import com.passmate.domain.review.entity.ReviewResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

public class ReviewDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private ReviewResult result;
        private LocalDateTime reviewedAt;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long userId;
        private Long flashCardId;
        private ReviewResult result;
        private LocalDateTime reviewedAt;
        private LocalDateTime createdAt;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListResponse {
        private List<Response> items;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserReviewListResponse {
        private List<Response> items;
        private LocalDateTime reviewedDate;
    }
}
