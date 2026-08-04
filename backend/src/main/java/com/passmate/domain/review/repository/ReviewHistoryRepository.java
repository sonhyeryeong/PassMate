package com.passmate.domain.review.repository;

import com.passmate.domain.review.entity.ReviewHistory;
import com.passmate.domain.review.entity.ReviewResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {
    interface HistoryItemProjection {
        Long getId();
        Long getFlashCardId();
        String getCardFront();
        Long getMaterialId();
        String getMaterialTitle();
        Long getDeckId();
        String getDeckName();
        ReviewResult getResult();
        LocalDateTime getReviewedAt();
    }

    List<ReviewHistory> findByFlashCardId(Long flashCardId);
    void deleteByFlashCardId(Long flashCardId);
    List<ReviewHistory> findByUserIdOrderByReviewedAtDesc(Long userId);
    long countByUserIdAndReviewedAtGreaterThanEqualAndReviewedAtLessThan(
            Long userId,
            LocalDateTime startAt,
            LocalDateTime endAt
    );
    
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

    @Query("""
            SELECT r.id AS id,
                   r.flashCardId AS flashCardId,
                   f.front AS cardFront,
                   m.id AS materialId,
                   m.title AS materialTitle,
                   d.id AS deckId,
                   d.name AS deckName,
                   r.result AS result,
                   r.reviewedAt AS reviewedAt
            FROM ReviewHistory r
            JOIN FlashCard f ON f.id = r.flashCardId
            JOIN Material m ON m.id = f.materialId
            JOIN Category c ON c.id = m.categoryId
            JOIN Deck d ON d.id = c.deckId
            WHERE r.userId = :userId
              AND d.userId = :userId
            ORDER BY r.reviewedAt DESC, r.id DESC
            """)
    List<HistoryItemProjection> findHistoryItemsByUserId(
            @Param("userId") Long userId,
            Pageable pageable
    );
}
