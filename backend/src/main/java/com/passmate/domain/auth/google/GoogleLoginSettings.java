package com.passmate.domain.auth.google;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

import java.net.URI;
import java.time.Clock;

@Configuration
public class GoogleLoginSettings {
    private final URI origin;

    public GoogleLoginSettings(@Value("${passmate.app-origin:http://localhost:3000}") URI origin) {
        boolean local = "http".equals(origin.getScheme()) && "localhost".equals(origin.getHost());
        if (origin.getHost() == null || (!local && !"https".equals(origin.getScheme()))
                || origin.getUserInfo() != null || origin.getQuery() != null || origin.getFragment() != null
                || !(origin.getPath().isEmpty() || "/".equals(origin.getPath()))) {
            throw new IllegalArgumentException("PassMate 앱 주소에는 HTTPS 주소 또는 http://localhost 포트를 입력하세요.");
        }
        this.origin = origin;
    }

    public String url(String path) {
        return origin.resolve(path).toString();
    }

    @Bean
    Clock googleClock() {
        return Clock.systemUTC();
    }

    @Bean
    @ConditionalOnProperty(name = "passmate.google.enabled", havingValue = "true")
    ClientRegistrationRepository googleRegistration(@Value("${passmate.google.client-id}") String id,
                                                     @Value("${passmate.google.client-secret}") String secret) {
        if (id.isBlank() || secret.isBlank()) {
            throw new IllegalArgumentException("Google 로그인을 활성화하려면 클라이언트 ID와 보안 비밀을 모두 설정하세요.");
        }
        var registration = CommonOAuth2Provider.GOOGLE.getBuilder("google")
                .clientId(id).clientSecret(secret)
                .issuerUri("https://accounts.google.com")
                .scope("openid", "email")
                .redirectUri(url("/api/login/oauth2/code/google"))
                .build();
        return new InMemoryClientRegistrationRepository(registration);
    }
}
