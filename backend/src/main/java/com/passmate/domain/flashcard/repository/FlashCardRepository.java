package com.passmate.domain.flashcard.repository;

import com.passmate.domain.flashcard.entity.FlashCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlashCardRepository extends JpaRepository<FlashCard, Long> {
    List<FlashCard> findByMaterialId(Long materialId);
    Optional<FlashCard> findByIdAndMaterialId(Long flashCardId, Long materialId);
    void deleteByMaterialId(Long materialId);

    @Query("""
            SELECT f
            FROM FlashCard f, Material m, Category c, Deck d
            WHERE f.materialId = m.id
              AND m.categoryId = c.id
              AND c.deckId = d.id
              AND d.userId = :userId
              AND f.nextReviewAt <= :now
            ORDER BY f.nextReviewAt ASC, f.id ASC
            """)
    List<FlashCard> findDueCardsByUserId(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    @Query("""
            SELECT f
            FROM FlashCard f, Material m, Category c, Deck d
            WHERE f.id = :flashCardId
              AND f.materialId = m.id
              AND m.categoryId = c.id
              AND c.deckId = d.id
              AND d.userId = :userId
            """)
    Optional<FlashCard> findUserFlashCard(
            @Param("userId") Long userId,
            @Param("flashCardId") Long flashCardId
    );
}
