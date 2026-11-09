package com.passmate.domain.auth.google;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "auth_identities", uniqueConstraints = @UniqueConstraint(columnNames = {"issuer", "subject"}))
@Getter
@NoArgsConstructor
public class AuthIdentity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private String issuer;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    AuthIdentity(Long userId, String issuer, String subject) {
        this.userId = userId;
        this.issuer = issuer;
        this.subject = subject;
        this.createdAt = LocalDateTime.now();
    }
}
