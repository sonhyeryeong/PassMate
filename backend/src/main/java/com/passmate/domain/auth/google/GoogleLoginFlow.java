package com.passmate.domain.auth.google;

import com.passmate.common.security.AccountPrincipal;
import com.passmate.common.security.LoginSessionLifetime;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.Serializable;
import java.time.Instant;
import java.time.Clock;

@Component
@RequiredArgsConstructor
public class GoogleLoginFlow {
    public static final String PENDING = "passmate.google.pending";
    private final GoogleAccountService accounts;
    private final GoogleLoginSettings settings;
    private final Clock clock;
    private final LoginSessionLifetime lifetime;
    private final HttpSessionSecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    private record Pending(String issuer, String subject, Instant expires) implements Serializable {}

    public void success(HttpServletRequest request, HttpServletResponse response,
                        Authentication validated) throws IOException {
        OidcUser google = (OidcUser) validated.getPrincipal();
        String issuer = google.getIdToken().getIssuer().toString();
        String subject = google.getIdToken().getSubject();
        // Google 토큰과 이전 계정 정보를 새 PassMate 세션에 남기지 않는다.
        clearSession(request);
        var existing = accounts.find(issuer, subject);
        if (existing.isPresent()) {
            signIn(request, response, existing.get());
            response.sendRedirect(settings.url("/"));
        } else {
            var session = request.getSession();
            session.setMaxInactiveInterval(600);
            session.setAttribute(PENDING, new Pending(issuer, subject, clock.instant().plusSeconds(600)));
            response.sendRedirect(settings.url("/signup/google"));
        }
    }

    public void failure(HttpServletRequest request, HttpServletResponse response) throws IOException {
        clearSession(request);
        response.sendRedirect(settings.url("/login?google=failed"));
    }

    public void complete(HttpServletRequest request, HttpServletResponse response, String nickname) {
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute(PENDING) instanceof Pending pending)
                || !clock.instant().isBefore(pending.expires())) {
            throw new AuthenticationCredentialsNotFoundException("Google 로그인을 다시 시작해 주세요.");
        }
        Long userId;
        try {
            userId = accounts.complete(pending.issuer(), pending.subject(), nickname);
        } catch (DataIntegrityViolationException race) {
            // 같은 Google 계정이 동시에 가입을 완료하면 먼저 저장된 사용자로 이어간다.
            userId = accounts.find(pending.issuer(), pending.subject()).orElseThrow(() -> race);
        }
        clearSession(request);
        signIn(request, response, userId);
    }

    private void signIn(HttpServletRequest request, HttpServletResponse response, Long userId) {
        var principal = new AccountPrincipal(userId, "google:" + userId, "");
        principal.eraseCredentials();
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal, null, principal.getAuthorities());
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        lifetime.apply(request.getSession());
        contexts.saveContext(context, request, response);
    }

    private static void clearSession(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
    }
}
