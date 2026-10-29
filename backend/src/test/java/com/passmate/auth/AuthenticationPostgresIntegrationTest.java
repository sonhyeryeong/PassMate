package com.passmate.auth;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// 같은 인증·격리 계약을 실제 PostgreSQL의 자격 정보와 JDBC 세션으로 검증한다.
@EnabledIfEnvironmentVariable(named = "PASSMATE_POSTGRES_TEST", matches = "true")
@SpringBootTest(properties = {
        "spring.datasource.url=${PASSMATE_DB_URL}",
        "spring.jpa.hibernate.ddl-auto=validate"
})
@ActiveProfiles("postgres")
class AuthenticationPostgresIntegrationTest extends AuthenticationIntegrationTest {
}
