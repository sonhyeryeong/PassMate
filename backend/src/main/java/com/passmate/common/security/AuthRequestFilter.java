package com.passmate.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.session.web.http.CookieSerializer;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

// 단일 서버의 가입·로그인 요청을 제한하며 프록시 헤더를 임의로 신뢰하지 않는다.
class AuthRequestFilter extends OncePerRequestFilter {
    private final LoginSessionLifetime lifetime;
    private final CookieSerializer cookies;

    AuthRequestFilter(LoginSessionLifetime lifetime, CookieSerializer cookies) {
        this.lifetime = lifetime;
        this.cookies = cookies;
    }
    private static final long RATE_WINDOW_MILLIS = 60_000;
    private static final int REQUEST_LIMIT = 30;
    private static final int MAX_TRACKED_ADDRESSES = 10_000;

    private record Window(long expires, int count) {}
    private final Map<String, Window> attempts = new HashMap<>();

    private synchronized boolean allow(String address) {
        long now = System.currentTimeMillis();
        attempts.entrySet().removeIf(entry -> entry.getValue().expires() <= now);
        Window window = attempts.get(address);
        if (window == null && attempts.size() >= MAX_TRACKED_ADDRESSES) return false;
        if (window != null && window.count() >= REQUEST_LIMIT) return false;
        attempts.put(address, new Window(
                window == null ? now + RATE_WINDOW_MILLIS : window.expires(),
                window == null ? 1 : window.count() + 1));
        return true;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getParameterMap().containsKey("userId")) {
            SecurityConfig.error(response, 400, "USER_ID_NOT_ACCEPTED", "사용자 번호를 직접 지정할 수 없습니다.");
            return;
        }
        String path = request.getRequestURI().substring(request.getContextPath().length());
        boolean authenticationAttempt = request.getMethod().equals("POST")
                && (path.equals("/auth/login") || path.equals("/auth/signup"));
        if (authenticationAttempt && !allow(request.getRemoteAddr())) {
            response.setHeader("Retry-After", "60");
            SecurityConfig.error(response, 429, "AUTH_RATE_LIMIT", "요청이 너무 많습니다. 1분 후 다시 시도해 주세요.");
            return;
        }
        var auth = SecurityContextHolder.getContext().getAuthentication();
        var session = request.getSession(false);
        if (!authenticationAttempt && session != null && auth != null && auth.getPrincipal() instanceof AccountPrincipal) {
            lifetime.apply(session);
            // Spring Session은 같은 ID를 다시 보내지 않으므로 브라우저의 쿠키 만료일도 갱신한다.
            cookies.writeCookieValue(new CookieSerializer.CookieValue(request, response, session.getId()));
        }
        chain.doFilter(request, response);
    }
}
