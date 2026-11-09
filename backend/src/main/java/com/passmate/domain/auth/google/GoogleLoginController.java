package com.passmate.domain.auth.google;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth/google")
@RequiredArgsConstructor
public class GoogleLoginController {
    private final ObjectProvider<ClientRegistrationRepository> registrations;
    private final GoogleLoginFlow flow;

    public record Availability(boolean enabled) {}
    public record Onboarding(String nickname) {}

    @GetMapping
    public Availability availability() {
        return new Availability(registrations.getIfAvailable() != null);
    }

    @PostMapping("/onboarding")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void complete(@RequestBody Onboarding body, HttpServletRequest request, HttpServletResponse response) {
        if (registrations.getIfAvailable() == null) {
            throw new com.passmate.domain.error.ResourceNotFoundException("GOOGLE_LOGIN_DISABLED", "Google 로그인을 사용할 수 없습니다.");
        }
        flow.complete(request, response, body.nickname());
    }
}
