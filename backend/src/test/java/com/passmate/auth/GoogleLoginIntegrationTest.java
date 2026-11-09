package com.passmate.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.Clock;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:google-login", "spring.jpa.hibernate.ddl-auto=create-drop",
        "passmate.google.enabled=true", "passmate.google.client-id=fixture-client",
        "passmate.google.client-secret=fixture-only"
})
class GoogleLoginIntegrationTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String ISSUER = "https://accounts.google.com";
    private static final String CLIENT = "fixture-client";
    private static final String CALLBACK = "http://localhost:3000/api/login/oauth2/code/google";
    private static HttpServer provider;
    private static RSAKey key;
    private static volatile String subject;
    private static volatile String nonce;
    @org.springframework.boot.test.mock.mockito.MockBean(name = "googleClock")
    Clock clock;
    @BeforeEach void useRealTime() { when(clock.instant()).thenAnswer(call -> Instant.now()); }
    @LocalServerPort int port;
    private final HttpClient browser = HttpClient.newBuilder()
            .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL)).build();

    @TestConfiguration
    static class Fixture {
        @Bean @Primary
        ClientRegistrationRepository localIdentityProvider() throws Exception {
            key = new RSAKeyGenerator(2048).keyID("fixture-key").generate();
            provider = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            provider.createContext("/keys", exchange -> reply(exchange, new JWKSet(key.toPublicJWK()).toJSONObject()));
            provider.createContext("/token", GoogleLoginIntegrationTest::token);
            provider.createContext("/userinfo", exchange -> reply(exchange, Map.of("sub", subject)));
            provider.start();
            String root = "http://127.0.0.1:" + provider.getAddress().getPort();
            var google = CommonOAuth2Provider.GOOGLE.getBuilder("google")
                    .clientId(CLIENT).clientSecret("fixture-only").issuerUri(ISSUER).scope("openid", "email")
                    .authorizationUri(root + "/authorize").tokenUri(root + "/token")
                    .jwkSetUri(root + "/keys").userInfoUri(root + "/userinfo").redirectUri(CALLBACK).build();
            return new InMemoryClientRegistrationRepository(google);
        }
    }

    @AfterAll static void stopProvider() {
        if (provider != null) provider.stop(0);
    }

    private static void reply(HttpExchange exchange, Object data) throws IOException {
        byte[] body = JSON.writeValueAsBytes(data);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, body.length);
        try (var out = exchange.getResponseBody()) { out.write(body); }
    }

    private static void token(HttpExchange exchange) throws IOException {
        String form = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        if (!form.contains("code_verifier=")) {
            exchange.sendResponseHeaders(400, -1);
            exchange.close();
            return;
        }
        var now = Instant.now();
        var claims = new JWTClaimsSet.Builder().issuer(ISSUER).subject(subject).audience(CLIENT)
                .issueTime(Date.from(now)).expirationTime(Date.from(now.plusSeconds(300)))
                .claim("nonce", nonce).build();
        var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
        try {
            jwt.sign(new RSASSASigner(key));
        } catch (JOSEException e) {
            throw new IOException(e);
        }
        reply(exchange, Map.of("id_token", jwt.serialize(), "access_token", "fixture-access",
                "token_type", "Bearer", "expires_in", 300, "scope", "openid email"));
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api" + path));
    }

    private HttpResponse<String> send(HttpRequest.Builder req) throws Exception {
        return browser.send(req.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(String path, String body) throws Exception {
        JsonNode csrf = JSON.readTree(send(request("/auth/csrf")).body());
        return send(request(path).header(csrf.get("headerName").asText(), csrf.get("token").asText())
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)));
    }

    private String start() throws Exception {
        var response = send(request("/oauth2/authorization/google"));
        assertEquals(302, response.statusCode());
        var params = UriComponentsBuilder.fromUriString(response.headers().firstValue("Location").orElseThrow())
                .build().getQueryParams();
        assertEquals("S256", params.getFirst("code_challenge_method"));
        assertEquals(CALLBACK, URLDecoder.decode(params.getFirst("redirect_uri"), StandardCharsets.UTF_8));
        nonce = params.getFirst("nonce");
        assertNotNull(nonce);
        return params.getFirst("state");
    }

    private String callback(String query) throws Exception {
        var response = send(request("/login/oauth2/code/google?" + query));
        assertEquals(302, response.statusCode());
        return response.headers().firstValue("Location").orElseThrow();
    }

    @Test void firstLoginRequiresNicknameAndReturningUserKeepsLearningSet() throws Exception {
        subject = UUID.randomUUID().toString();
        assertEquals("http://localhost:3000/signup/google", callback("code=fixture&state=" + start()));
        assertEquals(401, send(request("/users/me")).statusCode());
        assertEquals(403, send(request("/auth/google/onboarding").POST(HttpRequest.BodyPublishers.noBody())).statusCode());
        assertEquals(400, post("/auth/google/onboarding", "{\"nickname\":\" \"}").statusCode());
        assertEquals(204, post("/auth/google/onboarding", "{\"nickname\":\"학습자\"}").statusCode());
        String account = send(request("/users/me")).body();
        assertEquals("학습자", JSON.readTree(account).get("nickname").asText());
        long deck = createdId("/decks", "{\"name\":\"내 폴더\"}");
        long section = createdId("/decks/" + deck + "/categories", "{\"name\":\"기본\",\"sortOrder\":0}");
        long set = createdId("/categories/" + section + "/materials", "{\"title\":\"첫 세트\"}");
        String setPath = "/categories/" + section + "/materials/" + set;
        assertEquals(204, post("/auth/logout", "").statusCode());
        assertEquals("http://localhost:3000/", callback("code=fixture&state=" + start()));
        var revisit = send(request("/users/me"));
        assertEquals(account, revisit.body());
        assertTrue(revisit.headers().allValues("Set-Cookie").stream()
                .anyMatch(cookie -> cookie.contains("Max-Age=2592000")));
        assertEquals("첫 세트", JSON.readTree(send(request(setPath)).body()).get("title").asText());

        subject = UUID.randomUUID().toString();
        assertEquals("http://localhost:3000/signup/google", callback("code=fixture&state=" + start()));
        assertEquals(204, post("/auth/google/onboarding", "{\"nickname\":\"학습자\"}").statusCode());
        assertEquals(404, send(request(setPath)).statusCode());
    }

    private long createdId(String path, String body) throws Exception {
        var response = post(path, body);
        assertEquals(201, response.statusCode(), response.body());
        return JSON.readTree(response.body()).get("id").asLong();
    }

    @Test void expiredOnboardingCannotCreateAccount() throws Exception {
        subject = UUID.randomUUID().toString();
        assertEquals("http://localhost:3000/signup/google", callback("code=fixture&state=" + start()));
        when(clock.instant()).thenReturn(Instant.now().plusSeconds(601));
        assertEquals(401, post("/auth/google/onboarding", "{\"nickname\":\"만료\"}").statusCode());
        assertEquals(401, send(request("/users/me")).statusCode());
    }

    @Test void invalidStateNonceAndCancellationCannotStartOnboarding() throws Exception {
        subject = "failed-login";
        start();
        String failed = "http://localhost:3000/login?google=failed";
        assertEquals(failed, callback("code=fixture&state=invalid"));
        String state = start();
        nonce = "incorrect-nonce";
        assertEquals(failed, callback("code=fixture&state=" + state));
        assertEquals(failed, callback("error=access_denied&state=" + start()));
        assertEquals(401, post("/auth/google/onboarding", "{\"nickname\":\"거부\"}").statusCode());
        assertEquals(401, send(request("/users/me")).statusCode());
    }
}
