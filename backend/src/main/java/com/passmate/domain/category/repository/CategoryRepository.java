package com.passmate.domain.category.repository;

import com.passmate.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByDeckIdOrderBySortOrder(Long deckId);
    Optional<Category> findByIdAndDeckId(Long categoryId, Long deckId);
}
