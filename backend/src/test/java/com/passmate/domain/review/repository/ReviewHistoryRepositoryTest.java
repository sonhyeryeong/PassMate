package com.passmate.domain.review.repository;

import com.passmate.domain.category.entity.Category;
import com.passmate.domain.deck.entity.Deck;
import com.passmate.domain.flashcard.entity.FlashCard;
import com.passmate.domain.material.entity.Material;
import com.passmate.domain.review.entity.ReviewHistory;
import com.passmate.domain.review.entity.ReviewResult;
import com.passmate.domain.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
class ReviewHistoryRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ReviewHistoryRepository reviewHistoryRepository;

    @Test
    void findsOwnedHistoryWithStudyContextInReviewedOrder() {
        User user = entityManager.persist(User.builder()
                .email("history@example.com")
                .nickname("학습자")
                .build());
        Deck deck = entityManager.persist(Deck.builder()
                .userId(user.getId())
                .name("정보처리기사")
                .build());
        Category category = entityManager.persist(Category.builder()
                .deckId(deck.getId())
                .name("기본 섹션")
                .build());
        Material material = entityManager.persist(Material.builder()
                .categoryId(category.getId())
                .title("데이터베이스")
                .build());
        FlashCard flashCard = entityManager.persist(FlashCard.builder()
                .materialId(material.getId())
                .front("정규화란?")
                .back("데이터 중복을 줄이는 과정")
                .build());

        LocalDateTime earlier = LocalDateTime.of(2026, 7, 26, 18, 0);
        LocalDateTime later = earlier.plusHours(1);
        entityManager.persist(ReviewHistory.builder()
                .userId(user.getId())
                .flashCardId(flashCard.getId())
                .result(ReviewResult.HARD)
                .reviewedAt(earlier)
                .build());
        entityManager.persist(ReviewHistory.builder()
                .userId(user.getId())
                .flashCardId(flashCard.getId())
                .result(ReviewResult.GOOD)
                .reviewedAt(later)
                .build());
        entityManager.flush();

        List<ReviewHistoryRepository.HistoryItemProjection> items =
                reviewHistoryRepository.findHistoryItemsByUserId(user.getId(), PageRequest.of(0, 100));

        assertEquals(2, items.size());
        assertEquals(ReviewResult.GOOD, items.get(0).getResult());
        assertEquals("정규화란?", items.get(0).getCardFront());
        assertEquals("데이터베이스", items.get(0).getMaterialTitle());
        assertEquals("정보처리기사", items.get(0).getDeckName());
        assertEquals(later, items.get(0).getReviewedAt());
    }

    @Test
    void excludesHistoryWhenFolderDoesNotBelongToUser() {
        User owner = entityManager.persist(User.builder()
                .email("owner@example.com")
                .nickname("소유자")
                .build());
        User otherUser = entityManager.persist(User.builder()
                .email("other@example.com")
                .nickname("다른 사용자")
                .build());
        Deck deck = entityManager.persist(Deck.builder()
                .userId(owner.getId())
                .name("소유자 폴더")
                .build());
        Category category = entityManager.persist(Category.builder()
                .deckId(deck.getId())
                .name("기본 섹션")
                .build());
        Material material = entityManager.persist(Material.builder()
                .categoryId(category.getId())
                .title("소유자 학습 세트")
                .build());
        FlashCard flashCard = entityManager.persist(FlashCard.builder()
                .materialId(material.getId())
                .front("소유자 카드")
                .back("답")
                .build());
        entityManager.persist(ReviewHistory.builder()
                .userId(otherUser.getId())
                .flashCardId(flashCard.getId())
                .result(ReviewResult.AGAIN)
                .reviewedAt(LocalDateTime.of(2026, 7, 26, 18, 0))
                .build());
        entityManager.flush();

        List<ReviewHistoryRepository.HistoryItemProjection> items =
                reviewHistoryRepository.findHistoryItemsByUserId(otherUser.getId(), PageRequest.of(0, 100));

        assertEquals(List.of(), items);
    }

    @Test
    void limitsHistoryToRequestedPageSize() {
        User user = entityManager.persist(User.builder()
                .email("limit@example.com")
                .nickname("학습자")
                .build());
        Deck deck = entityManager.persist(Deck.builder()
                .userId(user.getId())
                .name("폴더")
                .build());
        Category category = entityManager.persist(Category.builder()
                .deckId(deck.getId())
                .name("기본 섹션")
                .build());
        Material material = entityManager.persist(Material.builder()
                .categoryId(category.getId())
                .title("학습 세트")
                .build());
        FlashCard flashCard = entityManager.persist(FlashCard.builder()
                .materialId(material.getId())
                .front("질문")
                .back("답")
                .build());
        for (int index = 0; index < 3; index++) {
            entityManager.persist(ReviewHistory.builder()
                    .userId(user.getId())
                    .flashCardId(flashCard.getId())
                    .result(ReviewResult.GOOD)
                    .reviewedAt(LocalDateTime.of(2026, 7, 26, 18 + index, 0))
                    .build());
        }
        entityManager.flush();

        List<ReviewHistoryRepository.HistoryItemProjection> items =
                reviewHistoryRepository.findHistoryItemsByUserId(user.getId(), PageRequest.of(0, 2));

        assertEquals(2, items.size());
        assertEquals(LocalDateTime.of(2026, 7, 26, 20, 0), items.get(0).getReviewedAt());
    }

    @Test
    void ordersSameReviewedTimeByLatestId() {
        User user = entityManager.persist(User.builder()
                .email("same-time@example.com")
                .nickname("학습자")
                .build());
        Deck deck = entityManager.persist(Deck.builder()
                .userId(user.getId())
                .name("폴더")
                .build());
        Category category = entityManager.persist(Category.builder()
                .deckId(deck.getId())
                .name("기본 섹션")
                .build());
        Material material = entityManager.persist(Material.builder()
                .categoryId(category.getId())
                .title("학습 세트")
                .build());
        FlashCard flashCard = entityManager.persist(FlashCard.builder()
                .materialId(material.getId())
                .front("질문")
                .back("답")
                .build());
        LocalDateTime reviewedAt = LocalDateTime.of(2026, 7, 26, 18, 0);
        ReviewHistory first = entityManager.persist(ReviewHistory.builder()
                .userId(user.getId())
                .flashCardId(flashCard.getId())
                .result(ReviewResult.HARD)
                .reviewedAt(reviewedAt)
                .build());
        ReviewHistory second = entityManager.persist(ReviewHistory.builder()
                .userId(user.getId())
                .flashCardId(flashCard.getId())
                .result(ReviewResult.GOOD)
                .reviewedAt(reviewedAt)
                .build());
        entityManager.flush();

        List<ReviewHistoryRepository.HistoryItemProjection> items =
                reviewHistoryRepository.findHistoryItemsByUserId(user.getId(), PageRequest.of(0, 100));

        assertEquals(second.getId(), items.get(0).getId());
        assertEquals(first.getId(), items.get(1).getId());
    }
}
