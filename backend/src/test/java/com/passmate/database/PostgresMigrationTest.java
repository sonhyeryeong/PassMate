package com.passmate.database;

import com.passmate.domain.category.entity.Category;
import com.passmate.domain.deck.entity.Deck;
import com.passmate.domain.deck.service.DeckService;
import com.passmate.domain.flashcard.entity.FlashCard;
import com.passmate.domain.material.entity.Material;
import com.passmate.domain.review.entity.ReviewHistory;
import com.passmate.domain.review.entity.ReviewResult;
import com.passmate.domain.user.entity.User;
import jakarta.persistence.EntityManager;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

// CI 또는 폐기 가능한 로컬 PostgreSQL에서만 명시적으로 실행한다.
@EnabledIfEnvironmentVariable(named = "PASSMATE_POSTGRES_TEST", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("postgres")
class PostgresMigrationTest {
    @Autowired Flyway flyway;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entities;
    @Autowired DeckService decks;

    @Test
    void repeatMigrationDoesNotReapplySuccessfulVersion() {
        assertTrue(flyway.validateWithResult().validationSuccessful);
        assertEquals(0, flyway.migrate().migrationsExecuted);
        assertEquals("passmate", jdbc.queryForObject("SELECT current_schema()", String.class));
        assertEquals(1, jdbc.queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE success AND version = '1'", Integer.class));
    }

    @Test
    void authenticationUpgradePreservesExistingUserAndFolder() {
        String schema = "auth_upgrade_test";
        var source = jdbc.getDataSource();
        assertNotNull(source);
        try {
            Flyway.configure().dataSource(source).schemas(schema).defaultSchema(schema)
                    .target("1").load().migrate();
            Long userId = jdbc.queryForObject("INSERT INTO auth_upgrade_test.users(email, nickname) "
                    + "VALUES ('old@example.invalid', '기존 사용자') RETURNING id", Long.class);
            jdbc.update("INSERT INTO auth_upgrade_test.decks(user_id,name) VALUES (?, '기존 폴더')", userId);
            Flyway.configure().dataSource(source).schemas(schema).defaultSchema(schema).load().migrate();
            assertEquals("기존 폴더", jdbc.queryForObject("SELECT name FROM auth_upgrade_test.decks WHERE user_id=?", String.class, userId));
            assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM auth_upgrade_test.local_credentials", Integer.class));
            assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM auth_upgrade_test.spring_session", Integer.class));
            jdbc.update("INSERT INTO auth_upgrade_test.users(nickname) VALUES ('이메일 없는 새 사용자')");
        } finally {
            jdbc.execute("DROP SCHEMA IF EXISTS auth_upgrade_test CASCADE");
        }
    }

    @Test
    @Transactional
    void refusesCardWhoseMaterialDoesNotExist() {
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update(
                "INSERT INTO flash_cards(material_id, front, back) VALUES (-1, '앞면', '뒷면')"));
    }

    @Test
    @Transactional
    void deletingFolderRemovesItsHistoryWithoutViolatingForeignKeys() {
        User owner = User.builder().email("postgres-test@example.invalid").nickname("검증 사용자").build();
        entities.persist(owner);
        Deck deck = Deck.builder().userId(owner.getId()).name("폴더").build();
        entities.persist(deck);
        Category section = Category.builder().deckId(deck.getId()).name("기본").build();
        entities.persist(section);
        Material material = Material.builder().categoryId(section.getId()).title("세트").build();
        entities.persist(material);
        FlashCard card = FlashCard.builder().materialId(material.getId()).front("질문").back("답변").build();
        entities.persist(card);
        ReviewHistory history = ReviewHistory.builder().userId(owner.getId()).flashCardId(card.getId())
                .result(ReviewResult.GOOD).reviewedAt(LocalDateTime.now()).build();
        entities.persist(history);
        entities.flush();

        decks.deleteDeck(deck.getId(), owner.getId());
        entities.flush();
        entities.clear();

        assertNull(entities.find(Deck.class, deck.getId()));
        assertNull(entities.find(FlashCard.class, card.getId()));
        assertNull(entities.find(ReviewHistory.class, history.getId()));
        assertNotNull(entities.find(User.class, owner.getId()));
    }
}
