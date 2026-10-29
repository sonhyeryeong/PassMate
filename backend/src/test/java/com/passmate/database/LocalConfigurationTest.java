package com.passmate.database;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LocalConfigurationTest {
    @TempDir Path directory;
    @Configuration(proxyBeanMethods = false)
    static class SettingsOnly {}

    @Test
    void externalYamlLoadsQuotedPasswordAndEnvironmentOverridesIt() throws Exception {
        Path yaml = directory.resolve("application-local.yml");
        Files.writeString(yaml, "PASSMATE_DB_URL: 'jdbc:postgresql://example.invalid/test'\n"
                + "PASSMATE_DB_USERNAME: 'test-user'\n"
                + "PASSMATE_DB_PASSWORD: 'test:#$''한글\\value'\n");
        for (boolean override : new boolean[]{false, true}) {
            var environment = new StandardEnvironment();
            // 실제 개발 PC의 DB 환경변수에 의존하지 않는다.
            environment.getPropertySources().replace(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                    new SystemEnvironmentPropertySource("systemEnvironment", override
                            ? Map.<String, Object>of("PASSMATE_DB_PASSWORD", "environment-test-secret") : Map.of()));
            var app = new SpringApplication(SettingsOnly.class);
            app.setWebApplicationType(WebApplicationType.NONE);
            app.setEnvironment(environment);
            app.setRegisterShutdownHook(false);
            try (var context = app.run("--spring.config.location=classpath:/application-postgres.yml",
                    "--spring.config.additional-location=" + yaml.toUri())) {
                assertEquals("test-user", context.getEnvironment().getProperty("spring.datasource.username"));
                assertEquals(override ? "environment-test-secret" : "test:#$'한글\\value",
                        context.getEnvironment().getProperty("spring.datasource.password"));
            }
        }
    }
}
