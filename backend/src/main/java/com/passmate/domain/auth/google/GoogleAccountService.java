package com.passmate.domain.auth.google;

import com.passmate.domain.error.InvalidRequestException;
import com.passmate.domain.user.entity.User;
import com.passmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GoogleAccountService {
    private final AuthIdentityRepository identities;
    private final UserRepository users;

    public Optional<Long> find(String issuer, String subject) {
        return identities.findByIssuerAndSubject(issuer, subject).map(AuthIdentity::getUserId);
    }

    @Transactional
    public Long complete(String issuer, String subject, String nickname) {
        String name = nickname == null ? "" : nickname.strip();
        if (name.isBlank() || name.length() > 30) {
            throw new InvalidRequestException("INVALID_NICKNAME", "닉네임을 1~30자로 입력해 주세요.");
        }
        return find(issuer, subject).orElseGet(() -> {
            User user = users.save(User.builder().nickname(name).build());
            identities.saveAndFlush(new AuthIdentity(user.getId(), issuer, subject));
            return user.getId();
        });
    }
}
