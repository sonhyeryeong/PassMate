package com.passmate.domain.material.repository;

import com.passmate.domain.material.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByCategoryId(Long categoryId);
    Optional<Material> findByIdAndCategoryId(Long materialId, Long categoryId);
}
