package com.passmate.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

// 단일 서버의 가입·로그인 요청을 제한하며 프록시 헤더를 임의로 신뢰하지 않는다.
class AuthRequestFilter extends OncePerRequestFilter {
    private static final long ABSOLUTE_SESSION_MILLIS = 24 * 60 * 60 * 1000L;
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
        var session = request.getSession(false);
        if (session != null && session.getAttribute("authenticatedAt") instanceof Long authenticatedAt
                && System.currentTimeMillis() - authenticatedAt >= ABSOLUTE_SESSION_MILLIS) {
            session.invalidate();
            SecurityContextHolder.clearContext();
            SecurityConfig.error(response, 401, "SESSION_EXPIRED", "다시 로그인해 주세요.");
            return;
        }
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
        chain.doFilter(request, response);
    }
}
