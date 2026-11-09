package com.passmate.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.passmate.domain.auth.google.GoogleLoginFlow;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import com.passmate.domain.error.ApiErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

@Configuration
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    static void error(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        new ObjectMapper().writeValue(response.getOutputStream(), new ApiErrorResponse(code, message));
    }

    @Bean
    @ConditionalOnWebApplication
    SecurityFilterChain security(HttpSecurity http, ObjectProvider<ClientRegistrationRepository> registrations,
                                 GoogleLoginFlow google, LoginSessionLifetime lifetime,
                                 org.springframework.session.web.http.CookieSerializer cookies) throws Exception {
        http.cors(Customizer.withDefaults())
                .csrf(Customizer.withDefaults())
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/auth/csrf", "/auth/signup", "/auth/login", "/auth/google", "/auth/google/onboarding").permitAll()
                        .anyRequest().authenticated())
                .requestCache(cache -> cache.disable())
                .formLogin(login -> login.loginProcessingUrl("/auth/login").usernameParameter("loginId")
                        .successHandler((request, response, authentication) -> {
                            request.getSession().removeAttribute(GoogleLoginFlow.PENDING);
                            lifetime.apply(request.getSession());
                            response.setStatus(204);
                        })
                        .failureHandler((request, response, exception) ->
                                error(response, 401, "LOGIN_FAILED", "아이디 또는 비밀번호를 확인해 주세요.")))
                .logout(logout -> logout.logoutUrl("/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                error(response, 401, "AUTH_REQUIRED", "로그인이 필요합니다."))
                        .accessDeniedHandler((request, response, exception) ->
                                error(response, 403, "ACCESS_DENIED", "요청을 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요.")))
                .addFilterBefore(new AuthRequestFilter(lifetime, cookies), UsernamePasswordAuthenticationFilter.class);
        var registration = registrations.getIfAvailable();
        if (registration != null) {
            var resolver = new DefaultOAuth2AuthorizationRequestResolver(registration, "/oauth2/authorization");
            resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
            http.oauth2Login(login -> login.loginPage("/auth/login")
                    .authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(resolver))
                    .authorizedClientRepository(new HttpSessionOAuth2AuthorizedClientRepository())
                    .successHandler(google::success)
                    .failureHandler((request, response, error) -> google.failure(request, response)));
        }
        return http.build();
    }
}
