package com.passmate.domain.auth;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="local_credentials") @Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class LocalCredential {
 @Id private Long userId;
 @Column(nullable=false, unique=true, length=32) private String loginId;
 @Column(nullable=false, length=100) private String passwordHash;
}
