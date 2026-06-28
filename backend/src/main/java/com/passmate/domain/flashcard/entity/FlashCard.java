package com.passmate.domain.flashcard.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "flash_cards")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long materialId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String front;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String back;

    @Column(columnDefinition = "TIMESTAMP")
    private LocalDateTime nextReviewAt;

    @Column(nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (nextReviewAt == null) {
            nextReviewAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void update(String front, String back) {
        if (front != null && !front.isEmpty()) {
            this.front = front;
        }
        if (back != null && !back.isEmpty()) {
            this.back = back;
        }
    }

    public void updateNextReviewAt(LocalDateTime nextReviewAt) {
        if (nextReviewAt != null) {
            this.nextReviewAt = nextReviewAt;
        }
    }
}
