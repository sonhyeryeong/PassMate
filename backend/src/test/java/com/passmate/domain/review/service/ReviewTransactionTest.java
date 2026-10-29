package com.passmate.domain.review.service;

import com.passmate.domain.category.entity.Category;
import com.passmate.domain.deck.entity.Deck;
import com.passmate.domain.flashcard.entity.FlashCard;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.material.entity.Material;
import com.passmate.domain.review.dto.ReviewDto;
import com.passmate.domain.review.entity.ReviewHistory;
import com.passmate.domain.review.entity.ReviewResult;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import com.passmate.domain.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

@DataJpaTest
@Import(ReviewService.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReviewTransactionTest {

    @Autowired private ReviewService reviewService;
    @Autowired private FlashCardRepository flashCardRepository;
    @Autowired private TestEntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;
    @SpyBean private ReviewHistoryRepository reviewHistoryRepository;

    @Test
    void rollsBackHistoryAndScheduleWhenSavingFailsAfterFlush() {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        LocalDateTime originalSchedule = LocalDateTime.of(2026, 10, 29, 9, 0);
        long[] ids = transaction.execute(status -> {
            User user = entityManager.persist(User.builder()
                    .email("rollback@example.com").nickname("학습자").build());
            Deck deck = entityManager.persist(Deck.builder().userId(user.getId()).name("폴더").build());
            Category category = entityManager.persist(Category.builder().deckId(deck.getId()).name("기본 섹션").build());
            Material material = entityManager.persist(Material.builder().categoryId(category.getId()).title("학습 세트").build());
            FlashCard card = entityManager.persist(FlashCard.builder().materialId(material.getId())
                    .front("질문").back("답변").nextReviewAt(originalSchedule).build());
            return new long[]{user.getId(), card.getId()};
        });
        long historyCount = reviewHistoryRepository.count();

        // DB에 변경을 전송한 뒤 실패시켜 실제 트랜잭션 롤백을 검증한다.
        doAnswer(invocation -> {
            entityManager.persistAndFlush(invocation.<ReviewHistory>getArgument(0));
            throw new IllegalStateException("저장 중 실패");
        }).when(reviewHistoryRepository).save(any(ReviewHistory.class));

        assertThrows(IllegalStateException.class, () -> reviewService.createReview(ids[0], ids[1],
                ReviewDto.CreateRequest.builder().result(ReviewResult.GOOD)
                        .reviewedAt(originalSchedule.plusHours(1)).build()));

        assertEquals(historyCount, reviewHistoryRepository.count());
        assertEquals(originalSchedule, flashCardRepository.findById(ids[1]).orElseThrow().getNextReviewAt());
    }
}
