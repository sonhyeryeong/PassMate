package com.passmate.common.security;
import com.passmate.domain.deck.repository.DeckRepository;
import com.passmate.domain.category.repository.CategoryRepository;
import com.passmate.domain.material.repository.MaterialRepository;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import com.passmate.domain.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class Ownership {
 private final CurrentUser current;
 private final DeckRepository decks;
 private final CategoryRepository categories;
 private final MaterialRepository materials;
 private final FlashCardRepository cards;
 private final ReviewHistoryRepository reviews;
 private ResourceNotFoundException missing() { return new ResourceNotFoundException("RESOURCE_NOT_FOUND","요청한 정보를 찾을 수 없습니다."); }
 public void deck(Long id) { if(decks.findByIdAndUserId(id,current.id()).isEmpty()) throw missing(); }
 public void category(Long id) { deck(categories.findById(id).orElseThrow(this::missing).getDeckId()); }
 public void material(Long id) { category(materials.findById(id).orElseThrow(this::missing).getCategoryId()); }
 public void card(Long id) { material(cards.findById(id).orElseThrow(this::missing).getMaterialId()); }
 public void review(Long id) {
  var review=reviews.findById(id).orElseThrow(this::missing);
  if(!review.getUserId().equals(current.id())) throw missing();
  card(review.getFlashCardId());
 }
}
