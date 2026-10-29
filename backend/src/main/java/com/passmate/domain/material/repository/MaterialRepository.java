package com.passmate.domain.material.repository;

import com.passmate.domain.material.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByCategoryId(Long categoryId);
    Optional<Material> findByIdAndCategoryId(Long materialId, Long categoryId);

    @Query("""
            SELECT m FROM Material m, Category c, Deck d
            WHERE m.id = :materialId AND m.categoryId = c.id
              AND c.deckId = d.id AND d.userId = :userId
            """)
    Optional<Material> findUserMaterial(@Param("userId") Long userId, @Param("materialId") Long materialId);
}
