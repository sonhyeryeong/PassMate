package com.passmate.domain.auth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface LocalCredentialRepository extends JpaRepository<LocalCredential,Long> {
 Optional<LocalCredential> findByLoginId(String loginId);
 boolean existsByLoginId(String loginId);
}
