package com.passmate.domain.review.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "review_histories")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long flashCardId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewResult result;

    @Column(nullable = false)
    private LocalDateTime reviewedAt;

    @Column(nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (reviewedAt == null) {
            reviewedAt = LocalDateTime.now();
        }
    }
}
