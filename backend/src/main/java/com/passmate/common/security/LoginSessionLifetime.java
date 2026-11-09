package com.passmate.common.security;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class LoginSessionLifetime {
    private final int seconds;

    public LoginSessionLifetime(@Value("${server.servlet.session.cookie.max-age}") Duration duration) {
        seconds = Math.toIntExact(duration.toSeconds());
    }

    public void apply(HttpSession session) {
        if (session.getMaxInactiveInterval() != seconds) {
            session.setMaxInactiveInterval(seconds);
        }
    }
}
