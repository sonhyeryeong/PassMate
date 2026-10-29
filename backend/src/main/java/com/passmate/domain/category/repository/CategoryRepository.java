package com.passmate.domain.category.repository;

import com.passmate.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByDeckIdOrderBySortOrder(Long deckId);
    Optional<Category> findByIdAndDeckId(Long categoryId, Long deckId);

    @Query("""
            SELECT c FROM Category c, Deck d
            WHERE c.id = :categoryId AND c.deckId = d.id AND d.userId = :userId
            """)
    Optional<Category> findUserCategory(@Param("userId") Long userId, @Param("categoryId") Long categoryId);
}
