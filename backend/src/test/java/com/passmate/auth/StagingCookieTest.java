package com.passmate.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@SpringBootTest(properties = {"PASSMATE_APP_ORIGIN=https://staging.example.invalid",
        "spring.datasource.url=jdbc:h2:mem:staging-cookie", "spring.jpa.hibernate.ddl-auto=create-drop"})
@AutoConfigureMockMvc
@ActiveProfiles("staging")
class StagingCookieTest {
    @Autowired MockMvc mvc;

    @Test void proxyAllowsOnlyConfiguredFrontendOrigin() throws Exception {
        var allowed = mvc.perform(get("/auth/csrf").header("Origin", "https://staging.example.invalid"))
                .andReturn().getResponse();
        assertEquals(200, allowed.getStatus());
        assertEquals("https://staging.example.invalid", allowed.getHeader("Access-Control-Allow-Origin"));
        assertEquals(403, mvc.perform(get("/auth/csrf").header("Origin", "https://other.example.invalid"))
                .andReturn().getResponse().getStatus());
    }

    @Test void sessionCookieIsRestrictedToTheHttpsApplicationHost() throws Exception {
        String cookie = mvc.perform(get("/auth/csrf").secure(true)).andReturn().getResponse().getHeader("Set-Cookie");
        assertNotNull(cookie);
        assertTrue(cookie.startsWith("__Host-PM_SESSION="));
        assertTrue(cookie.contains("Path=/;"));
        assertTrue(cookie.contains("Secure"));
        assertTrue(cookie.contains("HttpOnly"));
        assertTrue(cookie.contains("SameSite=Lax"));
        assertFalse(cookie.contains("Domain="));
    }
}
