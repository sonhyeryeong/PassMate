package com.passmate.domain.review.repository;

import com.passmate.domain.review.entity.ReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {
    List<ReviewHistory> findByFlashCardId(Long flashCardId);
    List<ReviewHistory> findByUserIdOrderByReviewedAtDesc(Long userId);
    
    @Query("""
            SELECT r
            FROM ReviewHistory r
            WHERE r.userId = :userId
              AND r.reviewedAt >= :startAt
              AND r.reviewedAt < :endAt
            ORDER BY r.reviewedAt DESC
            """)
    List<ReviewHistory> findByUserIdAndReviewedAtBetween(
            @Param("userId") Long userId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );
}
