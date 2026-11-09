package com.passmate.auth;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@EnabledIfEnvironmentVariable(named = "PASSMATE_POSTGRES_TEST", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=${PASSMATE_DB_URL}", "spring.jpa.hibernate.ddl-auto=validate",
        "passmate.google.enabled=true", "passmate.google.client-id=fixture-client",
        "passmate.google.client-secret=fixture-only"
})
@Import(GoogleLoginIntegrationTest.Fixture.class)
@ActiveProfiles("postgres")
class GooglePostgresIntegrationTest extends GoogleLoginIntegrationTest {}
