package com.passmate.domain.flashcard.repository;

import com.passmate.domain.flashcard.entity.FlashCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlashCardRepository extends JpaRepository<FlashCard, Long> {
    List<FlashCard> findByMaterialId(Long materialId);
    Optional<FlashCard> findByIdAndMaterialId(Long flashCardId, Long materialId);
}
