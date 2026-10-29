package com.passmate.domain.review.service;

import com.passmate.domain.category.entity.Category;
import com.passmate.domain.category.repository.CategoryRepository;
import com.passmate.domain.category.service.CategoryService;
import com.passmate.domain.category.controller.CategoryController;
import com.passmate.domain.deck.entity.Deck;
import com.passmate.domain.deck.repository.DeckRepository;
import com.passmate.domain.deck.service.DeckService;
import com.passmate.domain.deck.controller.DeckController;
import com.passmate.domain.error.GlobalExceptionHandler;
import com.passmate.domain.error.ResourceNotFoundException;
import com.passmate.domain.flashcard.entity.FlashCard;
import com.passmate.domain.flashcard.repository.FlashCardRepository;
import com.passmate.domain.flashcard.service.FlashCardService;
import com.passmate.domain.flashcard.controller.FlashCardController;
import com.passmate.domain.material.entity.Material;
import com.passmate.domain.material.repository.MaterialRepository;
import com.passmate.domain.material.service.MaterialService;
import com.passmate.domain.material.controller.MaterialController;
import com.passmate.domain.review.controller.ReviewController;
import com.passmate.domain.review.entity.ReviewHistory;
import com.passmate.domain.review.entity.ReviewResult;
import com.passmate.domain.review.repository.ReviewHistoryRepository;
import com.passmate.domain.user.entity.User;
import com.passmate.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DataJpaTest(properties = "spring.jpa.show-sql=false")
@Import({ReviewService.class, DeckService.class, CategoryService.class, MaterialService.class, FlashCardService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReviewFlowIntegrationTest {
    enum Scope { CARD, MATERIAL, CATEGORY, DECK }

    record Tree(long deckId, List<Long> categories, List<Long> materials, List<Long> cards) {}

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 29, 12, 0);

    @Autowired private ReviewService reviewService;
    @Autowired private DeckService deckService;
    @Autowired private CategoryService categoryService;
    @Autowired private MaterialService materialService;
    @Autowired private FlashCardService flashCardService;
    @Autowired private UserRepository users;
    @Autowired private DeckRepository decks;
    @Autowired private CategoryRepository categories;
    @Autowired private MaterialRepository materials;
    @SpyBean private FlashCardRepository cards;
    @Autowired private ReviewHistoryRepository histories;
    @Autowired private TestEntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;

    private long userId;
    private long outsiderId;
    private Tree target;
    private Tree sibling;
    private Tree outsider;

    @BeforeEach
    void prepareTrees() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            histories.deleteAll();
            cards.deleteAll();
            materials.deleteAll();
            categories.deleteAll();
            decks.deleteAll();
            users.deleteAll();
            entityManager.flush();
            userId = entityManager.persist(User.builder().email("review@example.com").nickname("학습자").build()).getId();
            outsiderId = entityManager.persist(User.builder().email("other@example.com").nickname("다른 학습자").build()).getId();
            target = createTree(userId, 2);
            sibling = createTree(userId, 1);
            outsider = createTree(outsiderId, 1);
        });
    }

    private Tree createTree(long ownerId, int width) {
        long deckId = entityManager.persist(Deck.builder().userId(ownerId).name("폴더").build()).getId();
        List<Long> categoryIds = new ArrayList<>();
        List<Long> materialIds = new ArrayList<>();
        List<Long> cardIds = new ArrayList<>();
        for (int c = 0; c < width; c++) {
            long categoryId = entityManager.persist(Category.builder().deckId(deckId).name("기본 섹션").build()).getId();
            categoryIds.add(categoryId);
            for (int m = 0; m < width; m++) {
                long materialId = entityManager.persist(Material.builder().categoryId(categoryId).title("학습 세트").build()).getId();
                materialIds.add(materialId);
                for (int f = 0; f < width; f++) {
                    FlashCard card = entityManager.persist(FlashCard.builder().materialId(materialId)
                            .front("질문").back("답변").nextReviewAt(NOW.minusHours(1)).build());
                    cardIds.add(card.getId());
                    entityManager.persist(ReviewHistory.builder().userId(ownerId).flashCardId(card.getId())
                            .result(ReviewResult.GOOD).reviewedAt(NOW.minusDays(3)).build());
                }
            }
        }
        return new Tree(deckId, categoryIds, materialIds, cardIds);
    }

    private void deleteSubtree(Scope scope, long ownerId) {
        switch (scope) {
            case CARD -> flashCardService.deleteFlashCard(target.cards().get(0), target.materials().get(0), ownerId);
            case MATERIAL -> materialService.deleteMaterial(target.materials().get(0), target.categories().get(0), ownerId);
            case CATEGORY -> categoryService.deleteCategory(target.categories().get(0), target.deckId(), ownerId);
            case DECK -> deckService.deleteDeck(target.deckId(), ownerId);
        }
    }

    @ParameterizedTest
    @EnumSource(Scope.class)
    void permanentlyDeletesOnlySelectedSubtreeAndHistory(Scope scope) {
        int deletedCards = switch (scope) { case CARD -> 1; case MATERIAL -> 2; case CATEGORY -> 4; case DECK -> 8; };
        deleteSubtree(scope, userId);

        assertEquals(10 - deletedCards, cards.count());
        assertEquals(10 - deletedCards, histories.count());
        assertEquals(scope == Scope.DECK ? 2 : 3, decks.count());
        assertEquals(scope == Scope.DECK ? 2 : scope == Scope.CATEGORY ? 3 : 4, categories.count());
        int deletedMaterials = switch (scope) { case CARD -> 0; case MATERIAL -> 1; case CATEGORY -> 2; case DECK -> 4; };
        assertEquals(6 - deletedMaterials, materials.count());
        for (int i = 0; i < target.cards().size(); i++) {
            long cardId = target.cards().get(i);
            assertEquals(i >= deletedCards, cards.existsById(cardId));
            assertEquals(i < deletedCards ? 0 : 1, histories.findByFlashCardId(cardId).size());
        }
        assertTrue(cards.existsById(sibling.cards().get(0)));
        assertTrue(cards.existsById(outsider.cards().get(0)));
    }

    @ParameterizedTest
    @EnumSource(Scope.class)
    void rejectsOtherProfileBeforeDeletingAnything(Scope scope) {
        assertThrows(ResourceNotFoundException.class, () -> deleteSubtree(scope, outsiderId));
        assertAllDataRemains();
    }

    @Test
    void rejectsWrongParentIdentifiers() {
        assertThrows(ResourceNotFoundException.class, () -> flashCardService.deleteFlashCard(
                target.cards().get(0), sibling.materials().get(0), userId));
        assertThrows(ResourceNotFoundException.class, () -> materialService.deleteMaterial(
                target.materials().get(0), sibling.categories().get(0), userId));
        assertThrows(ResourceNotFoundException.class, () -> categoryService.deleteCategory(
                target.categories().get(0), sibling.deckId(), userId));
        assertAllDataRemains();
    }

    @ParameterizedTest
    @EnumSource(Scope.class)
    void rollsBackEntireDeletionAfterChildFailure(Scope scope) {
        // 이전 카드 삭제도 진행된 뒤 실패하게 하여 상위 요청 전체의 원자성을 확인한다.
        long failingCard = target.cards().get(scope == Scope.CARD ? 0 : 1);
        doAnswer(invocation -> {
            FlashCard card = invocation.getArgument(0);
            entityManager.remove(card);
            entityManager.flush();
            if (card.getId() == failingCard) throw new IllegalStateException("삭제 중 실패");
            return null;
        }).when(cards).delete(any(FlashCard.class));

        assertThrows(IllegalStateException.class, () -> deleteSubtree(scope, userId));
        assertAllDataRemains();
    }

    private void assertAllDataRemains() {
        assertEquals(3, decks.count());
        assertEquals(4, categories.count());
        assertEquals(6, materials.count());
        assertEquals(10, cards.count());
        assertEquals(10, histories.count());
    }

    @ParameterizedTest
    @EnumSource(Scope.class)
    void deletionApiRequiresProfileAndRejectsUnownedTargets(Scope scope) throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new DeckController(deckService),
                        new CategoryController(categoryService), new MaterialController(materialService),
                        new FlashCardController(flashCardService))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        String path = switch (scope) {
            case CARD -> "/materials/" + target.materials().get(0) + "/cards/" + target.cards().get(0);
            case MATERIAL -> "/categories/" + target.categories().get(0) + "/materials/" + target.materials().get(0);
            case CATEGORY -> "/decks/" + target.deckId() + "/categories/" + target.categories().get(0);
            case DECK -> "/decks/" + target.deckId();
        };
        mvc.perform(delete(path)).andExpect(status().isBadRequest());
        mvc.perform(delete(path).param("userId", Long.toString(outsiderId)))
                .andExpect(status().isNotFound());
        assertAllDataRemains();
        mvc.perform(delete(path).param("userId", Long.toString(userId)))
                .andExpect(status().isNoContent());
    }

    @Test
    void filtersDueCardsAndPreservesGlobalReviewAndOrdering() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            cards.findById(target.cards().get(0)).orElseThrow().updateNextReviewAt(NOW);
            cards.findById(sibling.cards().get(0)).orElseThrow().updateNextReviewAt(NOW.plusSeconds(1));
        });

        var filtered = reviewService.getUserTodayReviewCards(userId, NOW, target.materials().get(0));
        assertEquals(List.of(target.cards().get(1), target.cards().get(0)),
                filtered.getItems().stream().map(item -> item.getId()).toList());
        assertEquals(NOW, filtered.getReviewDate());
        assertEquals(8, reviewService.getUserTodayReviewCards(userId, NOW, null).getItems().size());
        assertTrue(reviewService.getUserTodayReviewCards(userId, NOW, sibling.materials().get(0)).getItems().isEmpty());
    }

    @Test
    void filteredReviewApiDistinguishesEmptyMissingAndUnownedSet() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new ReviewController(reviewService))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        String path = "/reviews/users/" + userId + "/today";
        mvc.perform(get(path).param("date", NOW.toString()).param("materialId", target.materials().get(0).toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(2));
        mvc.perform(get(path).param("date", NOW.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(9));
        mvc.perform(get(path).param("date", NOW.minusDays(10).toString())
                        .param("materialId", target.materials().get(0).toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(0));
        mvc.perform(get(path).param("materialId", outsider.materials().get(0).toString()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MATERIAL_NOT_FOUND"));
        mvc.perform(get(path).param("materialId", "9223372036854775807"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("MATERIAL_NOT_FOUND"));
        mvc.perform(get(path).param("materialId", "invalid"))
                .andExpect(status().isBadRequest());
        assertAllDataRemains();
    }
}
